"use client";

import AutoFundChartCard from "../components/AutoFundChartCard";
import AutoFundLayout from "../components/AutoFundLayout";
import AuditExportButton from "../components/AuditExportButton";
import ChartPanel from "../components/ChartPanel";
import CopilotPanel from "../components/CopilotPanel";
import NewsFeed from "../components/NewsFeed";
import StatusDot from "../components/StatusDot";
import { useLiveData } from "@/lib/useLiveData";
import type { Decision, RiskBreakdown } from "@/lib/types";

export default function ReasoningPage() {
  const decisions = useLiveData<Decision[]>("/api/autofund/reasoning", 7000);
  const risk = useLiveData<{ breakdown: RiskBreakdown }>("/api/autofund/risk", 7000);

  const latest = decisions.data?.[0];
  const radar = risk.data
    ? Object.entries(risk.data.breakdown).map(([k, v]) => ({
        subject: k.charAt(0).toUpperCase() + k.slice(1),
        v,
      }))
    : [];

  return (
    <AutoFundLayout title="AI Decisions" subtitle="Explainable actions with signals and confidence">
      <CopilotPanel />

      <NewsFeed />

      <section className="border border-zinc-800 bg-[#0a0a0a]/85 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Latest Decision</h2>
          <div className="flex items-center gap-3">
            <AuditExportButton />
            <StatusDot
              status={decisions.status}
              updatedAt={decisions.updatedAt}
              source={decisions.source}
            />
          </div>
        </div>
        {latest ? (
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="border border-emerald-500/40 bg-zinc-950 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
                  decision · {latest.id.slice(-6)}
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {new Date(latest.ts).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-base text-zinc-100">{latest.summary}</p>
              <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                {latest.reasons.map((r) => (
                  <li key={r} className="border-l-2 border-emerald-500/60 pl-2">{r}</li>
                ))}
              </ul>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400">
                Confidence
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-white">
                {latest.confidence}%
              </p>
              <div className="mt-2 h-1.5 w-full bg-zinc-900">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${latest.confidence}%` }}
                />
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">
                Confidence combines signal alignment, regime certainty, and execution health.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Awaiting reasoning feed…</p>
        )}
      </section>

      <ChartPanel
        title="Signals Used"
        subtitle="Score per signal class for latest decision"
        status={decisions.status}
        source={decisions.source}
        updatedAt={decisions.updatedAt}
      >
        {latest && (
          <AutoFundChartCard
            payload={{
              type: "bar-compare",
              data: latest.signals.map((s) => ({
                name: s.label,
                before: 0,
                after: s.score,
              })),
            }}
            height={210}
          />
        )}
      </ChartPanel>

      <ChartPanel
        title="Risk Breakdown"
        subtitle="Components feeding the risk gate"
        status={risk.status}
        source={risk.source}
        updatedAt={risk.updatedAt}
      >
        {radar.length > 0 && (
          <AutoFundChartCard payload={{ type: "radar", data: radar }} height={210} />
        )}
      </ChartPanel>

      <ChartPanel
        title="Rebalance Impact"
        subtitle="Allocation before vs after"
        status={decisions.status}
        source={decisions.source}
        updatedAt={decisions.updatedAt}
        className="md:col-span-2"
      >
        {latest && (
          <AutoFundChartCard
            payload={{
              type: "bar-compare",
              data: latest.before.map((b, i) => ({
                name: b.symbol,
                before: b.weight,
                after: latest.after[i].weight,
              })),
            }}
            height={220}
          />
        )}
      </ChartPanel>

      <section className="border border-zinc-800 bg-zinc-950/80 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Decision Timeline</h2>
          <StatusDot
            status={decisions.status}
            updatedAt={decisions.updatedAt}
            source={decisions.source}
          />
        </div>
        <ol className="space-y-2 text-xs">
          {(decisions.data ?? []).map((d) => (
            <li
              key={d.id}
              className="grid gap-2 border border-zinc-800 bg-black p-3 md:grid-cols-[110px_70px_1fr]"
            >
              <span className="font-mono text-[11px] text-zinc-500">
                {new Date(d.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="font-mono text-[11px] text-emerald-300">conf {d.confidence}%</span>
              <span className="text-zinc-200">{d.summary}</span>
            </li>
          ))}
        </ol>
      </section>
    </AutoFundLayout>
  );
}
