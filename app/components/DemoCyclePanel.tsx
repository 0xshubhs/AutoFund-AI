"use client";

import { useDemoCycle } from "./DemoCycleContext";

export default function DemoCyclePanel() {
  const { steps, step, running, finishedAt, startedAt } = useDemoCycle();

  if (step < 0 && !finishedAt) return null;

  const elapsed = finishedAt && startedAt ? (finishedAt - startedAt) / 1000 : 0;

  return (
    <section className="relative border border-emerald-500/50 bg-zinc-950/80 p-4 md:col-span-2">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">Trading Cycle</h2>
          <p className="text-[11px] text-zinc-500">
            {running ? "Live — autonomous decision pipeline executing" : finishedAt ? `Settled in ${elapsed.toFixed(1)}s` : ""}
          </p>
        </div>
        <span className="border border-emerald-500/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
          {running ? "running" : "settled"}
        </span>
      </header>
      <ol className="grid gap-1 md:grid-cols-6">
        {steps.map((s, i) => {
          const state = i < step ? "done" : i === step ? (running ? "active" : "done") : "pending";
          const tone =
            state === "done"
              ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-300"
              : state === "active"
                ? "border-emerald-400 bg-emerald-500/20 text-white"
                : "border-zinc-800 bg-black text-zinc-500";
          return (
            <li
              key={s.id}
              className={`relative border p-2 text-[11px] ${tone}`}
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                Step {i + 1}
              </p>
              <p className="mt-0.5 font-semibold">{s.label}</p>
              <p className="mt-0.5 text-[10px] text-zinc-400">{s.detail}</p>
              {state === "active" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full animate-pulse bg-emerald-400" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
