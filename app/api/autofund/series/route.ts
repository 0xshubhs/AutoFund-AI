import { NextResponse } from "next/server";
import { buildSeries } from "@/lib/mock";

export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const points = Math.min(120, Math.max(8, Number(url.searchParams.get("points") ?? 30)));
  const data = buildSeries(points);
  return NextResponse.json({
    ok: true,
    data,
    source: "SoSoValue / internal NAV calc",
    generatedAt: Date.now(),
  });
}
