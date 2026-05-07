"use client";

import { formatRelative } from "@/lib/useLiveData";

type Status = "loading" | "live" | "stale" | "error";

const colors: Record<Status, string> = {
  loading: "bg-zinc-500",
  live: "bg-emerald-400",
  stale: "bg-amber-400",
  error: "bg-rose-500",
};

const labels: Record<Status, string> = {
  loading: "loading",
  live: "live",
  stale: "stale",
  error: "error",
};

export default function StatusDot({
  status,
  updatedAt,
  source,
}: {
  status: Status;
  updatedAt?: number;
  source?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
      <span className="relative flex h-2 w-2">
        {status === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${colors[status]}`} />
      </span>
      <span>{labels[status]}</span>
      {source && <span className="text-zinc-600">· {source}</span>}
      {updatedAt && <span className="text-zinc-600">· {formatRelative(updatedAt)}</span>}
    </div>
  );
}
