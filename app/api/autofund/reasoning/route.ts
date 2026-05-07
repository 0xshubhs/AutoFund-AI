import { NextResponse } from "next/server";
import {
  buildDecisionFeed,
  buildFundSummary,
  buildHoldings,
  buildRiskBreakdown,
  buildStrategyState,
} from "@/lib/mock";
import { enrichDecisionReasons, hasAI, AI_PROVIDER, type FundContext } from "@/lib/ai";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const decisions = buildDecisionFeed(6);

  if (hasAI() && decisions[0]) {
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
      latestDecision: decisions[0],
    };
    const enriched = await enrichDecisionReasons(decisions[0], ctx);
    decisions[0] = { ...decisions[0], reasons: enriched };
  }

  return NextResponse.json({
    ok: true,
    data: decisions,
    source: hasAI() ? `internal/reasoning-log + ${AI_PROVIDER.model}` : "internal/reasoning-log",
    generatedAt: Date.now(),
  });
}
