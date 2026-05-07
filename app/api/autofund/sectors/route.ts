import { NextResponse } from "next/server";
import { buildSectorSpotlight } from "@/lib/mock";
import { getSectorSpotlight, hasSosoKey, type SectorSpotlightItem } from "@/lib/sosovalue";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  if (hasSosoKey()) {
    try {
      const live = await getSectorSpotlight();
      const data = (live.data ?? []) as SectorSpotlightItem[];
      return NextResponse.json({
        ok: true,
        data,
        source: "SoSoValue/sector-spotlight",
        generatedAt: Date.now(),
      });
    } catch (err) {
      return NextResponse.json({
        ok: true,
        data: buildSectorSpotlight(),
        source: `SoSoValue/sector-spotlight (fallback: ${(err as Error).message.slice(0, 80)})`,
        generatedAt: Date.now(),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    data: buildSectorSpotlight(),
    source: "SoSoValue/sector-spotlight (offline preview)",
    generatedAt: Date.now(),
  });
}
