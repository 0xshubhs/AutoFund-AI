import { NextResponse } from "next/server";
import { buildRebalanceDecision } from "@/lib/autofund";
import { buildDecisionFeed } from "@/lib/mock";
import { RPC, readChainStatus } from "@/lib/chain";

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * DAO-treasurer "prove it" artifact: a self-contained JSON audit log of the
 * latest decision — the full signal vector, raw vs risk-gated target weights,
 * every gate passed/failed with its rationale, confidence, and the historical
 * decision timeline. Downloaded client-side from the Reasoning page.
 */
export async function GET() {
  const [decision, chain] = await Promise.all([
    buildRebalanceDecision(),
    readChainStatus(RPC.valuechain),
  ]);
  const history = buildDecisionFeed(8).map((d) => ({
    id: d.id,
    ts: d.ts,
    iso: new Date(d.ts).toISOString(),
    summary: d.summary,
    confidence: d.confidence,
    before: d.before,
    after: d.after,
    signals: d.signals,
    reasons: d.reasons,
  }));

  return NextResponse.json({
    ok: true,
    data: {
      schema: "autofund.audit.v1",
      generatedAt: new Date().toISOString(),
      provenance: decision.signals.source,
      // Real, keyless ValueChain L1 block observed when this artifact was
      // generated — anchors the decision to a verifiable on-chain height.
      onchainAnchor: {
        chain: "ValueChain L1",
        chainId: chain.chainId,
        blockNumber: chain.blockNumber,
        blockTimestamp: chain.blockTimestamp,
        live: chain.live,
        rpc: chain.rpc,
        source: "keyless JSON-RPC (no API key)",
      },
      latestDecision: {
        confidence: decision.confidence,
        reasons: decision.reasons,
        signals: decision.signals,
        rawTarget: decision.rawAllocation,
        riskGatedTarget: decision.allocation,
        risk: decision.risk,
        gates: decision.gates.map((g) => ({ id: g.id, label: g.label, passed: g.passed, detail: g.detail })),
      },
      decisionHistory: history,
    },
    source: decision.signals.source,
    generatedAt: Date.now(),
  });
}
