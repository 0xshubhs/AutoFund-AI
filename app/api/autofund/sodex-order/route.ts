import { NextResponse } from "next/server";
import { submitSodexOrder, hasSodexKey, type SodexSide } from "@/lib/sodex";
import { buildHoldings } from "@/lib/mock";

export const runtime = "nodejs";
export const revalidate = 0;

type Body = {
  symbol?: string;
  side?: SodexSide;
  size?: number;
  price?: number;
};

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // tolerate empty body — caller can hit the endpoint with no payload to get a default test order
  }

  // If the caller didn't pass an order, pick a reasonable test order from the
  // current top holding so the demo button always has something sensible to send.
  let { symbol, side, size, price } = body;
  if (!symbol || !side || size == null || price == null) {
    const top = buildHoldings()[0];
    symbol = symbol ?? `${top.symbol}-USDT`;
    side = side ?? "BUY";
    size = size ?? 0.05;
    price = price ?? top.price;
  }

  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ ok: false, error: "size must be a positive number" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ ok: false, error: "price must be a positive number" }, { status: 400 });
  }
  if (side !== "BUY" && side !== "SELL") {
    return NextResponse.json({ ok: false, error: "side must be BUY or SELL" }, { status: 400 });
  }

  const result = await submitSodexOrder({ symbol, side, size, price });

  return NextResponse.json({
    ok: result.ok,
    data: result,
    source: hasSodexKey() ? "SoDEX/order-router (live)" : "SoDEX/order-router (dry-run)",
    generatedAt: Date.now(),
  });
}
