import { NextResponse } from "next/server";
import { buildRebalanceDecision, executeSodexOrdersFromAllocation } from "@/lib/autofund";

export async function POST() {
  try {
    const decision = await buildRebalanceDecision();
    const execution = await executeSodexOrdersFromAllocation(decision.allocation);

    return NextResponse.json({
      ok: true,
      decision,
      execution,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown rebalance error",
      },
      { status: 500 },
    );
  }
}
