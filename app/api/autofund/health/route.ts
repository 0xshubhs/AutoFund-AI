import { NextResponse } from "next/server";
import { hasAI, AI_PROVIDER } from "@/lib/ai";

export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      ai: {
        provider: "qwen-vl-runpod",
        model: AI_PROVIDER.model,
        baseUrl: AI_PROVIDER.baseUrl,
        live: hasAI(),
      },
      sosovalue: {
        live: Boolean(process.env.SOSO_API_KEY),
      },
    },
    source: "internal/health",
    generatedAt: Date.now(),
  });
}
