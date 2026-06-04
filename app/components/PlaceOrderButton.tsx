"use client";

import { useState } from "react";
import type { SodexSubmitResult } from "@/lib/sodex";

type ApiResp = {
  ok: boolean;
  data: SodexSubmitResult;
  source: string;
  generatedAt: number;
};

export default function PlaceOrderButton() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const place = async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/autofund/sodex-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as ApiResp;
      setResult(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const data = result?.data;
  const isLive = data?.mode === "live";
  const sideLabel = data?.payload.side === 1 ? "BUY" : data?.payload.side === 2 ? "SELL" : "—";
  const explorerUrl = data?.mode === "live" ? data.explorerUrl : undefined;
  const orderId = data?.mode === "live" ? data.orderId : undefined;

  return (
    <section className="border border-emerald-500/40 bg-zinc-950/85 p-4 md:col-span-2">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">SoDEX Test Order</h2>
          <p className="text-[11px] text-zinc-500">
            Constructs an EIP-712 typed order and submits to SoDEX testnet · falls back to dry-run when
            SODEX_API_KEY is not set
          </p>
        </div>
        <button
          onClick={place}
          disabled={running}
          className="border border-emerald-500/70 bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
        >
          {running ? "Placing…" : "Place test order"}
        </button>
      </header>

      {error && <p className="text-xs text-rose-400">Error: {error}</p>}

      {data && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="border border-zinc-800 bg-black p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              {isLive ? "Live submission" : "Dry-run"} · {result?.source}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-y-1 font-mono text-[11px] text-zinc-300">
              <dt className="text-zinc-500">Symbol</dt>
              <dd>{data.payload.symbol}</dd>
              <dt className="text-zinc-500">Side</dt>
              <dd className={sideLabel === "BUY" ? "text-emerald-400" : "text-rose-400"}>
                {sideLabel}
              </dd>
              <dt className="text-zinc-500">Size</dt>
              <dd>{data.payload.size}</dd>
              <dt className="text-zinc-500">Price</dt>
              <dd>{data.payload.price}</dd>
              <dt className="text-zinc-500">Nonce</dt>
              <dd className="truncate">{data.payload.nonce}</dd>
              <dt className="text-zinc-500">Status</dt>
              <dd className={result?.ok ? "text-emerald-400" : "text-rose-400"}>
                {result?.ok ? "OK" : "Failed"}
              </dd>
            </dl>
            {orderId && (
              <p className="mt-2 font-mono text-[10px] text-emerald-300">order {orderId}</p>
            )}
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-[10px] text-emerald-400 underline hover:text-emerald-300"
              >
                view on explorer ↗
              </a>
            )}
            {data.mode === "dry-run" && (
              <p className="mt-2 text-[10px] text-zinc-500">{data.reason}</p>
            )}
          </div>
          <div className="border border-zinc-800 bg-black p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              EIP-712 typed data preview
            </p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-zinc-300">
              {JSON.stringify(data.typedData, null, 2)}
            </pre>
          </div>
        </div>
      )}
      {!data && !error && (
        <p className="text-xs text-zinc-500">Click to construct + submit a SoDEX order.</p>
      )}
    </section>
  );
}
