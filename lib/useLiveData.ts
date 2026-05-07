"use client";

import { useEffect, useRef, useState } from "react";

type State<T> = {
  data: T | null;
  status: "loading" | "live" | "stale" | "error";
  error?: string;
  source?: string;
  updatedAt?: number;
};

export function useLiveData<T>(path: string, intervalMs = 6000) {
  const [state, setState] = useState<State<T>>({ data: null, status: "loading" });
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(path, { cache: "no-store" });
        const json = await res.json();
        if (cancelled.current) return;
        if (json.ok) {
          setState({
            data: json.data as T,
            status: "live",
            source: json.source,
            updatedAt: json.generatedAt,
          });
        } else {
          setState((s) => ({ ...s, status: "stale", error: json.error }));
        }
      } catch (err) {
        if (cancelled.current) return;
        setState((s) => ({
          ...s,
          status: "error",
          error: err instanceof Error ? err.message : "Network error",
        }));
      } finally {
        if (!cancelled.current) {
          timer = setTimeout(tick, intervalMs);
        }
      }
    };

    tick();
    return () => {
      cancelled.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [path, intervalMs]);

  return state;
}

export function formatRelative(ts: number | undefined) {
  if (!ts) return "–";
  const delta = Date.now() - ts;
  if (delta < 4000) return "just now";
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  return new Date(ts).toLocaleTimeString();
}

export function formatUSD(n: number, digits = 0) {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatPct(n: number, digits = 2) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}
