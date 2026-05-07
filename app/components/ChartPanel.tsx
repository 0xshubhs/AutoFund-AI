"use client";

import { ReactNode } from "react";
import StatusDot from "./StatusDot";

type Status = "loading" | "live" | "stale" | "error";

export default function ChartPanel({
  title,
  subtitle,
  status = "live",
  source,
  updatedAt,
  note,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  status?: Status;
  source?: string;
  updatedAt?: number;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative border border-zinc-800 bg-zinc-950/80 p-4 ${className}`}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">{title}</h2>
          {subtitle && <p className="text-[11px] text-zinc-500">{subtitle}</p>}
        </div>
        <StatusDot status={status} updatedAt={updatedAt} source={source} />
      </header>
      <div className="border border-zinc-800 bg-black/80 p-2">{children}</div>
      {note && <p className="mt-2 text-[11px] text-zinc-500">{note}</p>}
    </section>
  );
}
