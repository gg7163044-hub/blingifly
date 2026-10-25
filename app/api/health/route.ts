import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    providerConfigured: Boolean(process.env.GEMINI_API_KEY),
    provider: "Google Gemini",
    mode: process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1"
  });
}