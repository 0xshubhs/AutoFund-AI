import { NextResponse } from "next/server";
import { buildStrategyState } from "@/lib/mock";
import { buildSignalVector } from "@/lib/signals";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const signals = await buildSignalVector();
  const state = buildStrategyState(signals.scores);

  // Plain-English explanation of why each strategy scored as it did.
  const explanations: Record<string, string> = {
    momentum: `Driven by breadth-weighted 24h momentum (${(signals.momentum * 100).toFixed(0)}) and sector tilt (${(signals.sectorTilt * 100).toFixed(0)}); penalized by chop.`,
    index: `Favored when momentum is muted and dispersion low (vol ${(signals.volatility * 100).toFixed(0)}%); lifted by steady ETF flow.`,
    news: `Sentiment conviction ${(signals.newsConviction * 100).toFixed(0)} (${signals.context.bullishNews} bullish / ${signals.context.bearishNews} bearish) confirmed by ETF flow ${(signals.etfFlow * 100).toFixed(0)}.`,
    balanced: `Safe-harbor weight; rises as realized volatility (${(signals.volatility * 100).toFixed(0)}%) climbs.`,
  };

  return NextResponse.json({
    ok: true,
    data: {
      ...state,
      signals,
      explanations,
    },
    source: signals.source,
    generatedAt: Date.now(),
  });
}
