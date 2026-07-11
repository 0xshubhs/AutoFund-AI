import { NextResponse } from "next/server";
import {
  buildDecisionFeed,
  buildFundSummary,
  buildHoldings,
  buildRiskBreakdown,
  buildStrategyState,
} from "@/lib/mock";
import { generateBrief, AI_PROVIDER, type FundContext } from "@/lib/ai";

export const runtime = "nodejs";
export const revalidate = 0;

// The brief is polled by the dashboard; generating it on every hit would hammer
// the model server. Cache the last generated brief for BRIEF_TTL_MS.
const BRIEF_TTL_MS = 90_000;
let cache: { at: number; text: string; live: boolean } | null = null;

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at > BRIEF_TTL_MS) {
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
    const { text, live } = await generateBrief(ctx);
    cache = { at: now, text, live };
  }

  return NextResponse.json({
    ok: true,
    data: { brief: cache.text, model: AI_PROVIDER.model, live: cache.live },
    source: cache.live ? `${AI_PROVIDER.label} (desk brief)` : "heuristic desk brief",
    generatedAt: cache.at,
  });
}
