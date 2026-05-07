"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import StatusDot from "./StatusDot";

type Health = {
  ai: { provider: string; model: string; baseUrl: string; live: boolean };
};

const SUGGESTIONS = [
  "Is the current strategy choice aligned with the regime?",
  "Why was the latest rebalance triggered?",
  "Where is the biggest hidden risk in the book right now?",
];

export default function CopilotPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"ai" | "heuristic" | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/autofund/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setHealth(j.data))
      .catch(() => setHealth(null));
  }, []);

  const ask = async (q: string) => {
    if (!q.trim() || running) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setRunning(true);
    setAnswer("");
    setMode(null);
    setQuestion(q);

    try {
      const res = await fetch("/api/autofund/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
        signal: ac.signal,
      });
      const headerMode = res.headers.get("x-copilot-mode");
      setMode(headerMode === "ai" ? "ai" : "heuristic");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream unavailable");
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        setAnswer((prev) => prev + `\n\n[stream error: ${(err as Error).message}]`);
      }
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  const aiLive = health?.ai.live === true;
  const status = !health
    ? "loading"
    : running
      ? "live"
      : aiLive
        ? "live"
        : "stale";

  return (
    <section className="border border-emerald-500/40 bg-zinc-950/85 p-4 md:col-span-2">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">AI Copilot</h2>
          <p className="text-[11px] text-zinc-500">
            Ask the fund anything · powered by{" "}
            <span className="font-mono text-emerald-300">{health?.ai.model ?? "qwen3-vl"}</span>
            {aiLive ? " (live)" : " (offline — heuristic mode)"}
          </p>
        </div>
        <StatusDot
          status={status}
          source={health?.ai.model ?? "heuristic"}
        />
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 md:flex-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Why did the agent reduce BTC weight?"
          className="flex-1 border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/70 focus:outline-none"
          disabled={running}
        />
        <button
          type="submit"
          disabled={running || !question.trim()}
          className="border border-emerald-500/70 bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
        >
          {running ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            disabled={running}
            className="border border-zinc-800 bg-black px-2 py-1 text-[11px] text-zinc-400 transition hover:border-emerald-500/60 hover:text-emerald-300 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-[120px] border border-zinc-800 bg-black p-3 font-mono text-[12px] leading-relaxed text-zinc-200 whitespace-pre-wrap">
        {answer || (
          <span className="text-zinc-600">
            {running ? "Streaming response…" : "Ask a question to see the agent's reasoning."}
          </span>
        )}
        {running && answer && <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-emerald-400 align-middle" />}
      </div>
      {mode && (
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          mode · {mode === "ai" ? `${health?.ai.model ?? "ai"} live` : "heuristic fallback"}
        </p>
      )}
    </section>
  );
}
