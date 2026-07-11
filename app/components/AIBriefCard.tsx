"use client";

import { formatRelative, useLiveData } from "@/lib/useLiveData";

type Brief = { brief: string; model: string; live: boolean };

export default function AIBriefCard() {
  // Polled slowly — the route caches the generated brief server-side for ~90s.
  const { data, status, source, updatedAt } = useLiveData<Brief>("/api/autofund/brief", 60_000);

  return (
    <section className="border border-zinc-800 bg-[#0a0a0a]/85 p-4 md:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-emerald-300">AI Desk Brief</h2>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              data?.live ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {data?.live ? "live model" : status === "loading" ? "…" : "heuristic"}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-200">
        {data?.brief ?? "Generating the opening desk note from the current fund state…"}
      </p>
      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-600">
        <span>{data?.model ?? ""}</span>
        <span>{source ? `${source} · ${formatRelative(updatedAt)}` : ""}</span>
      </div>
    </section>
  );
}
