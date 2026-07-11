import { NextResponse } from "next/server";
import { hasAI, probeAI, AI_PROVIDER } from "@/lib/ai";
import { hasSosoKey, probeSoso } from "@/lib/sosovalue";
import { hasSodexKey } from "@/lib/sodex";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const [aiLive, sosoLive] = await Promise.all([
    hasAI() ? probeAI() : Promise.resolve(false),
    hasSosoKey() ? probeSoso() : Promise.resolve(false),
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      ai: {
        provider: hasAI() ? AI_PROVIDER.label : "none",
        model: AI_PROVIDER.model,
        baseUrl: AI_PROVIDER.baseUrl,
        configured: hasAI(),
        live: aiLive,
      },
      sosovalue: {
        configured: hasSosoKey(),
        live: sosoLive,
      },
      sodex: {
        configured: hasSodexKey(),
        mode: hasSodexKey() ? "live (testnet)" : "dry-run",
      },
    },
    source: "internal/health",
    generatedAt: Date.now(),
  });
}
