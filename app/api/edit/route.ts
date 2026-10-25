import { NextResponse } from "next/server";
import { ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES, MAX_PROMPT_LENGTH, isAllowedImageType, originAllowed, validatePrompt } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!originAllowed(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI editing isn't configured yet. Add GEMINI_API_KEY to your hosting provider's server-side environment variables." }, { status: 503 });

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Upload a valid image and an edit instruction." }, { status: 400 }); }
  const file = form.get("image");
  const prompt = validatePrompt(form.get("prompt"));
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to edit." }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: `Enter an edit instruction between 1 and ${MAX_PROMPT_LENGTH} characters.` }, { status: 400 });
  if (!isAllowedImageType(file.type)) return NextResponse.json({ error: `Use PNG, JPEG, or WebP. Accepted types: ${ALLOWED_MIME_TYPES.join(", ")}.` }, { status: 415 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: `Image is too large. Maximum upload size is ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MiB.` }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1";
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        input: [
          { type: "text", text: `Edit the supplied image according to this instruction. Preserve the main subject and important identity details unless the user explicitly asks to change them. Return the edited image, not just a description. Edit instruction: ${prompt}` },
          { type: "image", mime_type: file.type, data: base64 }
        ]
      }),
      signal: AbortSignal.timeout(55_000)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const status = response.status;
      const message = status === 429 ? "The AI provider rate limit or quota has been reached. Try later or check your provider quota." : status === 401 || status === 403 ? "The AI provider rejected the API key or this model isn't enabled. Check your key and model access." : "The AI provider couldn't edit this image right now.";
      console.error("Gemini edit failed", status, data?.error?.message || "No provider message");
      return NextResponse.json({ error: message }, { status: status === 429 ? 429 : 502 });
    }
    const image = data?.output_image || data?.output?.find((item: any) => item?.type === "image" && item?.data);
    if (!image?.data) return NextResponse.json({ error: "The provider returned no edited image. Try a simpler instruction or check model image-editing support." }, { status: 502 });
    const mimeType = image.mime_type || image.mimeType || "image/png";
    return NextResponse.json({ image: `data:${mimeType};base64,${image.data}`, mimeType, prompt, model });
  } catch (error) {
    console.error("Gemini edit request failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The AI request timed out or couldn't connect. Please try again." }, { status: 504 });
  }
}
