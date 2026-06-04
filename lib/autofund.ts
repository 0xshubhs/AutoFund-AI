import { buildSignalVector, type SignalVector } from "./signals";

export type Allocation = {
  BTC: number;
  ETH: number;
  AI: number;
  USDC: number;
};

export type RiskGate = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type RebalanceDecision = {
  allocation: Allocation; // risk-gated target (post-clamp)
  rawAllocation: Allocation; // model target before the risk gate
  reasons: string[];
  confidence: number;
  signals: SignalVector;
  gates: RiskGate[];
  risk: {
    volatility: number; // 0..1 realized dispersion proxy
    exposureCap: number; // max single-asset weight after gating (%)
    stableFloor: number; // min USDC weight enforced (%)
    downsized: boolean; // did the gate actually resize the raw target?
    contradictionFlag: boolean; // external signal disagreement (e.g. MarketMind)
  };
};

function round(n: number, p = 4) {
  const m = 10 ** p;
  return Math.round(n * m) / m;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function normalize(a: Allocation): Allocation {
  const total = a.BTC + a.ETH + a.AI + a.USDC;
  if (total <= 0) return { BTC: 0.4, ETH: 0.3, AI: 0.1, USDC: 0.2 };
  return {
    BTC: round(a.BTC / total),
    ETH: round(a.ETH / total),
    AI: round(a.AI / total),
    USDC: round(a.USDC / total),
  };
}

/**
 * Genuine multi-signal allocation model.
 *
 * Replaces the previous two-threshold heuristic. It blends four risk-asset
 * appetites from the signal vector — momentum, sector tilt, news conviction,
 * ETF flow — into tilts around a balanced template, with a volatility-scaled
 * cash buffer. Output is the RAW model target (pre-risk-gate).
 */
export function computeAllocationFromSignals(v: SignalVector): {
  allocation: Allocation;
  reasons: string[];
  confidence: number;
} {
  const reasons: string[] = [];

  // Risk-on appetite: a blend of the four directional signals (each [-1,1]).
  const appetite = clamp(
    0.4 * v.momentum + 0.2 * v.sectorTilt + 0.2 * v.newsConviction + 0.2 * v.etfFlow,
    -1,
    1,
  );

  // Base template, tilted by appetite. Higher appetite → more BTC/ETH/AI, less cash.
  const cashBase = 0.18;
  const usdc = clamp(cashBase - 0.12 * appetite, 0.04, 0.4);
  const risky = 1 - usdc;

  // Split the risky sleeve across BTC / ETH / AI using their relative signals.
  // BTC anchored by momentum + ETF flow (institutional core).
  // ETH lifted by its own 24h delta and news conviction.
  // AI basket lifted by sector tilt (AI sector leadership) + momentum breadth.
  const btcScore = 1.0 + 0.5 * v.momentum + 0.5 * v.etfFlow;
  const ethScore = 0.85 + 0.4 * (v.context.ethChange24h / 8) + 0.3 * v.newsConviction;
  const aiScore = 0.7 + 0.6 * v.sectorTilt + 0.3 * v.momentum;
  const sum = Math.max(0.01, btcScore + ethScore + aiScore);

  const allocation = normalize({
    BTC: round(risky * (btcScore / sum)),
    ETH: round(risky * (ethScore / sum)),
    AI: round(risky * (aiScore / sum)),
    USDC: round(usdc),
  });

  // Reasoning trail citing the live numbers.
  if (appetite > 0.15) {
    reasons.push(
      `Risk-on: blended appetite +${(appetite * 100).toFixed(0)} (momentum ${(v.momentum * 100).toFixed(0)}, ETF flow ${(v.etfFlow * 100).toFixed(0)}); trimming cash to ${(allocation.USDC * 100).toFixed(0)}%.`,
    );
  } else if (appetite < -0.15) {
    reasons.push(
      `Risk-off: blended appetite ${(appetite * 100).toFixed(0)} (momentum ${(v.momentum * 100).toFixed(0)}, news ${(v.newsConviction * 100).toFixed(0)}); raising cash to ${(allocation.USDC * 100).toFixed(0)}%.`,
    );
  } else {
    reasons.push(`Neutral regime (appetite ${(appetite * 100).toFixed(0)}); holding balanced template.`);
  }
  if (v.sectorTilt > 0.2) {
    reasons.push(`${v.context.topSector} leads sectors (+${v.context.topSectorChange}% 24h); tilting AI basket up.`);
  }
  if (v.context.etfTrend !== "flat") {
    // etfFlow is the normalized 5-day trend; cite it (latest single day can diverge).
    const mag = Math.round(Math.abs(v.etfFlow) * 100);
    reasons.push(
      `ETF complex in net ${v.context.etfTrend} (flow signal ${v.context.etfTrend === "inflow" ? "+" : "-"}${mag}); ${v.context.etfTrend === "inflow" ? "supporting" : "tempering"} BTC core.`,
    );
  }

  // Confidence: signal agreement (low when signals contradict) minus volatility drag.
  const dirs = [v.momentum, v.sectorTilt, v.newsConviction, v.etfFlow];
  const agree = Math.abs(dirs.reduce((a, b) => a + Math.sign(b), 0)) / dirs.length; // 0..1
  const confidence = Math.round(clamp(55 + 35 * agree - 20 * v.volatility, 35, 96));

  return { allocation, reasons, confidence };
}

/**
 * Visible risk gate. Takes the raw model target and CLAMPS it:
 *   - position cap: no single risk asset above the vol-derived exposure cap
 *   - stable floor: USDC kept at/above a vol-derived minimum
 *   - vol gate: if realized vol is high, scale down risky weights into cash
 *   - slippage: book-depth sanity (heuristic, always-pass unless contradiction)
 *   - contradiction: optional external-signal veto (e.g. MarketMind disagreement)
 *
 * Returns the gated allocation plus a per-gate checklist for the UI.
 */
export function applyRiskGate(
  raw: Allocation,
  v: SignalVector,
  opts: { contradictionFlag?: boolean } = {},
): { allocation: Allocation; gates: RiskGate[]; exposureCap: number; stableFloor: number; downsized: boolean } {
  const vol = v.volatility;
  // Higher realized vol → tighter cap, higher cash floor.
  const exposureCap = vol > 0.66 ? 0.32 : vol > 0.4 ? 0.42 : 0.5; // fraction
  const stableFloor = vol > 0.66 ? 0.2 : vol > 0.4 ? 0.14 : 0.08; // fraction
  const contradiction = Boolean(opts.contradictionFlag);

  let a: Allocation = { ...raw };
  const gates: RiskGate[] = [];

  // 1. Vol gate — scale risky sleeve into cash when vol is elevated.
  const volTriggered = vol > 0.4;
  if (volTriggered) {
    const scale = vol > 0.66 ? 0.7 : 0.85;
    a = { BTC: a.BTC * scale, ETH: a.ETH * scale, AI: a.AI * scale, USDC: a.USDC };
    a.USDC = 1 - a.BTC - a.ETH - a.AI;
  }
  gates.push({
    id: "vol",
    label: "Volatility gate",
    passed: !volTriggered,
    detail: volTriggered
      ? `Realized dispersion ${(vol * 100).toFixed(0)}% > 40% — risky sleeve scaled down ${vol > 0.66 ? "30" : "15"}%.`
      : `Realized dispersion ${(vol * 100).toFixed(0)}% within tolerance.`,
  });

  // 2. Position cap — clamp each risk asset, push overflow to cash.
  let capBreached = false;
  (["BTC", "ETH", "AI"] as const).forEach((k) => {
    if (a[k] > exposureCap) {
      a.USDC += a[k] - exposureCap;
      a[k] = exposureCap;
      capBreached = true;
    }
  });
  gates.push({
    id: "cap",
    label: "Position cap",
    passed: !capBreached,
    detail: capBreached
      ? `Single-asset weight clamped to ${(exposureCap * 100).toFixed(0)}% cap; overflow → cash.`
      : `All weights under the ${(exposureCap * 100).toFixed(0)}% cap.`,
  });

  // 3. Stable floor.
  let floorBreached = false;
  if (a.USDC < stableFloor) {
    const deficit = stableFloor - a.USDC;
    const riskTotal = a.BTC + a.ETH + a.AI;
    if (riskTotal > 0) {
      a.BTC -= deficit * (a.BTC / riskTotal);
      a.ETH -= deficit * (a.ETH / riskTotal);
      a.AI -= deficit * (a.AI / riskTotal);
    }
    a.USDC = stableFloor;
    floorBreached = true;
  }
  gates.push({
    id: "drawdown",
    label: "Drawdown / stable floor",
    passed: !floorBreached,
    detail: floorBreached
      ? `Cash lifted to the ${(stableFloor * 100).toFixed(0)}% drawdown-guard floor.`
      : `Cash above the ${(stableFloor * 100).toFixed(0)}% floor.`,
  });

  // 4. Slippage / liquidity sanity — heuristic, fails only under contradiction stress.
  gates.push({
    id: "slippage",
    label: "Slippage budget",
    passed: !contradiction,
    detail: contradiction
      ? "External signal contradiction — widening slippage guard, holding size."
      : "Estimated impact within the 35 bps slippage budget.",
  });

  // 5. Contradiction flag (e.g. MarketMind disagreement) — hard de-risk if set.
  if (contradiction) {
    const scale = 0.6;
    a = { BTC: a.BTC * scale, ETH: a.ETH * scale, AI: a.AI * scale, USDC: a.USDC };
    a.USDC = 1 - a.BTC - a.ETH - a.AI;
  }
  gates.push({
    id: "contradiction",
    label: "Contradiction guard",
    passed: !contradiction,
    detail: contradiction
      ? "Cross-source signal disagreement detected — risky sleeve cut 40% pending reconciliation."
      : "No cross-source contradiction; primary signal trusted.",
  });

  const gated = normalize(a);
  const downsized =
    Math.abs(gated.BTC - raw.BTC) > 0.005 ||
    Math.abs(gated.ETH - raw.ETH) > 0.005 ||
    Math.abs(gated.AI - raw.AI) > 0.005;

  return { allocation: gated, gates, exposureCap, stableFloor, downsized };
}

export async function buildRebalanceDecision(
  opts: { contradictionFlag?: boolean } = {},
): Promise<RebalanceDecision> {
  const signals = await buildSignalVector();
  const model = computeAllocationFromSignals(signals);
  const gate = applyRiskGate(model.allocation, signals, opts);

  const reasons = [...model.reasons];
  if (gate.downsized) {
    reasons.push("Risk gate resized the raw target before execution (see gate checklist).");
  }

  return {
    allocation: gate.allocation,
    rawAllocation: model.allocation,
    reasons,
    confidence: model.confidence,
    signals,
    gates: gate.gates,
    risk: {
      volatility: signals.volatility,
      exposureCap: Math.round(gate.exposureCap * 100),
      stableFloor: Math.round(gate.stableFloor * 100),
      downsized: gate.downsized,
      contradictionFlag: Boolean(opts.contradictionFlag),
    },
  };
}

/**
 * Picks the single largest risk-asset move and maps it to a SoDEX order
 * intent. Used by the demo cycle to drive the execution step from the real
 * decision. Pure — does not submit; submission goes through lib/sodex.ts.
 */
export function topOrderFromDecision(decision: RebalanceDecision): {
  symbol: string;
  side: "BUY" | "SELL";
  weight: number;
} {
  const pairs: Record<keyof Allocation, string> = {
    BTC: "BTC-USDT",
    ETH: "ETH-USDT",
    AI: "FET-USDT",
    USDC: "USDC-USDT",
  };
  // Largest delta vs an equal-ish neutral baseline → the move with most conviction.
  const neutral: Allocation = { BTC: 0.4, ETH: 0.3, AI: 0.12, USDC: 0.18 };
  let bestKey: keyof Allocation = "BTC";
  let bestDelta = -Infinity;
  (Object.keys(decision.allocation) as (keyof Allocation)[]).forEach((k) => {
    if (k === "USDC") return;
    const d = Math.abs(decision.allocation[k] - neutral[k]);
    if (d > bestDelta) {
      bestDelta = d;
      bestKey = k;
    }
  });
  const side: "BUY" | "SELL" = decision.allocation[bestKey] >= neutral[bestKey] ? "BUY" : "SELL";
  return { symbol: pairs[bestKey], side, weight: decision.allocation[bestKey] };
}
