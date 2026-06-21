# FarmGPT

FarmGPT is an AI-powered farming assistant built for simple rural access. It helps farmers ask questions, analyze farm images, check weather and news, and generate water-use reports through a web app and a phone calling experience.

## Key Features

- Voice-first Krishi Mitra assistant for farming questions
- Phone access: farmers can call `+1 (434) 772 1158` to talk to Krishi Mitra
- Text AI powered by OpenRouter using `deepseek/deepseek-v4-flash`
- Image analysis powered by OpenRouter using `google/gemini-2.5-flash-lite`
- Speech-to-text support with AssemblyAI
- Farming news and government scheme updates with NewsData.io
- Weather and rainfall guidance for farm planning
- Water-use reports and crop/irrigation recommendations
- English and Hindi interface

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui style components
- OpenRouter
- AssemblyAI
- NewsData.io
- Cloudflare Pages

## Environment Variables

Create `.env.local` for local development:

```env
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_key
VITE_NEWSDATA_API_KEY=your_newsdata_key
```

Do not commit real keys. `.env.local` is ignored by Git.

## Local Development

```bash
npm install
npm run dev
```

The local app runs on the Vite dev server.

## Production Build

```bash
npm run build
```

The production output is generated in `dist/`.

## Cloudflare Pages Deployment

Use these Cloudflare Pages build settings:

```txt
Framework preset: React (Vite)
Build command: npm run build
Build output directory: dist
Root directory: /
Node.js version: 22
```

Add these environment variables in Cloudflare Pages:

```env
VITE_OPENROUTER_API_KEY=...
VITE_ASSEMBLYAI_API_KEY=...
VITE_NEWSDATA_API_KEY=...
```

Add this Cloudflare Pages secret for server-side text-to-speech:

```env
elevenlabs=...
```

After saving variables, redeploy the latest commit.

## Project Notes

- PDF export is generated in-browser with `html2canvas` and `jsPDF`.
- ElevenLabs is used for spoken responses through the `/api/tts` Cloudflare Pages Function, with browser/system TTS as a fallback.
- AssemblyAI is used for speech-to-text, not text-to-speech.
- API keys exposed as `VITE_*` variables are visible in the browser. For production hardening, route provider calls through a Cloudflare Worker proxy.
