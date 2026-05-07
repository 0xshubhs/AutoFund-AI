"use client";

import AutoFundChartCard from "../components/AutoFundChartCard";
import AutoFundLayout from "../components/AutoFundLayout";
import ChartPanel from "../components/ChartPanel";
import KPICard from "../components/KPICard";
import StatusDot from "../components/StatusDot";
import { formatPct, formatUSD, useLiveData } from "@/lib/useLiveData";
import type {
  Decision,
  FundSummary,
  Holding,
  SeriesPoint,
  AllocationPoint,
} from "@/lib/types";

export default function DashboardPage() {
  const summary = useLiveData<FundSummary>("/api/autofund/summary", 5000);
  const series = useLiveData<SeriesPoint[]>("/api/autofund/series?points=36", 6000);
  const portfolio = useLiveData<{ holdings: Holding[]; allocationHistory: AllocationPoint[] }>(
    "/api/autofund/portfolio",
    7000,
  );
  const reasoning = useLiveData<Decision[]>("/api/autofund/reasoning", 9000);
  const risk = useLiveData<{
    score: number;
    regime: string;
    exposureCap: number;
    drawdown: SeriesPoint[];
  }>("/api/autofund/risk", 5500);

  const sum = summary.data;

  return (
    <AutoFundLayout title="Fund Control Center" subtitle="Execution + intelligence + risk in one view">
      <section className="border border-zinc-800 bg-[#0a0a0a]/85 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Fund Snapshot</h2>
          <StatusDot status={summary.status} updatedAt={summary.updatedAt} source={summary.source} />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <KPICard
            label="Net Asset Value"
            value={sum ? formatUSD(sum.nav) : "—"}
            delta={sum ? `24h ${formatPct(sum.alpha24h)}` : ""}
            tone={sum && sum.alpha24h >= 0 ? "positive" : "negative"}
          />
          <KPICard
            label="Alpha vs Index"
            value={sum ? formatPct(sum.alphaMTD) : "—"}
            delta={sum ? `YTD ${formatPct(sum.alphaYTD)}` : ""}
            tone={sum && sum.alphaMTD >= 0 ? "positive" : "negative"}
          />
          <KPICard
            label="Risk Regime"
            value={sum?.riskRegime ?? "—"}
            delta={sum ? `Score ${sum.riskScore}/100` : ""}
            tone={
              sum?.riskRegime === "Calm" || sum?.riskRegime === "Moderate"
                ? "positive"
                : sum?.riskRegime === "Stressed"
                  ? "negative"
                  : "warn"
            }
          />
          <KPICard
            label="Execution Uptime"
            value={sum ? `${sum.uptime.toFixed(1)}%` : "—"}
            delta={sum ? `Cap ${sum.exposureCap}%` : ""}
            tone="neutral"
          />
        </div>
      </section>

      <ChartPanel
        title="Portfolio vs Market"
        subtitle="Fund equity curve vs BTC vs index benchmark"
        status={series.status}
        source={series.source}
        updatedAt={series.updatedAt}
        note="Alpha is the spread between green (fund) and grey (index)."
        className="md:col-span-2"
      >
        {series.data && (
          <AutoFundChartCard payload={{ type: "multiline", data: series.data }} height={220} />
        )}
      </ChartPanel>

      <ChartPanel
        title="Risk Meter"
        subtitle="Composite of vol, drawdown, correlation, macro"
        status={risk.status}
        source={risk.source}
        updatedAt={risk.updatedAt}
        note={
          risk.data
            ? `${risk.data.regime} · exposure capped at ${risk.data.exposureCap}% per asset.`
            : "Risk-gated by adaptive engine."
        }
      >
        {risk.data && (
          <div className="relative">
            <AutoFundChartCard
              payload={{ type: "gauge", score: risk.data.score, cap: 80 }}
              height={170}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center">
              <p className="font-mono text-2xl font-semibold text-white">
                {risk.data.score}
                <span className="text-sm text-zinc-500">/100</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                cap {risk.data.exposureCap}%
              </p>
            </div>
          </div>
        )}
      </ChartPanel>

      <ChartPanel
        title="Allocation Over Time"
        subtitle="Sector rotation driven by strategy router"
        status={portfolio.status}
        source={portfolio.source}
        updatedAt={portfolio.updatedAt}
        note="Capital flows L1 → AI → DeFi → Stable as signals shift."
      >
        {portfolio.data && (
          <AutoFundChartCard
            payload={{ type: "stacked-area", data: portfolio.data.allocationHistory }}
            height={200}
          />
        )}
      </ChartPanel>

      <ChartPanel
        title="Drawdown Monitor"
        subtitle="Peak-to-trough envelope"
        status={risk.status}
        source={risk.source}
        updatedAt={risk.updatedAt}
        note="Triggers protection when below -4.8%."
      >
        {risk.data && (
          <AutoFundChartCard
            payload={{
              type: "drawdown",
              data: risk.data.drawdown.map((p) => ({ t: p.t, drawdown: p.drawdown })),
            }}
            height={200}
          />
        )}
      </ChartPanel>

      <section className="border border-zinc-800 bg-zinc-950/80 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Live AI Actions</h2>
          <StatusDot
            status={reasoning.status}
            updatedAt={reasoning.updatedAt}
            source={reasoning.source}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(reasoning.data ?? []).slice(0, 3).map((d) => (
            <article key={d.id} className="border border-zinc-800 bg-black p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                  conf {d.confidence}%
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {new Date(d.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-200">{d.summary}</p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
                {d.reasons.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            </article>
          ))}
          {!reasoning.data && (
            <div className="border border-zinc-800 bg-black p-3 text-xs text-zinc-500">
              Awaiting decision feed…
            </div>
          )}
        </div>
      </section>
    </AutoFundLayout>
  );
}
