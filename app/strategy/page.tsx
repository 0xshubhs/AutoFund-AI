"use client";

import AutoFundChartCard from "../components/AutoFundChartCard";
import AutoFundLayout from "../components/AutoFundLayout";
import ChartPanel from "../components/ChartPanel";
import StatusDot from "../components/StatusDot";
import { useLiveData } from "@/lib/useLiveData";
import type { SeriesPoint, StrategyState } from "@/lib/types";

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  momentum: "Buys leaders, trims laggards. Wins in trends, loses in chop.",
  index: "Tracks a sector index. Low decisions, low edge.",
  news: "Routes capital based on conviction-weighted news + ETF flows.",
  balanced: "60/30/10 base mix with risk-parity tilt.",
};

export default function StrategyPage() {
  const strategy = useLiveData<StrategyState>("/api/autofund/strategy", 7000);
  const series = useLiveData<SeriesPoint[]>("/api/autofund/series?points=48", 8000);
  const state = strategy.data;
  const scoreEntries = state ? (Object.entries(state.scores) as [string, number][]) : [];
  const sorted = scoreEntries.sort((a, b) => b[1] - a[1]);

  return (
    <AutoFundLayout title="Strategy Lab" subtitle="Adaptive strategy router with risk constraints">
      <section className="border border-zinc-800 bg-[#0a0a0a]/85 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Active Strategy</h2>
          <StatusDot
            status={strategy.status}
            updatedAt={strategy.updatedAt}
            source={strategy.source}
          />
        </div>
        {state && (
          <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
            <div className="border border-emerald-500/60 bg-emerald-500/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-300">
                Selected · trigger {state.rebalanceTrigger}
              </p>
              <p className="mt-2 text-3xl font-bold capitalize text-white">{state.active}</p>
              <p className="mt-2 text-[12px] text-zinc-300">
                {STRATEGY_DESCRIPTIONS[state.active]}
              </p>
            </div>
            <div className="grid gap-2">
              {sorted.map(([name, score]) => {
                const active = name === state.active;
                return (
                  <div
                    key={name}
                    className={`relative border bg-black p-3 text-sm ${active ? "border-emerald-500" : "border-zinc-800"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize text-zinc-100">{name}</span>
                      <span className="font-mono text-xs text-zinc-300">{score}/100</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-zinc-900">
                      <div
                        className={`h-full ${active ? "bg-emerald-400" : "bg-zinc-600"}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {STRATEGY_DESCRIPTIONS[name]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-emerald-300">Constraints</h2>
        <div className="grid gap-2 text-sm">
          <ConstraintRow
            label="Max allocation per asset"
            value={state ? `${state.exposureCap}%` : "—"}
          />
          <ConstraintRow
            label="Stable reserve floor"
            value={state ? `${state.stableFloor}%` : "—"}
          />
          <ConstraintRow label="Max sector exposure" value="55%" />
          <ConstraintRow label="Slippage tolerance" value="35 bps" />
        </div>
      </section>

      <section className="border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-emerald-300">Adaptive Triggers</h2>
        <div className="grid gap-2 text-sm">
          <ConstraintRow label="Market move" value="> 2.5% in 1h" />
          <ConstraintRow label="Macro event proximity" value="< 4h" />
          <ConstraintRow label="Volatility spike" value="+30% over baseline" />
          <ConstraintRow label="Approval mode" value="auto with override" />
        </div>
      </section>

      <ChartPanel
        title="Risk-adjusted Equity"
        subtitle="Strategy router applied to portfolio NAV"
        status={series.status}
        source={series.source}
        updatedAt={series.updatedAt}
        className="md:col-span-2"
      >
        {series.data && (
          <AutoFundChartCard payload={{ type: "multiline", data: series.data }} height={220} />
        )}
      </ChartPanel>
    </AutoFundLayout>
  );
}

function ConstraintRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-zinc-800 bg-black px-3 py-2">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono text-zinc-100">{value}</span>
    </div>
  );
}
