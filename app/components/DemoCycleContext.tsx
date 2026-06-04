"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";

export type CycleStep = {
  id: string;
  label: string;
  detail: string;
  durationMs: number;
};

export const DEMO_STEPS: CycleStep[] = [
  {
    id: "ingest",
    label: "Ingesting signals",
    detail: "SoSoValue market snapshot · sector spotlight · news · ETF flow",
    durationMs: 700,
  },
  {
    id: "score",
    label: "Scoring strategies",
    detail: "Momentum / Index / News / Balanced — picking highest expected alpha",
    durationMs: 700,
  },
  {
    id: "risk",
    label: "Risk-gating",
    detail: "Vol, position cap, drawdown, slippage — clamping exposure",
    durationMs: 700,
  },
  {
    id: "decide",
    label: "Reasoning",
    detail: "Allocation delta with confidence + explainability trail",
    durationMs: 700,
  },
  {
    id: "execute",
    label: "Executing on SoDEX",
    detail: "Top allocation → EIP-712 order, testnet submit or dry-run",
    durationMs: 900,
  },
  {
    id: "settle",
    label: "Settled",
    detail: "Decision logged, charts refreshed, audit trail saved",
    durationMs: 500,
  },
];

// Shapes mirror the rebalance + sodex-order envelopes.
export type CycleAllocation = { BTC: number; ETH: number; AI: number; USDC: number };
export type CycleGate = { id: string; label: string; passed: boolean; detail: string };

export type RebalanceResult = {
  allocation: CycleAllocation;
  rawAllocation: CycleAllocation;
  reasons: string[];
  confidence: number;
  gates: CycleGate[];
  risk: { volatility: number; exposureCap: number; stableFloor: number; downsized: boolean };
  suggestedOrder: { symbol: string; side: "BUY" | "SELL"; weight: number };
  signals: {
    momentum: number;
    sectorTilt: number;
    newsConviction: number;
    etfFlow: number;
    volatility: number;
    source: string;
    context: { topSector: string; topSectorChange: number; etfTrend: string; etfNetInflow: number };
  };
  source: string;
};

export type OrderResult = {
  mode: "live" | "dry-run";
  ok: boolean;
  orderId?: string;
  explorerUrl?: string;
  payload: { symbol: string; side: number; size: string; price: string; nonce: string };
  source: string;
};

export type OnChainProof = {
  chainId: number | null;
  blockNumber: number | null;
  blockTimestamp: number | null;
  live: boolean;
};

type CycleState = {
  running: boolean;
  finishedAt: number | null;
  startedAt: number | null;
  step: number;
  rebalance: RebalanceResult | null;
  order: OrderResult | null;
  onchain: OnChainProof | null; // real ValueChain block observed at settle
  error: string | null;
  live: boolean; // true once a real backend response was consumed
};

type DemoCycleContextValue = CycleState & {
  steps: CycleStep[];
  start: () => void;
};

const Ctx = createContext<DemoCycleContextValue | null>(null);

const INITIAL: CycleState = {
  running: false,
  finishedAt: null,
  startedAt: null,
  step: -1,
  rebalance: null,
  order: null,
  onchain: null,
  error: null,
  live: false,
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function DemoCycleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CycleState>(INITIAL);
  const runIdRef = useRef(0);

  const start = useCallback(() => {
    const runId = ++runIdRef.current;
    setState({ ...INITIAL, running: true, startedAt: Date.now(), step: 0 });

    const alive = () => runIdRef.current === runId;
    const setStep = (n: number) => alive() && setState((s) => ({ ...s, step: n }));

    (async () => {
      // Step 0: Ingest + Step 1: Score + Step 2: Risk + Step 3: Reason are all
      // satisfied by the real /rebalance call (signals → scored decision →
      // risk-gated target). We animate the steps around the single fetch so the
      // pipeline reads as discrete stages while being backed by real data.
      let rebalance: RebalanceResult | null = null;
      try {
        const res = await fetch("/api/autofund/rebalance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (json.ok) rebalance = json.data as RebalanceResult;
      } catch {
        // network failure → stay in animation-only fallback below
      }
      if (!alive()) return;

      // Walk steps 0→3 with the decision in hand.
      await delay(DEMO_STEPS[0].durationMs);
      if (!alive()) return;
      setState((s) => ({ ...s, step: 1, rebalance, live: Boolean(rebalance) }));
      await delay(DEMO_STEPS[1].durationMs);
      setStep(2);
      await delay(DEMO_STEPS[2].durationMs);
      setStep(3);
      await delay(DEMO_STEPS[3].durationMs);
      if (!alive()) return;

      // Step 4: Execute — submit the top allocation as a SoDEX order.
      setStep(4);
      let order: OrderResult | null = null;
      try {
        const body = rebalance?.suggestedOrder
          ? { symbol: rebalance.suggestedOrder.symbol, side: rebalance.suggestedOrder.side }
          : {};
        const res = await fetch("/api/autofund/sodex-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.data) order = { ...(json.data as OrderResult), source: json.source };
      } catch {
        // dry-run fetch failed; leave order null
      }
      if (!alive()) return;
      setState((s) => ({ ...s, order }));
      await delay(DEMO_STEPS[4].durationMs);
      if (!alive()) return;

      // Step 5: Settle — anchor the decision to a REAL ValueChain L1 block
      // height (keyless on-chain read). This is the live-chain audit reference.
      setState((s) => ({ ...s, step: 5 }));
      let onchain: OnChainProof | null = null;
      try {
        const res = await fetch("/api/autofund/onchain", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) {
          const vc = json.data.valuechain;
          onchain = {
            chainId: vc.chainId,
            blockNumber: vc.blockNumber,
            blockTimestamp: vc.blockTimestamp,
            live: Boolean(vc.live),
          };
        }
      } catch {
        // chain read failed; settle without the anchor
      }
      if (!alive()) return;
      setState((s) => ({ ...s, onchain }));
      await delay(DEMO_STEPS[5].durationMs);
      if (!alive()) return;
      setState((s) => ({ ...s, running: false, finishedAt: Date.now() }));
    })();
  }, []);

  const value = useMemo<DemoCycleContextValue>(
    () => ({ ...state, steps: DEMO_STEPS, start }),
    [state, start],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoCycle() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemoCycle must be used within DemoCycleProvider");
  return v;
}
