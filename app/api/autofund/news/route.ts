import { NextResponse } from "next/server";
import { buildNews } from "@/lib/mock";
import { getNews, hasSosoKey } from "@/lib/sosovalue";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(20, Math.max(2, Number(url.searchParams.get("limit") ?? 8)));

  if (hasSosoKey()) {
    try {
      const live = await getNews(limit);
      return NextResponse.json({
        ok: true,
        data: live.data,
        source: "SoSoValue/news",
        generatedAt: Date.now(),
      });
    } catch (err) {
      return NextResponse.json({
        ok: true,
        data: buildNews(limit),
        source: `SoSoValue/news (fallback: ${(err as Error).message.slice(0, 80)})`,
        generatedAt: Date.now(),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    data: buildNews(limit),
    source: "SoSoValue/news (offline preview)",
    generatedAt: Date.now(),
  });
}
