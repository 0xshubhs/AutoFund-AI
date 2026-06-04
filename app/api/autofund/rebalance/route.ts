import { NextResponse } from "next/server";
import { buildRebalanceDecision, topOrderFromDecision } from "@/lib/autofund";
import { hasSosoKey } from "@/lib/sosovalue";
import {
  loadMarketMindFromEnv,
  parseMarketMindSignal,
  type IngestedSignal,
} from "@/lib/marketmind";

export const runtime = "nodejs";
export const revalidate = 0;

type Body = {
  contradictionFlag?: boolean;
  // Optional MarketMind signal — paste/upload the marketmind.autofund.signal/v1
  // JSON and AutoFund ingests its contradiction flag + conviction into the gate.
  marketmindSignal?: unknown;
};

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // tolerate empty body
  }

  try {
    // Resolve a MarketMind signal: request body takes priority, then env. If
    // none is provided, behave exactly as before.
    let mm: IngestedSignal | null = null;
    if (body.marketmindSignal !== undefined) {
      mm = parseMarketMindSignal(body.marketmindSignal);
    } else {
      const envMm = await loadMarketMindFromEnv();
      if (envMm.valid) mm = envMm;
    }

    // The risk gate's contradiction input: explicit body flag OR an ingested
    // MarketMind contradiction. A high-conviction contradicting signal engages
    // the gate automatically.
    const contradictionFlag = Boolean(body.contradictionFlag) || Boolean(mm?.contradictionFlag);

    const decision = await buildRebalanceDecision({ contradictionFlag });
    const order = topOrderFromDecision(decision);

    return NextResponse.json({
      ok: true,
      data: {
        allocation: decision.allocation,
        rawAllocation: decision.rawAllocation,
        reasons: decision.reasons,
        confidence: decision.confidence,
        signals: decision.signals,
        gates: decision.gates,
        risk: decision.risk,
        suggestedOrder: order,
        marketmind: mm
          ? {
              ingested: true,
              source: mm.source,
              contradictionFlag: mm.contradictionFlag,
              conviction: mm.conviction,
              recommendedAction: mm.recommendedAction,
              schema: mm.schema,
              error: mm.error,
            }
          : { ingested: false },
      },
      source: mm?.valid
        ? `${decision.signals.source} + signal source: MarketMind`
        : decision.signals.source,
      generatedAt: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown rebalance error",
        source: hasSosoKey() ? "SoSoValue (error)" : "deterministic (error)",
        generatedAt: Date.now(),
      },
      { status: 500 },
    );
  }
}
