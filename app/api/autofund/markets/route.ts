import { NextResponse } from "next/server";
import {
  getMarketSnapshot,
  getIndexMarketSnapshot,
  hasSosoKey,
  type MarketSnapshot,
} from "@/lib/sosovalue";
import { deterministicMarketSnapshot } from "@/lib/mock";

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Surfaces the SoSoValue currency market-snapshot (and SSI index snapshot when
 * available) that was previously coded in lib/sosovalue.ts but never reached the
 * UI. Drives the dashboard benchmark row. Mock fallback keeps the zero-config
 * demo alive; `source` reports provenance honestly.
 */
export async function GET() {
  if (hasSosoKey()) {
    const [mRes, iRes] = await Promise.allSettled([getMarketSnapshot(), getIndexMarketSnapshot()]);
    const market = mRes.status === "fulfilled" ? (mRes.value.data ?? []) : deterministicMarketSnapshot();
    const index = iRes.status === "fulfilled" ? (iRes.value.data ?? []) : [];
    const live = mRes.status === "fulfilled";
    return NextResponse.json({
      ok: true,
      data: { market, index },
      source: live
        ? "SoSoValue/currency+index-market-snapshot"
        : `SoSoValue (fallback: ${pickReason(mRes)})`,
      generatedAt: Date.now(),
    });
  }

  return NextResponse.json({
    ok: true,
    data: { market: deterministicMarketSnapshot(), index: [] as MarketSnapshot[] },
    source: "SoSoValue/market-snapshot (offline preview)",
    generatedAt: Date.now(),
  });
}

function pickReason(r: PromiseSettledResult<unknown>): string {
  return r.status === "rejected" ? String(r.reason).slice(0, 60) : "ok";
}
