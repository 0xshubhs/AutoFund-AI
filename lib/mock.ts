import type {
  AllocationPoint,
  Decision,
  FundSummary,
  Holding,
  Order,
  RiskBreakdown,
  SeriesPoint,
  StrategyState,
} from "./types";

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

function bucketSeed(bucketMs: number) {
  return Math.floor(Date.now() / bucketMs);
}

export function buildSeries(points = 30): SeriesPoint[] {
  const seed = bucketSeed(MIN_MS);
  const rand = mulberry32(seed);

  let portfolio = 100;
  let btc = 100;
  let eth = 100;
  let index = 100;
  let peak = 100;

  const out: SeriesPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const drift = (rand() - 0.45) * 1.6;
    const beta = (rand() - 0.5) * 1.2;
    portfolio += drift + 0.4;
    btc += beta + 0.18;
    eth += beta * 1.1 + 0.22;
    index += beta * 0.6 + 0.12;
    peak = Math.max(peak, portfolio);
    const dd = ((portfolio - peak) / peak) * 100;
    const risk = clamp(40 + (rand() - 0.5) * 24 + Math.max(0, -dd) * 4, 12, 96);
    const ts = Date.now() - i * HOUR_MS;
    out.push({
      t: new Date(ts).toISOString().slice(11, 16),
      ts,
      portfolio: round(portfolio),
      btc: round(btc),
      eth: round(eth),
      index: round(index),
      risk: round(risk, 1),
      drawdown: round(dd, 2),
    });
  }
  return out;
}

export function buildAllocationHistory(points = 12): AllocationPoint[] {
  const rand = mulberry32(bucketSeed(HOUR_MS));
  const out: AllocationPoint[] = [];
  let l1 = 44, ai = 22, defi = 18, stable = 16;
  for (let i = points - 1; i >= 0; i--) {
    l1 = clamp(l1 + (rand() - 0.5) * 4, 24, 52);
    ai = clamp(ai + (rand() - 0.4) * 4, 14, 38);
    defi = clamp(defi + (rand() - 0.5) * 3, 10, 26);
    stable = 100 - l1 - ai - defi;
    out.push({
      t: `T-${i * 6}h`,
      l1: round(l1),
      ai: round(ai),
      defi: round(defi),
      stable: round(stable),
    });
  }
  return out;
}

export function buildHoldings(): Holding[] {
  const rand = mulberry32(bucketSeed(MIN_MS));
  const base: Omit<Holding, "price" | "pnlPct">[] = [
    { symbol: "BTC", weight: 38, entryPrice: 62140, source: "SoSoValue" },
    { symbol: "ETH", weight: 28, entryPrice: 3050, source: "SoSoValue" },
    { symbol: "SOL", weight: 12, entryPrice: 142.4, source: "SoSoValue" },
    { symbol: "AI Basket", weight: 14, entryPrice: 100, source: "internal" },
    { symbol: "USDC", weight: 8, entryPrice: 1, source: "internal" },
  ];
  return base.map((h) => {
    const driftPct = h.symbol === "USDC" ? 0 : (rand() - 0.4) * 8;
    const price = round(h.entryPrice * (1 + driftPct / 100), h.entryPrice < 10 ? 4 : 2);
    return {
      ...h,
      price,
      pnlPct: round(driftPct, 2),
    };
  });
}

export function buildFundSummary(): FundSummary {
  const series = buildSeries(36);
  const last = series[series.length - 1];
  const nav = round(1_280_000 * (last.portfolio / 100), 0);
  const alpha24h = round(last.portfolio - series[Math.max(0, series.length - 24)].portfolio, 2);
  const alphaMTD = round(last.portfolio - 100, 2);
  const alphaYTD = round(alphaMTD * 2.2, 2);
  const score = clamp(round(last.risk, 0), 8, 95);
  const regime: FundSummary["riskRegime"] =
    score < 30 ? "Calm" : score < 55 ? "Moderate" : score < 78 ? "Elevated" : "Stressed";
  return {
    nav,
    alpha24h,
    alphaMTD,
    alphaYTD,
    riskRegime: regime,
    riskScore: score,
    exposureCap: score < 55 ? 45 : score < 78 ? 38 : 28,
    uptime: 99.3,
    updatedAt: Date.now(),
  };
}

export function buildRiskBreakdown(): RiskBreakdown {
  const summary = buildFundSummary();
  const rand = mulberry32(bucketSeed(MIN_MS));
  const base = summary.riskScore;
  return {
    volatility: clamp(round(base + (rand() - 0.4) * 18, 0), 5, 99),
    drawdown: clamp(round(base * 0.85 + (rand() - 0.4) * 14, 0), 5, 99),
    liquidity: clamp(round(38 + (rand() - 0.5) * 16, 0), 5, 90),
    correlation: clamp(round(60 + (rand() - 0.5) * 20, 0), 5, 95),
    macro: clamp(round(50 + (rand() - 0.5) * 24, 0), 5, 95),
  };
}

export function buildStrategyState(): StrategyState {
  const summary = buildFundSummary();
  const rand = mulberry32(bucketSeed(HOUR_MS));
  const momentum = clamp(round(70 + (rand() - 0.5) * 24, 0), 25, 96);
  const index = clamp(round(55 + (rand() - 0.5) * 18, 0), 25, 88);
  const news = clamp(round(48 + (rand() - 0.5) * 24, 0), 18, 92);
  const balanced = clamp(round(60 + (rand() - 0.5) * 14, 0), 35, 85);
  const scores = { momentum, index, news, balanced };
  const active = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as StrategyState["active"];
  return {
    active,
    scores,
    exposureCap: summary.exposureCap,
    stableFloor: summary.riskScore > 70 ? 18 : 12,
    rebalanceTrigger:
      summary.riskRegime === "Stressed"
        ? "drawdown guard"
        : summary.riskScore > 60
          ? "vol spike"
          : "scheduled",
  };
}

const REASON_BANK = [
  "Momentum score crossed 80; tilting toward leaders.",
  "ETF inflow trend positive; increasing core BTC weight.",
  "Macro vol spike detected; trimming risk by 6%.",
  "AI sector beta rising; rotating from L1 → AI basket.",
  "Drawdown guard armed at -4.8%; raising stable floor.",
  "News conviction strong on ETH; +3% ETH rotation.",
  "Correlation regime tightened; diversifying into defi.",
];

export function buildDecisionFeed(count = 6): Decision[] {
  const out: Decision[] = [];
  const now = Date.now();
  const rand = mulberry32(bucketSeed(HOUR_MS));
  for (let i = 0; i < count; i++) {
    const ts = now - i * 27 * MIN_MS;
    const conf = clamp(round(72 + (rand() - 0.4) * 22, 0), 45, 97);
    const r1 = REASON_BANK[Math.floor(rand() * REASON_BANK.length)];
    const r2 = REASON_BANK[Math.floor(rand() * REASON_BANK.length)];
    const before = [
      { symbol: "BTC", weight: 42 + Math.floor(rand() * 4) },
      { symbol: "ETH", weight: 28 + Math.floor(rand() * 4) },
      { symbol: "AI", weight: 18 + Math.floor(rand() * 4) },
      { symbol: "USDC", weight: 12 - Math.floor(rand() * 3) },
    ];
    const after = before.map((b, idx) => ({
      symbol: b.symbol,
      weight: b.weight + (idx === 0 ? -7 : idx === 1 ? +4 : idx === 2 ? +5 : -2),
    }));
    out.push({
      id: `dec_${ts}`,
      ts,
      summary:
        i === 0
          ? "Allocation shifted -7% BTC into ETH and AI basket."
          : "Risk-adjusted rotation triggered by signal threshold cross.",
      signals: [
        { label: "Momentum", score: clamp(round(70 + (rand() - 0.4) * 24, 0), 30, 96) },
        { label: "Macro Risk", score: clamp(round(56 + (rand() - 0.5) * 24, 0), 25, 92) },
        { label: "News Conviction", score: clamp(round(60 + (rand() - 0.5) * 24, 0), 28, 94) },
        { label: "Liquidity", score: clamp(round(45 + (rand() - 0.5) * 18, 0), 20, 84) },
      ],
      confidence: conf,
      before,
      after,
      reasons: Array.from(new Set([r1, r2])).slice(0, 2),
    });
  }
  return out;
}

const PAIRS = ["ETH-USDT", "BTC-USDT", "SOL-USDT", "ARB-USDT"];

export function buildOrders(count = 8): Order[] {
  const out: Order[] = [];
  const rand = mulberry32(bucketSeed(MIN_MS));
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const pair = PAIRS[Math.floor(rand() * PAIRS.length)];
    const side: Order["side"] = rand() > 0.5 ? "BUY" : "SELL";
    const status: Order["status"] =
      i === 0 && rand() > 0.7
        ? "PENDING"
        : i < 2 && rand() > 0.6
          ? "PARTIAL"
          : "FILLED";
    out.push({
      id: `ord_${now - i * 47_000}`,
      ts: now - i * 47_000,
      pair,
      side,
      size: round(0.05 + rand() * 1.2, 3),
      price: round(60_000 + (rand() - 0.5) * 4000, 2),
      status,
      slippageBps: round(rand() * 18, 1),
      ackMs: round(80 + rand() * 220, 0),
    });
  }
  return out;
}

function round(n: number, places = 2) {
  const m = 10 ** places;
  return Math.round(n * m) / m;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
