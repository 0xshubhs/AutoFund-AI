"use client";

import { useDemoCycle } from "./DemoCycleContext";

export default function RunCycleButton() {
  const { running, start, step, steps, finishedAt } = useDemoCycle();
  const current = step >= 0 ? steps[step] : null;
  const label = running
    ? current?.label ?? "Running…"
    : finishedAt
      ? "Run another cycle"
      : "Run trading cycle";
  return (
    <button
      onClick={start}
      disabled={running}
      className="group relative inline-flex items-center gap-2 border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-80"
    >
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${running ? "bg-emerald-400" : "bg-emerald-500"}`}
      >
        {running && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
      </span>
      {label}
    </button>
  );
}
