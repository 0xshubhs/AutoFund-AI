import OpenAI from "openai";
import type { Decision, FundSummary, Holding, RiskBreakdown, StrategyState } from "./types";

// AI copilot powered by an OpenAI-compatible Chat Completions endpoint.
//
// Wave 3 ships a LIVE default: a self-hosted vLLM server running
// Qwen/Qwen3-VL-8B-Instruct behind a RunPod proxy. No key required — the demo
// reasons with a real model out of the box. Everything is env-overridable so
// the endpoint can be repointed (RunPod proxy URLs are ephemeral) or swapped
// for OpenAI proper. If the endpoint is unreachable the module degrades to a
// deterministic heuristic, so the app never hard-fails on a dead pod.
const DEFAULT_BASE_URL = "https://j197d3s4gy3ijy-8002.proxy.runpod.net/v1";
const DEFAULT_MODEL = "Qwen/Qwen3-VL-8B-Instruct";

const AI_BASE_URL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || DEFAULT_BASE_URL;
const AI_MODEL = process.env.OPENAI_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;
// The vLLM/RunPod endpoint ignores the key; keep a non-empty sentinel so the
// SDK constructs a client. Override with a real key when pointing at OpenAI.
const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "runpod-local";

const IS_HOSTED = AI_BASE_URL !== "https://api.openai.com/v1";

export const AI_PROVIDER = {
  baseUrl: AI_BASE_URL,
  model: AI_MODEL,
  label: IS_HOSTED ? `vLLM · ${AI_MODEL}` : `openai · ${AI_MODEL}`,
};

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!AI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: AI_API_KEY, baseURL: AI_BASE_URL });
  }
  return client;
}

/**
 * Config check: is an AI endpoint wired at all? With the Wave 3 baked-in
 * default this is always true — liveness (is the pod actually up?) is answered
 * separately by probeAI().
 */
export function hasAI(): boolean {
  return Boolean(AI_API_KEY);
}

// Cache the liveness probe so /health and every copilot/reasoning hit don't each
// pay a network round-trip to the model server.
let probeCache: { at: number; ok: boolean } | null = null;
const PROBE_TTL_MS = 15_000;

/**
 * Real reachability check: pings the OpenAI-compatible `/models` endpoint with a
 * short timeout so the "live" flag reflects whether the model server is actually
 * up — not just that a URL is configured. Result cached for PROBE_TTL_MS.
 */
export async function probeAI(): Promise<boolean> {
  if (!hasAI()) return false;
  const now = Date.now();
  if (probeCache && now - probeCache.at < PROBE_TTL_MS) return probeCache.ok;
  let ok = false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(`${AI_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${AI_API_KEY}` },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    ok = res.ok;
  } catch {
    ok = false;
  }
  probeCache = { at: now, ok };
  return ok;
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
        model: AI_MODEL,
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

function heuristicBrief(ctx: FundContext): string {
  const { summary, strategy, risk, latestDecision } = ctx;
  const posture =
    summary.riskScore >= 66 ? "defensive" : summary.riskScore >= 40 ? "balanced" : "risk-on";
  const move = latestDecision ? ` Latest action: ${latestDecision.summary}.` : "";
  return `The fund is running a ${posture} book at ${formatNav(summary.nav)} NAV, regime ${summary.riskRegime} (${summary.riskScore}/100), exposure capped at ${risk.exposureCap}%. Active strategy is ${strategy.active}.${move}`;
}

function formatNav(n: number): string {
  return `$${n.toLocaleString()}`;
}

/**
 * Wave 3 "AI Desk Brief": a short, live opening note on the fund's posture,
 * generated by the model from the current state. Non-streaming, capped tokens.
 * Degrades to a deterministic brief when the endpoint is down so the card
 * always renders. `live` tells the UI whether a real model wrote it.
 */
export async function generateBrief(ctx: FundContext): Promise<{ text: string; live: boolean }> {
  const oai = getClient();
  if (!oai) return { text: heuristicBrief(ctx), live: false };
  try {
    const completion = await oai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.5,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Current fund state:\n${renderState(ctx)}\n\nWrite a 2-3 sentence opening "desk brief" for the operator: the fund's current posture, the single most important risk or opportunity right now, and what the agent is inclined to do next. Plain text, no headers, no bullet characters.`,
        },
      ],
    });
    const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { text: heuristicBrief(ctx), live: false };
    return { text, live: true };
  } catch {
    return { text: heuristicBrief(ctx), live: false };
  }
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
      model: AI_MODEL,
      temperature: 0.35,
      max_tokens: 320,
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
      // The model may wrap the JSON in prose — extract the first balanced object.
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      const json = start !== -1 && end > start ? text.slice(start, end + 1) : text;
      const parsed = JSON.parse(json) as { reasons?: unknown };
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
