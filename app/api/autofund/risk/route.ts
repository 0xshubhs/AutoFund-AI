import { NextResponse } from "next/server";
import { buildFundSummary, buildRiskBreakdown, buildSeries } from "@/lib/mock";

export const revalidate = 0;

export async function GET() {
  const summary = buildFundSummary();
  return NextResponse.json({
    ok: true,
    data: {
      score: summary.riskScore,
      regime: summary.riskRegime,
      exposureCap: summary.exposureCap,
      breakdown: buildRiskBreakdown(),
      drawdown: buildSeries(36).map((p) => ({ t: p.t, ts: p.ts, drawdown: p.drawdown, risk: p.risk })),
    },
    source: "internal/risk-engine",
    generatedAt: Date.now(),
  });
}
