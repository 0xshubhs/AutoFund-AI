import OpenAI from "openai";
import type { Decision, FundSummary, Holding, RiskBreakdown, StrategyState } from "./types";

// AI copilot powered by OpenAI Chat Completions. Configurable via env so we
// never ship a hardcoded key or host. With no OPENAI_API_KEY set the module
// degrades to a deterministic heuristic — the zero-config demo still works.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
// Optional base-url override (e.g. an OpenAI-compatible gateway). Trivial pass-
// through; left undefined → the SDK uses the real OpenAI endpoint.
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || undefined;

export const AI_PROVIDER = {
  baseUrl: OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  model: OPENAI_MODEL,
};

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: OPENAI_API_KEY, baseURL: OPENAI_BASE_URL });
  }
  return client;
}

/**
 * Config check: is OpenAI actually configured? Cheap, synchronous. Returns
 * false when OPENAI_API_KEY is unset, which keeps routes in heuristic mode
 * rather than pretending an endpoint exists. `source` labels rely on this so
 * we never claim "AI live" without a key.
 */
export function hasAI(): boolean {
  return Boolean(OPENAI_API_KEY);
}

/**
 * Reachability/config check. To avoid spending tokens on every health check we
 * do NOT call the chat endpoint here — a configured key is treated as "ready".
 * (A token-free `models.list()` ping is possible but unnecessary and adds
 * latency to every /health hit; presence of a key is the honest signal.)
 */
export async function probeAI(): Promise<boolean> {
  return hasAI();
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

/**
 * Streaming copilot answer. Streams plain-text deltas from OpenAI; on any error
 * (or no key) yields a clearly-labeled fallback note + the heuristic answer.
 */
export async function* streamCopilotAnswer(
  question: string,
  ctx: FundContext,
  signal?: AbortSignal,
): AsyncIterable<string> {
  const oai = getClient();
  if (!oai) {
    yield* heuristicAnswer(question, ctx);
    return;
  }
  try {
    const stream = await oai.chat.completions.create(
      {
        model: OPENAI_MODEL,
        stream: true,
        temperature: 0.45,
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Current fund state:\n${renderState(ctx)}\n\nOperator question: ${question}`,
          },
        ],
      },
      { signal },
    );
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta.length > 0) yield delta;
    }
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

/**
 * Enriches a decision's reason bullets via OpenAI, requesting structured JSON
 * output (response_format json_object) so the shape is predictable. Falls back
 * to the decision's own deterministic reasons on any error or with no key.
 */
export async function enrichDecisionReasons(decision: Decision, ctx: FundContext): Promise<string[]> {
  const cached = reasonCache.get(decision.id);
  if (cached) return cached;

  const oai = getClient();
  if (!oai) return decision.reasons;

  try {
    const completion = await oai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.35,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Current fund state:\n${renderState(ctx)}\n\nThe agent just made this decision: "${decision.summary}" (confidence ${decision.confidence}%). Signal scores: ${decision.signals.map((s) => `${s.label} ${s.score}`).join(", ")}.\n\nReturn JSON of the form {"reasons": string[], "confidence": number} where reasons is 2-3 short one-sentence bullets (NO bullet characters) explaining WHY this decision makes sense given the signals and regime, and confidence is your 0-100 assessment.`,
        },
      ],
    });
    const text: string = completion.choices?.[0]?.message?.content ?? "";
    let reasons: string[] = [];
    try {
      const parsed = JSON.parse(text) as { reasons?: unknown };
      if (Array.isArray(parsed.reasons)) {
        reasons = parsed.reasons
          .map((r) => String(r).replace(/^[-•·*\d.)\s]+/, "").trim())
          .filter(Boolean)
          .slice(0, 3);
      }
    } catch {
      // model ignored json_object — fall through to deterministic reasons
    }
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
