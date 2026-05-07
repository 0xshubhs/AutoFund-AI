"use client";

import StatusDot from "./StatusDot";
import { useLiveData } from "@/lib/useLiveData";
import type { SectorSpotlightItem } from "@/lib/sosovalue";

function tile(change: number): string {
  if (change >= 5) return "bg-emerald-500/55 border-emerald-400/80 text-white";
  if (change >= 2) return "bg-emerald-500/35 border-emerald-500/60 text-emerald-100";
  if (change >= 0) return "bg-emerald-500/15 border-emerald-500/40 text-emerald-200";
  if (change >= -2) return "bg-rose-500/15 border-rose-500/40 text-rose-200";
  if (change >= -5) return "bg-rose-500/35 border-rose-500/60 text-rose-100";
  return "bg-rose-500/55 border-rose-400/80 text-white";
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function fmtMcap(n?: number): string {
  if (!n) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export default function SectorHeatmap() {
  const sectors = useLiveData<SectorSpotlightItem[]>("/api/autofund/sectors", 9000);
  const data = sectors.data ?? [];

  return (
    <section className="border border-zinc-800 bg-zinc-950/85 p-4 md:col-span-2">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">SoSoValue Sector Spotlight</h2>
          <p className="text-[11px] text-zinc-500">
            Rotation signals · feeds the strategy router&apos;s sector tilt
          </p>
        </div>
        <StatusDot status={sectors.status} updatedAt={sectors.updatedAt} source={sectors.source} />
      </header>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {data.map((s) => (
          <div
            key={s.sector}
            className={`relative border p-3 transition ${tile(s.change24h)}`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">
              {s.sector}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold">{fmtPct(s.change24h)}</p>
            <p className="mt-1 text-[10px] opacity-80">mcap {fmtMcap(s.marketCap)}</p>
            {s.topGainer && (
              <p className="mt-1 text-[10px] opacity-90">
                ↑ {s.topGainer} {s.topGainerChange ? fmtPct(s.topGainerChange) : ""}
              </p>
            )}
            {s.topLoser && (
              <p className="text-[10px] opacity-90">
                ↓ {s.topLoser} {s.topLoserChange ? fmtPct(s.topLoserChange) : ""}
              </p>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <div className="border border-zinc-800 bg-black p-3 text-xs text-zinc-500 sm:col-span-3 lg:col-span-6">
            Loading sector spotlight…
          </div>
        )}
      </div>
    </section>
  );
}
