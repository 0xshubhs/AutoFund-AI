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
    detail: "SoSoValue market snapshot · sector spotlight · ETF flow",
    durationMs: 900,
  },
  {
    id: "score",
    label: "Scoring strategies",
    detail: "Momentum / Index / News / Balanced — picking highest expected alpha",
    durationMs: 900,
  },
  {
    id: "risk",
    label: "Risk-gating",
    detail: "Vol, drawdown, correlation, macro — capping exposure",
    durationMs: 900,
  },
  {
    id: "decide",
    label: "Reasoning",
    detail: "Drafting allocation delta with explainability trail",
    durationMs: 900,
  },
  {
    id: "execute",
    label: "Executing on SoDEX",
    detail: "Sliced orders, slippage-aware, ack < 250ms",
    durationMs: 1200,
  },
  {
    id: "settle",
    label: "Settled",
    detail: "Decision logged, charts refreshed, audit trail saved",
    durationMs: 600,
  },
];

type CycleState = {
  running: boolean;
  finishedAt: number | null;
  startedAt: number | null;
  step: number;
};

type DemoCycleContextValue = CycleState & {
  steps: CycleStep[];
  start: () => void;
};

const Ctx = createContext<DemoCycleContextValue | null>(null);

export function DemoCycleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CycleState>({
    running: false,
    finishedAt: null,
    startedAt: null,
    step: -1,
  });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setState({ running: true, finishedAt: null, startedAt: Date.now(), step: 0 });
    let cumulative = 0;
    DEMO_STEPS.forEach((step, idx) => {
      cumulative += step.durationMs;
      const t = setTimeout(() => {
        setState((s) =>
          idx === DEMO_STEPS.length - 1
            ? { ...s, step: idx, running: false, finishedAt: Date.now() }
            : { ...s, step: idx + 1 },
        );
      }, cumulative);
      timersRef.current.push(t);
    });
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
