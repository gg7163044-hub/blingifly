# Blingifly — AI Image Studio

A responsive Next.js app for text-to-image generation and prompt-based photo editing. The browser talks only to your own server routes; the Gemini API key stays server-side.

## Features

- Text-to-image generation through Google's Gemini API.
- Photo editing using an uploaded PNG, JPEG, or WebP image.
- Download generated/edited images.
- Responsive dark neon interface with example prompts, upload preview, loading/error states.
- API key kept in server-only environment variables.
- Upload size and MIME-type validation, prompt length limits, same-origin request checks, security headers.

## Important reality check

This repo is real application code, but it is **not deployed yet**, and AI will not work until you configure a valid provider key and verify your account/model access. Provider free quotas, model names, geographic availability, and billing policies can change. Do not assume a free tier is unlimited.

## Requirements

- Node.js 20.9+ (recommended)
- A Google AI Studio / Gemini API key with access to an image-capable model.
- A GitHub account and Vercel account to deploy (free plans subject to their current limits).

## Run locally

1. Install Node.js.
2. Copy `.env.example` to `.env.local`.
3. Add your provider key to `.env.local`:
   ```env
   GEMINI_API_KEY=your_key_here
   GEMINI_IMAGE_MODEL=gemini-nano-banana-2.1
   APP_ORIGIN=http://localhost:3000
   ```
4. Install and start:
   ```bash
   npm install
   npm run dev
   ```
5. Open `http://localhost:3000`.

If the model name is unavailable to your account, select an image-capable model shown in your provider dashboard and update `GEMINI_IMAGE_MODEL`. Do not put the key in any `NEXT_PUBLIC_` variable or commit `.env.local`.

## Deploy free-tier-first to Vercel

1. Create a GitHub repository and upload this project (do not upload `.env.local`).
2. Import the repo into Vercel.
3. In Vercel Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your secret key
   - `GEMINI_IMAGE_MODEL` = an image-capable model available to your key
   - `APP_ORIGIN` = your final HTTPS domain, e.g. `https://your-project.vercel.app`
4. Deploy. If you add or change environment variables, redeploy.
5. Open `/api/health` on the deployed site. It reports whether a key is configured, not whether the provider key/model is valid.
6. Test one simple generation and one photo edit. Inspect provider quota/billing settings before sharing publicly.

## API routes

- `GET /api/health` — configuration status.
- `POST /api/generate` — JSON `{ "prompt": "..." }`.
- `POST /api/edit` — multipart form fields `image` and `prompt`.

Responses return a data URL to keep the first version simple. For a high-traffic production service, add authenticated users, per-user/IP rate limiting, usage quotas, abuse controls, durable object storage, deletion policies, and observability before public launch.

## Current MVP limitations

- No login/accounts or saved gallery.
- No persistent image storage; images exist in the response/browser until downloaded.
- No database or payment system.
- Provider output and prompt safety are subject to the provider's policies.
- Basic origin validation is not a replacement for rate limiting or abuse prevention.
- Free hosting and provider quotas may throttle or pause usage.

## Security checklist before public launch

- Keep API key server-side only.
- Set `APP_ORIGIN` to the exact production origin.
- Set a strict provider budget/quota alert if available.
- Add rate limiting (e.g. a suitable managed service) before publishing widely.
- Add CAPTCHA/abuse prevention if anonymous use is enabled.
- Consider image privacy, retention, moderation, and terms of service.
- Run `npm run build` and test the deployed endpoints.
