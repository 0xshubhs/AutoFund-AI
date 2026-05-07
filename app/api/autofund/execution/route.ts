import { NextResponse } from "next/server";
import { buildOrders } from "@/lib/mock";

export const revalidate = 0;

export async function GET() {
  const orders = buildOrders(10);
  const filled = orders.filter((o) => o.status === "FILLED");
  const slippages = filled.map((o) => o.slippageBps);
  const acks = filled.map((o) => o.ackMs);
  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
  return NextResponse.json({
    ok: true,
    data: {
      orders,
      stats: {
        avgSlippageBps: avg(slippages),
        avgAckMs: avg(acks),
        fillRate: orders.length === 0 ? 0 : Math.round((filled.length / orders.length) * 100),
      },
    },
    source: "SoDEX/order-router",
    generatedAt: Date.now(),
  });
}
