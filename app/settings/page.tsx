"use client";

import AutoFundChartCard from "../components/AutoFundChartCard";
import AutoFundLayout from "../components/AutoFundLayout";
import ChartPanel from "../components/ChartPanel";
import KPICard from "../components/KPICard";
import RiskGatePanel from "../components/RiskGatePanel";
import StatusDot from "../components/StatusDot";
import { useLiveData } from "@/lib/useLiveData";
import type { RiskBreakdown, SeriesPoint } from "@/lib/types";

export default function SettingsPage() {
  const risk = useLiveData<{
    score: number;
    regime: string;
    exposureCap: number;
    breakdown: RiskBreakdown;
    drawdown: SeriesPoint[];
  }>("/api/autofund/risk", 5000);

  const radar = risk.data
    ? Object.entries(risk.data.breakdown).map(([k, v]) => ({
        subject: k.charAt(0).toUpperCase() + k.slice(1),
        v,
      }))
    : [];

  return (
    <AutoFundLayout title="Risk Engine" subtitle="Volatility, drawdown, and exposure controls">
      <section className="border border-zinc-800 bg-[#0a0a0a]/85 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Risk State</h2>
          <StatusDot status={risk.status} updatedAt={risk.updatedAt} source={risk.source} />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <KPICard
            label="Composite Score"
            value={risk.data ? `${risk.data.score}/100` : "—"}
            tone={
              risk.data?.score && risk.data.score < 40
                ? "positive"
                : risk.data?.score && risk.data.score < 70
                  ? "warn"
                  : "negative"
            }
          />
          <KPICard label="Regime" value={risk.data?.regime ?? "—"} />
          <KPICard
            label="Exposure Cap"
            value={risk.data ? `${risk.data.exposureCap}%` : "—"}
            hint="auto-tuned by score"
          />
          <KPICard label="Mode" value="Adaptive" hint="auto with override" />
        </div>
      </section>

      <RiskGatePanel />

      <section className="border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-emerald-300">Protection Rules</h2>
        <div className="space-y-2 text-sm">
          <Rule label="Volatility trigger" value="+30% over baseline" />
          <Rule label="Drawdown guard" value="reduce risk at -8%" />
          <Rule label="Exposure limit" value={risk.data ? `${risk.data.exposureCap}% per asset` : "45%"} />
          <Rule label="Stable floor" value="12% min" />
          <Rule label="Macro freeze window" value="2h pre/post FOMC" />
        </div>
      </section>

      <section className="border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-emerald-300">Execution Controls</h2>
        <div className="space-y-2 text-sm">
          <Rule label="Mode" value="auto with manual override" />
          <Rule label="Cadence" value="event-driven · adaptive" />
          <Rule label="Slippage tolerance" value="35 bps" />
          <Rule label="Max child slice" value="20% of book" />
        </div>
      </section>

      <ChartPanel
        title="Risk Score Trend"
        subtitle="Continuous monitoring window"
        status={risk.status}
        source={risk.source}
        updatedAt={risk.updatedAt}
        className="md:col-span-2"
      >
        {risk.data && (
          <AutoFundChartCard
            payload={{
              type: "line",
              data: risk.data.drawdown.map((p) => ({ t: p.t, risk: p.risk })),
              dataKey: "risk",
            }}
            height={210}
          />
        )}
      </ChartPanel>

      <ChartPanel
        title="Risk Breakdown"
        subtitle="Components feeding the gate"
        status={risk.status}
        source={risk.source}
        updatedAt={risk.updatedAt}
      >
        {radar.length > 0 && (
          <AutoFundChartCard payload={{ type: "radar", data: radar }} height={210} />
        )}
      </ChartPanel>

      <ChartPanel
        title="Drawdown Envelope"
        subtitle="Peak-to-trough history"
        status={risk.status}
        source={risk.source}
        updatedAt={risk.updatedAt}
      >
        {risk.data && (
          <AutoFundChartCard
            payload={{
              type: "drawdown",
              data: risk.data.drawdown.map((p) => ({ t: p.t, drawdown: p.drawdown })),
            }}
            height={210}
          />
        )}
      </ChartPanel>
    </AutoFundLayout>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border border-zinc-800 bg-black px-3 py-2">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono text-zinc-100">{value}</span>
    </div>
  );
}
