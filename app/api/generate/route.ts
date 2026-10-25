import { NextResponse } from "next/server";
import { MAX_PROMPT_LENGTH, originAllowed, validatePrompt } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!originAllowed(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI generation isn't configured yet. Add GEMINI_API_KEY to your hosting provider's server-side environment variables." }, { status: 503 });

  let body: { prompt?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Please send a valid JSON request." }, { status: 400 }); }

  const prompt = validatePrompt(body.prompt);
  if (!prompt) return NextResponse.json({ error: `Enter a prompt between 1 and ${MAX_PROMPT_LENGTH} characters.` }, { status: 400 });

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1";
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        input: [{ type: "text", text: `Generate one high-quality image based on this request. Return an image, not just a description. Prompt: ${prompt}` }]
      }),
      signal: AbortSignal.timeout(55_000)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const status = response.status;
      const message = status === 429 ? "The AI provider rate limit or quota has been reached. Try later or check your provider quota." : status === 401 || status === 403 ? "The AI provider rejected the API key or this model isn't enabled. Check your key and model access." : "The AI provider couldn't generate an image right now.";
      console.error("Gemini generation failed", status, data?.error?.message || "No provider message");
      return NextResponse.json({ error: message }, { status: status === 429 ? 429 : 502 });
    }
    const image = data?.output_image || data?.output?.find((item: any) => item?.type === "image" && item?.data);
    if (!image?.data) return NextResponse.json({ error: "The provider returned no image. Try a more specific prompt or check that your selected model supports image output." }, { status: 502 });
    const mimeType = image.mime_type || image.mimeType || "image/png";
    return NextResponse.json({ image: `data:${mimeType};base64,${image.data}`, mimeType, prompt, model });
  } catch (error) {
    console.error("Gemini generation request failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The AI request timed out or couldn't connect. Please try again." }, { status: 504 });
  }
}
