"use client";

import { useDemoCycle, type CycleAllocation } from "./DemoCycleContext";

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

function AllocBars({ raw, gated }: { raw: CycleAllocation; gated: CycleAllocation }) {
  const keys = ["BTC", "ETH", "AI", "USDC"] as const;
  return (
    <div className="space-y-1.5">
      {keys.map((k) => {
        const r = raw[k] ?? 0;
        const g = gated[k] ?? 0;
        const moved = Math.abs(r - g) > 0.005;
        return (
          <div key={k} className="text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-zinc-300">{k}</span>
              <span className="font-mono text-zinc-400">
                {moved ? (
                  <>
                    <span className="text-zinc-600 line-through">{pct(r)}</span>{" "}
                    <span className="text-amber-300">{pct(g)}</span>
                  </>
                ) : (
                  <span className="text-emerald-300">{pct(g)}</span>
                )}
              </span>
            </div>
            <div className="mt-0.5 h-1.5 w-full bg-zinc-900">
              <div
                className={`h-full ${moved ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: pct(g) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DemoCyclePanel() {
  const { steps, step, running, finishedAt, startedAt, rebalance, order, onchain, live } =
    useDemoCycle();

  if (step < 0 && !finishedAt) return null;

  const elapsed = finishedAt && startedAt ? (finishedAt - startedAt) / 1000 : 0;
  const showDecision = step >= 1 && rebalance;
  const showOrder = step >= 4 && order;
  const showOnchain = step >= 5 && onchain;

  return (
    <section className="relative border border-emerald-500/50 bg-zinc-950/80 p-4 md:col-span-2">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">Trading Cycle</h2>
          <p className="text-[11px] text-zinc-500">
            {running
              ? "Live — autonomous decision pipeline executing"
              : finishedAt
                ? `Settled in ${elapsed.toFixed(1)}s`
                : ""}
            {rebalance && (
              <span className="ml-1 text-zinc-600">
                · {live ? "real pipeline" : "animation fallback"} · {rebalance.source}
              </span>
            )}
          </p>
        </div>
        <span className="border border-emerald-500/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
          {running ? "running" : "settled"}
        </span>
      </header>

      <ol className="grid gap-1 md:grid-cols-6">
        {steps.map((s, i) => {
          const stState = i < step ? "done" : i === step ? (running ? "active" : "done") : "pending";
          const tone =
            stState === "done"
              ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-300"
              : stState === "active"
                ? "border-emerald-400 bg-emerald-500/20 text-white"
                : "border-zinc-800 bg-black text-zinc-500";
          return (
            <li key={s.id} className={`relative border p-2 text-[11px] ${tone}`}>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                Step {i + 1}
              </p>
              <p className="mt-0.5 font-semibold">{s.label}</p>
              <p className="mt-0.5 text-[10px] text-zinc-400">{s.detail}</p>
              {stState === "active" && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full animate-pulse bg-emerald-400" />
              )}
            </li>
          );
        })}
      </ol>

      {showDecision && rebalance && (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {/* Target allocation — raw vs risk-gated */}
          <div className="border border-zinc-800 bg-black p-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                Target allocation
              </p>
              <span className="font-mono text-[10px] text-zinc-400">conf {rebalance.confidence}%</span>
            </div>
            <p className="mb-2 mt-1 text-[10px] text-zinc-500">
              {rebalance.risk.downsized ? (
                <span className="text-amber-300">risk gate resized raw → gated</span>
              ) : (
                "raw target passed the risk gate unchanged"
              )}
            </p>
            <AllocBars raw={rebalance.rawAllocation} gated={rebalance.allocation} />
          </div>

          {/* Risk gate checklist */}
          <div className="border border-zinc-800 bg-black p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              Risk gate · cap {rebalance.risk.exposureCap}% · floor {rebalance.risk.stableFloor}%
            </p>
            <ul className="mt-2 space-y-1 text-[11px]">
              {rebalance.gates.map((g) => (
                <li key={g.id} className="flex items-start gap-1.5">
                  <span className={g.passed ? "text-emerald-400" : "text-amber-300"}>
                    {g.passed ? "✓" : "✗"}
                  </span>
                  <span className={g.passed ? "text-zinc-400" : "text-amber-200"}>
                    {g.label}
                    {!g.passed && <span className="text-zinc-500"> — {g.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reasoning + execution */}
          <div className="border border-zinc-800 bg-black p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              Reasoning
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
              {rebalance.reasons.slice(0, 3).map((r) => (
                <li key={r} className="border-l-2 border-emerald-500/50 pl-2">{r}</li>
              ))}
            </ul>
            {showOrder && order && (
              <div className="mt-3 border-t border-zinc-800 pt-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                  SoDEX {order.mode}
                </p>
                <p className="mt-1 font-mono text-[11px] text-zinc-300">
                  {order.payload.side === 1 ? "BUY" : "SELL"} {order.payload.symbol} ·{" "}
                  {order.payload.size} @ {order.payload.price}
                </p>
                {order.orderId && (
                  <p className="font-mono text-[10px] text-emerald-300">order {order.orderId}</p>
                )}
                {order.explorerUrl && (
                  <a
                    href={order.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-400 underline hover:text-emerald-300"
                  >
                    view on explorer ↗
                  </a>
                )}
                <p className="mt-1 text-[10px] text-zinc-600">{order.source}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showOnchain && onchain && (
        <div className="mt-3 border border-emerald-500/30 bg-black p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
            On-chain settlement anchor
          </p>
          {onchain.live ? (
            <p className="mt-1 font-mono text-[11px] text-zinc-300">
              Decision anchored to ValueChain L1 block{" "}
              <span className="text-emerald-300">#{onchain.blockNumber?.toLocaleString()}</span>{" "}
              (chainId {onchain.chainId}) ·{" "}
              <span className="text-zinc-500">real keyless RPC read · no API key</span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-zinc-500">
              ValueChain RPC unreachable — settled without on-chain anchor.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
