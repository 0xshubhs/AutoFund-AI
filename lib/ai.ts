import type { Decision, FundSummary, Holding, RiskBreakdown, StrategyState } from "./types";

const AI_BASE_URL = "https://0ziii4vt975sjd-8000.proxy.runpod.net";
const AI_MODEL = "Qwen/Qwen3-VL-8B-Instruct";

export const AI_PROVIDER = {
  baseUrl: AI_BASE_URL,
  model: AI_MODEL,
};

export function hasAI(): boolean {
  return true;
}

const SYSTEM_PROMPT = `You are AutoFund AI's analyst copilot — a reasoning agent embedded in an adaptive on-chain crypto fund.

Your role:
- Help the operator understand the fund's current state, decisions, and risk posture.
- Cite specific numbers from the fund snapshot. Do not invent figures.
- Be concise: 3 to 6 sentences for normal questions. Use short bullets only when comparing items.
- When risk is elevated or stressed, lead with that. When calm, do not invent risk.
- Use buy-side analyst language: rotate, trim, exposure, drawdown guard, regime.
- Never give legally-binding investment advice. You are explaining the agent's reasoning.

The fund pipeline:
1. Ingest signals from SoSoValue (market snapshot, sector spotlight, ETF flows).
2. Score four strategies (momentum, index, news, balanced) and pick the highest expected alpha.
3. Risk-gate via volatility, drawdown, correlation, and macro inputs.
4. Execute on SoDEX with slippage-aware slicing.
5. Log every decision with explainable reasoning.

Output: plain text, no markdown headers. Short paragraphs. Refer to the fund as "the fund" or "the agent".`;

export type FundContext = {
  summary: FundSummary;
  holdings: Holding[];
  strategy: StrategyState;
  risk: { score: number; regime: string; exposureCap: number; breakdown: RiskBreakdown };
  latestDecision: Decision | null;
};

function renderState(ctx: FundContext): string {
  const { summary, holdings, strategy, risk, latestDecision } = ctx;
  const top = holdings
    .slice(0, 5)
    .map((h) => `${h.symbol} ${h.weight}% (PnL ${h.pnlPct >= 0 ? "+" : ""}${h.pnlPct}%)`)
    .join(", ");
  const decisionLine = latestDecision
    ? `Latest decision (${new Date(latestDecision.ts).toISOString().slice(11, 16)}, conf ${latestDecision.confidence}%): ${latestDecision.summary}`
    : "No prior decision.";
  return [
    `NAV: $${summary.nav.toLocaleString()} · 24h ${summary.alpha24h >= 0 ? "+" : ""}${summary.alpha24h}% · MTD ${summary.alphaMTD >= 0 ? "+" : ""}${summary.alphaMTD}%.`,
    `Risk regime: ${summary.riskRegime} (${summary.riskScore}/100). Exposure cap ${summary.exposureCap}%.`,
    `Risk breakdown — vol ${risk.breakdown.volatility}, drawdown ${risk.breakdown.drawdown}, liquidity ${risk.breakdown.liquidity}, correlation ${risk.breakdown.correlation}, macro ${risk.breakdown.macro}.`,
    `Active strategy: ${strategy.active} (trigger: ${strategy.rebalanceTrigger}). Scores — momentum ${strategy.scores.momentum}, index ${strategy.scores.index}, news ${strategy.scores.news}, balanced ${strategy.scores.balanced}.`,
    `Top positions: ${top}.`,
    decisionLine,
  ].join("\n");
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatOpts = {
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  signal?: AbortSignal;
};

async function chatRequest(messages: ChatMessage[], opts: ChatOpts): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: opts.stream ? "text/event-stream" : "application/json",
  };

  const res = await fetch(`${AI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      stream: opts.stream ?? false,
      max_tokens: opts.max_tokens ?? 512,
      temperature: opts.temperature ?? 0.4,
    }),
    signal: opts.signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

async function* parseSSEStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) yield delta;
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function* streamCopilotAnswer(
  question: string,
  ctx: FundContext,
  signal?: AbortSignal,
): AsyncIterable<string> {
  try {
    const res = await chatRequest(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Current fund state:\n${renderState(ctx)}\n\nOperator question: ${question}` },
      ],
      { stream: true, max_tokens: 600, temperature: 0.45, signal },
    );
    if (!res.body) throw new Error("No response body");
    yield* parseSSEStream(res.body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "stream failed";
    yield `[AI fallback: ${msg}]\n`;
    yield* heuristicAnswer(question, ctx);
  }
}

function* heuristicAnswer(question: string, ctx: FundContext): Generator<string> {
  const { summary, strategy, risk, latestDecision } = ctx;
  const lines = [
    `Heuristic mode. The fund is at $${summary.nav.toLocaleString()} NAV with risk regime ${summary.riskRegime} (${summary.riskScore}/100).`,
    ` Active strategy is ${strategy.active} with score ${strategy.scores[strategy.active]}/100, gated by an exposure cap of ${risk.exposureCap}%.`,
    latestDecision ? ` Last decision: ${latestDecision.summary} (confidence ${latestDecision.confidence}%).` : "",
    ` Question: "${question}".`,
  ];
  for (const line of lines) if (line) yield line;
}

const reasonCache = new Map<string, string[]>();
const REASON_CACHE_MAX = 64;

export async function enrichDecisionReasons(decision: Decision, ctx: FundContext): Promise<string[]> {
  const cached = reasonCache.get(decision.id);
  if (cached) return cached;

  try {
    const res = await chatRequest(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Current fund state:\n${renderState(ctx)}\n\nThe agent just made this decision: "${decision.summary}" (confidence ${decision.confidence}%). Signal scores: ${decision.signals.map((s) => `${s.label} ${s.score}`).join(", ")}.\n\nReturn 2 to 3 short reason bullets (one sentence each, NO bullet character) explaining WHY this decision makes sense given the signals and regime. Output ONLY the lines, one per line, no preamble.`,
        },
      ],
      { stream: false, max_tokens: 280, temperature: 0.35 },
    );
    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";
    const reasons = text
      .split("\n")
      .map((l: string) => l.replace(/^[-•·*\d.)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    if (reasons.length === 0) return decision.reasons;

    if (reasonCache.size >= REASON_CACHE_MAX) {
      const firstKey = reasonCache.keys().next().value;
      if (firstKey) reasonCache.delete(firstKey);
    }
    reasonCache.set(decision.id, reasons);
    return reasons;
  } catch {
    return decision.reasons;
  }
}
