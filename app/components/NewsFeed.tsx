"use client";

import StatusDot from "./StatusDot";
import { formatRelative, useLiveData } from "@/lib/useLiveData";
import type { NewsItem } from "@/lib/sosovalue";

const SENTIMENT_TONE: Record<NonNullable<NewsItem["sentiment"]>, string> = {
  bullish: "border-emerald-500/60 text-emerald-300",
  bearish: "border-rose-500/60 text-rose-300",
  neutral: "border-zinc-700 text-zinc-300",
};

export default function NewsFeed() {
  const news = useLiveData<NewsItem[]>("/api/autofund/news?limit=8", 12_000);

  return (
    <section className="border border-zinc-800 bg-zinc-950/85 p-4 md:col-span-2">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">SoSoValue News Feed</h2>
          <p className="text-[11px] text-zinc-500">Headlines that drive the agent&apos;s reasoning</p>
        </div>
        <StatusDot status={news.status} updatedAt={news.updatedAt} source={news.source} />
      </header>
      <ul className="grid gap-2 md:grid-cols-2">
        {(news.data ?? []).map((n) => {
          const tone = n.sentiment ? SENTIMENT_TONE[n.sentiment] : SENTIMENT_TONE.neutral;
          return (
            <li
              key={n.id}
              className="border border-zinc-800 bg-black p-3 text-xs transition hover:border-emerald-500/60"
            >
              <div className="flex items-center justify-between">
                <span className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${tone}`}>
                  {n.sentiment ?? "neutral"} {n.conviction ? `· ${n.conviction}` : ""}
                </span>
                <span className="font-mono text-[10px] text-zinc-500">{formatRelative(n.publishedAt)}</span>
              </div>
              <p className="mt-1.5 text-zinc-100">{n.title}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                <span>{n.source}</span>
                {n.symbols && n.symbols.length > 0 && (
                  <span className="font-mono text-emerald-400/80">
                    {n.symbols.slice(0, 4).join(" · ")}
                  </span>
                )}
              </div>
            </li>
          );
        })}
        {!news.data && (
          <li className="border border-zinc-800 bg-black p-3 text-xs text-zinc-500 md:col-span-2">
            Loading SoSoValue headlines…
          </li>
        )}
      </ul>
    </section>
  );
}
