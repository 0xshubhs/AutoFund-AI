"use client";

import { useCallback, useEffect, useState } from "react";
import StatusDot from "./StatusDot";
import type { CycleAllocation, CycleGate, RebalanceResult } from "./DemoCycleContext";

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

function AllocRow({ k, raw, gated }: { k: keyof CycleAllocation; raw: number; gated: number }) {
  const moved = Math.abs(raw - gated) > 0.005;
  return (
    <div className="text-[11px]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-zinc-300">{k}</span>
        <span className="font-mono">
          {moved ? (
            <>
              <span className="text-zinc-600 line-through">{pct(raw)}</span>{" "}
              <span className="text-amber-300">{pct(gated)}</span>
            </>
          ) : (
            <span className="text-emerald-300">{pct(gated)}</span>
          )}
        </span>
      </div>
      <div className="mt-0.5 h-1.5 w-full bg-zinc-900">
        <div className={`h-full ${moved ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: pct(gated) }} />
      </div>
    </div>
  );
}

/**
 * Live risk-gate inspector. Runs /api/autofund/rebalance and renders the gate
 * checklist + the raw-vs-gated allocation so a judge can watch a trade get
 * visibly downsized. The "inject contradiction signal" toggle wires the
 * contradiction gate (the future MarketMind input) so it can be demoed now.
 */
type MarketMindResult = {
  ingested: boolean;
  source?: string;
  contradictionFlag?: boolean;
  conviction?: number | null;
  recommendedAction?: string | null;
  error?: string;
};

const SAMPLE_MM_SIGNAL = JSON.stringify(
  {
    schema: "marketmind.autofund.signal/v1",
    generatedAt: new Date().toISOString(),
    targetWeights: { BTC: 0.3, ETH: 0.2, USDC: 0.5 },
    conviction: 0.78,
    contradiction: true,
    recommendedAction: "reduce-risk",
  },
  null,
  2,
);

export default function RiskGatePanel() {
  const [data, setData] = useState<RebalanceResult | null>(null);
  const [marketmind, setMarketmind] = useState<MarketMindResult | null>(null);
  const [contradiction, setContradiction] = useState(false);
  const [signalText, setSignalText] = useState("");
  const [signalError, setSignalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string>();
  const [updatedAt, setUpdatedAt] = useState<number>();

  const run = useCallback(async (flag: boolean, signalRaw: string) => {
    setBusy(true);
    setSignalError(null);
    let marketmindSignal: unknown;
    const trimmed = signalRaw.trim();
    if (trimmed) {
      try {
        marketmindSignal = JSON.parse(trimmed);
      } catch {
        setSignalError("Invalid JSON — paste a marketmind.autofund.signal/v1 object.");
        setBusy(false);
        return;
      }
    }
    try {
      const res = await fetch("/api/autofund/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contradictionFlag: flag,
          ...(marketmindSignal !== undefined ? { marketmindSignal } : {}),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setData(json.data as RebalanceResult);
        setMarketmind((json.data as { marketmind?: MarketMindResult }).marketmind ?? null);
        setSource(json.source);
        setUpdatedAt(json.generatedAt);
      }
    } catch {
      // leave previous state
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Defer past the effect body so we don't setState synchronously on mount;
    // re-runs when the contradiction flag toggles.
    (async () => {
      await Promise.resolve();
      if (!cancelled) run(contradiction, signalText);
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally not re-running on signalText edits — that's manual via the
    // "Ingest signal" button so a judge controls when it fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contradiction, run]);

  const keys: (keyof CycleAllocation)[] = ["BTC", "ETH", "AI", "USDC"];

  return (
    <section className="border border-emerald-500/40 bg-zinc-950/85 p-4 md:col-span-2">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">Live Risk Gate</h2>
          <p className="text-[11px] text-zinc-500">
            Raw model target vs risk-gated target · gates clamp before execution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-400">
            <input
              type="checkbox"
              checked={contradiction}
              onChange={(e) => setContradiction(e.target.checked)}
              className="accent-amber-400"
            />
            inject contradiction signal
          </label>
          <button
            onClick={() => run(contradiction, signalText)}
            disabled={busy}
            className="border border-emerald-500/70 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
          >
            {busy ? "Running…" : "Re-run gate"}
          </button>
          <StatusDot status={busy ? "loading" : data ? "live" : "stale"} source={source} updatedAt={updatedAt} />
        </div>
      </header>

      {/* MarketMind signal ingest (coupling). Paste a marketmind.autofund.signal/v1
          JSON; its contradiction flag + conviction feed the gate below. */}
      <div className="mb-3 border border-zinc-800 bg-black/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
            MarketMind signal ingest
          </p>
          {marketmind?.ingested ? (
            <span className="font-mono text-[10px] text-emerald-300">
              signal source: MarketMind
              {marketmind.conviction != null && ` · conviction ${(marketmind.conviction * 100).toFixed(0)}%`}
              {marketmind.contradictionFlag ? " · contradicts ✗" : " · agrees ✓"}
            </span>
          ) : (
            <span className="font-mono text-[10px] text-zinc-600">no signal · behaving as default</span>
          )}
        </div>
        <textarea
          value={signalText}
          onChange={(e) => setSignalText(e.target.value)}
          placeholder='Paste marketmind.autofund.signal/v1 JSON, then "Ingest signal"…'
          rows={3}
          className="mt-2 w-full resize-y border border-zinc-800 bg-zinc-950 p-2 font-mono text-[10px] text-zinc-300 outline-none focus:border-emerald-500/60"
        />
        {signalError && <p className="mt-1 text-[10px] text-rose-400">{signalError}</p>}
        {marketmind?.error && (
          <p className="mt-1 text-[10px] text-amber-300">signal rejected: {marketmind.error}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => run(contradiction, signalText)}
            disabled={busy}
            className="border border-emerald-500/70 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
          >
            Ingest signal
          </button>
          <button
            onClick={() => setSignalText(SAMPLE_MM_SIGNAL)}
            disabled={busy}
            className="border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-50"
          >
            Load sample
          </button>
          {signalText && (
            <button
              onClick={() => {
                setSignalText("");
                run(contradiction, "");
              }}
              disabled={busy}
              className="border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {data ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="border border-zinc-800 bg-black p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              Target · cap {data.risk.exposureCap}% · floor {data.risk.stableFloor}% ·{" "}
              {data.risk.downsized ? (
                <span className="text-amber-300">downsized</span>
              ) : (
                <span className="text-emerald-300">unchanged</span>
              )}
            </p>
            <div className="mt-2 space-y-1.5">
              {keys.map((k) => (
                <AllocRow key={k} k={k} raw={data.rawAllocation[k] ?? 0} gated={data.allocation[k] ?? 0} />
              ))}
            </div>
          </div>
          <div className="border border-zinc-800 bg-black p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              Gate checklist · vol {(data.signals.volatility * 100).toFixed(0)}%
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              {data.gates.map((g: CycleGate) => (
                <li key={g.id} className="flex items-start gap-1.5">
                  <span className={g.passed ? "text-emerald-400" : "text-amber-300"}>
                    {g.passed ? "✓" : "✗"}
                  </span>
                  <span>
                    <span className={g.passed ? "text-zinc-300" : "text-amber-200"}>{g.label}</span>
                    <span className="text-zinc-500"> — {g.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Running risk gate…</p>
      )}
    </section>
  );
}
