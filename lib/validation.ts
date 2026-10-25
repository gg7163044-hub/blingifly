export const MAX_PROMPT_LENGTH = 1800;
export const MAX_IMAGE_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 4 * 1024 * 1024);
export const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function isAllowedImageType(type: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type);
}

export function validatePrompt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const prompt = value.trim();
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) return null;
  return prompt;
}

export function originAllowed(request: Request): boolean {
  const configured = process.env.APP_ORIGIN?.trim();
  const origin = request.headers.get("origin");
  // Same-origin requests from a browser usually include Origin on POST.
  if (!origin) return true;
  if (configured) return origin === configured;
  try {
    const requestUrl = new URL(request.url);
    return origin === requestUrl.origin;
  } catch {
    return false;
  }
}