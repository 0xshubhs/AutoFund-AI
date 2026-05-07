"use client";

import AutoFundChartCard from "../components/AutoFundChartCard";
import AutoFundLayout from "../components/AutoFundLayout";
import ChartPanel from "../components/ChartPanel";
import KPICard from "../components/KPICard";
import StatusDot from "../components/StatusDot";
import { formatUSD, useLiveData } from "@/lib/useLiveData";
import type { Order, SeriesPoint } from "@/lib/types";

const STATUS_TONE: Record<Order["status"], string> = {
  PENDING: "text-amber-300",
  PARTIAL: "text-amber-300",
  FILLED: "text-emerald-400",
  FAILED: "text-rose-400",
};

export default function ExecutionPage() {
  const exec = useLiveData<{
    orders: Order[];
    stats: { avgSlippageBps: number; avgAckMs: number; fillRate: number };
  }>("/api/autofund/execution", 4500);
  const series = useLiveData<SeriesPoint[]>("/api/autofund/series?points=24", 6000);

  const orders = exec.data?.orders ?? [];
  const stats = exec.data?.stats;

  const candle = (series.data ?? []).map((p, i) => ({
    t: p.t,
    close: p.btc,
    avg: p.btc * 0.998,
    buy: i % 6 === 2 ? p.btc - 0.6 : null,
    sell: i % 6 === 5 ? p.btc + 0.6 : null,
  }));

  return (
    <AutoFundLayout title="Execution Monitor" subtitle="SoDEX order flow and execution quality">
      <section className="border border-zinc-800 bg-[#0a0a0a]/85 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Execution Quality</h2>
          <StatusDot status={exec.status} updatedAt={exec.updatedAt} source={exec.source} />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <KPICard
            label="Fill Rate"
            value={stats ? `${stats.fillRate}%` : "—"}
            tone={stats && stats.fillRate >= 80 ? "positive" : "warn"}
          />
          <KPICard
            label="Avg Slippage"
            value={stats ? `${stats.avgSlippageBps.toFixed(1)} bps` : "—"}
            tone={stats && stats.avgSlippageBps < 8 ? "positive" : "warn"}
          />
          <KPICard
            label="Avg Ack"
            value={stats ? `${stats.avgAckMs.toFixed(0)} ms` : "—"}
            tone={stats && stats.avgAckMs < 200 ? "positive" : "warn"}
          />
          <KPICard label="Active Orders" value={`${orders.length}`} />
        </div>
      </section>

      <section className="border border-zinc-800 bg-zinc-950/80 p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-emerald-300">Live Orders</h2>
          <StatusDot status={exec.status} updatedAt={exec.updatedAt} source={exec.source} />
        </div>
        <div className="overflow-x-auto border border-zinc-800 bg-black text-sm">
          <table className="w-full min-w-[720px]">
            <thead className="bg-zinc-950 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Pair</th>
                <th className="p-2 text-left">Side</th>
                <th className="p-2 text-left">Size</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Slippage</th>
                <th className="p-2 text-left">Ack</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-800">
                  <td className="p-2 text-zinc-400">
                    {new Date(o.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="p-2 text-zinc-100">{o.pair}</td>
                  <td className={`p-2 ${o.side === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>
                    {o.side}
                  </td>
                  <td className="p-2 text-zinc-300">{o.size}</td>
                  <td className="p-2 text-zinc-300">{formatUSD(o.price, 2)}</td>
                  <td className="p-2 text-zinc-300">{o.slippageBps.toFixed(1)} bps</td>
                  <td className="p-2 text-zinc-300">{o.ackMs} ms</td>
                  <td className={`p-2 text-[10px] uppercase tracking-[0.16em] ${STATUS_TONE[o.status]}`}>
                    {o.status}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-3 text-center text-zinc-500">
                    Waiting for SoDEX orders…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ChartPanel
        title="Trade Execution Overlay"
        subtitle="Price · VWAP · buys & sells"
        status={series.status}
        source={series.source}
        updatedAt={series.updatedAt}
        className="md:col-span-2"
        note="Buy markers in green, sells in orange — overlaid on price + average."
      >
        {candle.length > 0 && (
          <AutoFundChartCard payload={{ type: "candlestick", data: candle }} height={230} />
        )}
      </ChartPanel>
    </AutoFundLayout>
  );
}
