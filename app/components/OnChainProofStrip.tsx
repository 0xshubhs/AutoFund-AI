"use client";

import { useEffect, useState } from "react";

type OnChain = {
  valuechain: {
    chainId: number | null;
    blockNumber: number | null;
    blockTimestamp: number | null;
    gasPriceGwei: number | null;
    live: boolean;
  };
  base: { chainId: number | null; blockNumber: number | null; live: boolean };
  ssiToken: {
    address: string;
    symbol: string | null;
    decimals: number | null;
    live: boolean;
  };
};

/**
 * Live on-chain proof strip — REAL keyless ValueChain L1 reads, no API key.
 * Polls /api/autofund/onchain and ticks the block height + last-block age so a
 * judge can watch the chain advance. Degrades to a muted "offline" badge if the
 * RPC is unreachable.
 */
export default function OnChainProofStrip() {
  const [data, setData] = useState<OnChain | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/autofund/onchain", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.ok) setData(json.data as OnChain);
      } catch {
        // keep prior state; strip shows offline
      }
    };
    load();
    const poll = setInterval(load, 5000);
    const tick = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  const vc = data?.valuechain;
  const live = Boolean(vc?.live);
  const age = vc?.blockTimestamp ? Math.max(0, now - vc.blockTimestamp) : null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-emerald-500/30 bg-black/60 px-3 py-1.5 font-mono text-[10px]"
      title="Keyless JSON-RPC reads against public ValueChain + Base nodes"
    >
      <span className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-emerald-400" : "bg-zinc-600"}`}
        />
        <span className={live ? "text-emerald-300" : "text-zinc-500"}>
          ValueChain L1 · {live ? "live" : "offline"} · no API key
        </span>
      </span>
      <span className="text-zinc-400">
        block{" "}
        <span className="text-zinc-100">
          {vc?.blockNumber != null ? `#${vc.blockNumber.toLocaleString()}` : "—"}
        </span>
      </span>
      <span className="text-zinc-400">
        chainId <span className="text-zinc-100">{vc?.chainId ?? "—"}</span>
      </span>
      {age != null && (
        <span className="text-zinc-400">
          age <span className="text-zinc-100">{age}s</span>
        </span>
      )}
      {vc?.gasPriceGwei != null && (
        <span className="text-zinc-400">
          gas <span className="text-zinc-100">{vc.gasPriceGwei} gwei</span>
        </span>
      )}
      {data?.base?.live && (
        <span className="text-zinc-500">
          Base #{data.base.blockNumber?.toLocaleString()} (id {data.base.chainId})
        </span>
      )}
      {data?.ssiToken?.live && data.ssiToken.symbol && (
        <span className="text-zinc-500" title={data.ssiToken.address}>
          {data.ssiToken.symbol} on Base ✓
        </span>
      )}
    </div>
  );
}
