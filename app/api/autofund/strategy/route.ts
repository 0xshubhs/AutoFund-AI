import { NextResponse } from "next/server";
import { buildStrategyState } from "@/lib/mock";

export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: buildStrategyState(),
    source: "internal/strategy-router",
    generatedAt: Date.now(),
  });
}
