"use client";

import AutoFundChartCard from "../components/AutoFundChartCard";
import AutoFundLayout from "../components/AutoFundLayout";
import ChartPanel from "../components/ChartPanel";
import KPICard from "../components/KPICard";
import StatusDot from "../components/StatusDot";
import { formatPct, formatUSD, useLiveData } from "@/lib/useLiveData";
import type { AllocationPoint, Decision, FundSummary, Holding, SeriesPoint } from "@/lib/types";

export default function PortfolioPage() {
  const summary = useLiveData<FundSummary>("/api/autofund/summary", 6000);
  const port = useLiveData<{ holdings: Holding[]; allocationHistory: AllocationPoint[] }>(
    "/api/autofund/portfolio",
    6000,
  );
  const series = useLiveData<SeriesPoint[]>("/api/autofund/series?points=36", 7000);
  const risk = useLiveData<{ drawdown: SeriesPoint[] }>("/api/autofund/risk", 6500);
  const reasoning = useLiveData<Decision[]>("/api/autofund/reasoning", 9000);

  const holdings = port.data?.holdings ?? [];
  const donut = holdings.map((h) => ({ name: h.symbol, value: h.weight }));
  const totalReturn = summary.data?.alphaYTD ?? 0;

  return (
    <AutoFundLayout title="Portfolio" subtitle="Holdings, attribution, and benchmarked performance">
      <section className="border border-zinc-800 bg-[#0a0a0a]/85 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Book Snapshot</h2>
          <StatusDot status={port.status} updatedAt={port.updatedAt} source={port.source} />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <KPICard
            label="Holdings"
            value={`${holdings.length}`}
            hint="positions tracked"
          />
          <KPICard
            label="Largest Position"
            value={holdings[0]?.symbol ?? "—"}
            delta={holdings[0] ? `${holdings[0].weight}%` : ""}
          />
          <KPICard
            label="YTD Return"
            value={formatPct(totalReturn)}
            tone={totalReturn >= 0 ? "positive" : "negative"}
          />
          <KPICard
            label="NAV"
            value={summary.data ? formatUSD(summary.data.nav) : "—"}
          />
        </div>
      </section>

      <section className="border border-zinc-800 bg-zinc-950/80 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Holdings</h2>
          <StatusDot status={port.status} updatedAt={port.updatedAt} source={port.source} />
        </div>
        <div className="overflow-x-auto border border-zinc-800 bg-black text-sm">
          <table className="w-full min-w-[640px]">
            <thead className="bg-zinc-950 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <tr>
                <th className="p-3 text-left">Token</th>
                <th className="p-3 text-left">Weight</th>
                <th className="p-3 text-left">Entry</th>
                <th className="p-3 text-left">Current</th>
                <th className="p-3 text-left">PnL</th>
                <th className="p-3 text-left">Source</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {holdings.map((h) => (
                <tr key={h.symbol} className="border-t border-zinc-800">
                  <td className="p-3 text-zinc-100">{h.symbol}</td>
                  <td className="p-3 text-zinc-300">{h.weight}%</td>
                  <td className="p-3 text-zinc-300">{formatUSD(h.entryPrice, h.entryPrice < 10 ? 4 : 0)}</td>
                  <td className="p-3 text-zinc-300">{formatUSD(h.price, h.price < 10 ? 4 : 0)}</td>
                  <td className={`p-3 ${h.pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatPct(h.pnlPct)}
                  </td>
                  <td className="p-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {h.source}
                  </td>
                </tr>
              ))}
              {holdings.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-zinc-500">
                    Loading holdings…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ChartPanel
        title="Current Mix"
        subtitle="Live allocation by token"
        status={port.status}
        source={port.source}
        updatedAt={port.updatedAt}
      >
        {donut.length > 0 && <AutoFundChartCard payload={{ type: "donut", data: donut }} height={210} />}
      </ChartPanel>

      <ChartPanel
        title="Rebalance History"
        subtitle="Most recent decision before/after"
        status={reasoning.status}
        source={reasoning.source}
        updatedAt={reasoning.updatedAt}
        note="Each rebalance is driven by signal threshold crossings."
      >
        {reasoning.data && reasoning.data[0] && (
          <AutoFundChartCard
            payload={{
              type: "bar-compare",
              data: reasoning.data[0].before.map((b, i) => ({
                name: b.symbol,
                before: b.weight,
                after: reasoning.data![0].after[i].weight,
              })),
            }}
            height={210}
          />
        )}
      </ChartPanel>

      <ChartPanel
        title="Performance vs Benchmark"
        subtitle="Fund · BTC · Index"
        status={series.status}
        source={series.source}
        updatedAt={series.updatedAt}
        className="md:col-span-2"
      >
        {series.data && (
          <AutoFundChartCard payload={{ type: "multiline", data: series.data }} height={220} />
        )}
      </ChartPanel>

      <ChartPanel
        title="Allocation Evolution"
        subtitle="Sector rotation over time"
        status={port.status}
        source={port.source}
        updatedAt={port.updatedAt}
      >
        {port.data && (
          <AutoFundChartCard
            payload={{ type: "stacked-area", data: port.data.allocationHistory }}
            height={210}
          />
        )}
      </ChartPanel>

      <ChartPanel
        title="Risk Drawdown"
        subtitle="Capital protection envelope"
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
