import { NextResponse } from "next/server";
import { buildFundSummary } from "@/lib/mock";

export const revalidate = 0;

export async function GET() {
  const data = buildFundSummary();
  return NextResponse.json({
    ok: true,
    data,
    source: "internal/risk-engine",
    generatedAt: Date.now(),
  });
}
