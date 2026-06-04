"use client";

import StatusDot from "./StatusDot";
import { useLiveData } from "@/lib/useLiveData";
import type { SignalVector } from "@/lib/signals";
import type { MarketSnapshot } from "@/lib/sosovalue";

type StrategyData = { signals?: SignalVector };

function fmtUsdM(n: number) {
  const m = n / 1e6;
  const sign = m > 0 ? "+" : "";
  return `${sign}$${m.toFixed(0)}M`;
}

/**
 * Institutional positioning: SoSoValue ETF net-flow signal (feature #4) plus
 * the real BTC/ETH 24h prices from the currency market-snapshot (feature #5).
 * Both degrade to deterministic preview with no key; the source label is honest.
 */
export default function InstitutionalPanel() {
  const strategy = useLiveData<StrategyData>("/api/autofund/strategy", 8000);
  const markets = useLiveData<{ market: MarketSnapshot[] }>("/api/autofund/markets", 8000);

  const sig = strategy.data?.signals;
  const m = markets.data?.market ?? [];
  const pick = (s: string) => m.find((x) => x.symbol.toUpperCase() === s);
  const btc = pick("BTC");
  const eth = pick("ETH");

  return (
    <section className="border border-zinc-800 bg-zinc-950/85 p-4 md:col-span-2">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">Institutional Positioning</h2>
          <p className="text-[11px] text-zinc-500">
            SoSoValue ETF net flow + live market benchmark · 5th allocation signal
          </p>
        </div>
        <StatusDot status={markets.status} updatedAt={markets.updatedAt} source={markets.source} />
      </header>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="border border-zinc-800 bg-black p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">ETF Net Flow</p>
          <p
            className={`mt-1 font-mono text-lg font-semibold ${
              sig && sig.etfFlow >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {sig ? fmtUsdM(sig.context.etfNetInflow) : "—"}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">latest day · net {sig?.context.etfTrend ?? "—"}</p>
        </div>
        <div className="border border-zinc-800 bg-black p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Flow Signal</p>
          <p
            className={`mt-1 font-mono text-lg font-semibold ${
              sig && sig.etfFlow >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {sig ? `${sig.etfFlow > 0 ? "+" : ""}${(sig.etfFlow * 100).toFixed(0)}` : "—"}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">normalized [-100,100]</p>
        </div>
        <div className="border border-zinc-800 bg-black p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">BTC · 24h</p>
          <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">
            {btc ? `$${btc.price.toLocaleString()}` : "—"}
          </p>
          <p
            className={`mt-0.5 font-mono text-[11px] ${
              btc && btc.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {btc ? `${btc.change24h > 0 ? "+" : ""}${btc.change24h}%` : ""}
          </p>
        </div>
        <div className="border border-zinc-800 bg-black p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">ETH · 24h</p>
          <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">
            {eth ? `$${eth.price.toLocaleString()}` : "—"}
          </p>
          <p
            className={`mt-0.5 font-mono text-[11px] ${
              eth && eth.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {eth ? `${eth.change24h > 0 ? "+" : ""}${eth.change24h}%` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
