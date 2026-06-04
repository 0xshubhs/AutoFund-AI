import { NextResponse } from "next/server";
import {
  buildDecisionFeed,
  buildFundSummary,
  buildHoldings,
  buildRiskBreakdown,
  buildStrategyState,
} from "@/lib/mock";
import { hasAI, probeAI, streamCopilotAnswer, AI_PROVIDER, type FundContext } from "@/lib/ai";

export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(request: Request) {
  let body: { question?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ ok: false, error: "Missing question." }, { status: 400 });
  }
  if (question.length > 1000) {
    return NextResponse.json({ ok: false, error: "Question too long (max 1000 chars)." }, { status: 400 });
  }

  const summary = buildFundSummary();
  const breakdown = buildRiskBreakdown();
  const ctx: FundContext = {
    summary,
    holdings: buildHoldings(),
    strategy: buildStrategyState(),
    risk: {
      score: summary.riskScore,
      regime: summary.riskRegime,
      exposureCap: summary.exposureCap,
      breakdown,
    },
    latestDecision: buildDecisionFeed(1)[0] ?? null,
  };

  const aiLive = hasAI() ? await probeAI() : false;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamCopilotAnswer(question, ctx)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Copilot error";
        controller.enqueue(encoder.encode(`\n\n[error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Copilot-Mode": aiLive ? "ai" : "heuristic",
      "X-Copilot-Model": AI_PROVIDER.model,
    },
  });
}
