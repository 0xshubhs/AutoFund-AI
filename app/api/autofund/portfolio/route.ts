import { NextResponse } from "next/server";
import { buildAllocationHistory, buildHoldings } from "@/lib/mock";

export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      holdings: buildHoldings(),
      allocationHistory: buildAllocationHistory(12),
    },
    source: "SoSoValue / internal book",
    generatedAt: Date.now(),
  });
}
