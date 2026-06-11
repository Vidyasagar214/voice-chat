# VoiceFlow

Voice-first AI chat with Jane — real-time listening, Groq-powered replies, and browser TTS.

## Project structure

```
voice-chat/
├── frontend/     React + Vite UI (mic, STT, TTS, settings)
├── backend/      Express API + Groq (local dev)
├── api/          Vercel serverless routes (production)
└── package.json  npm workspaces root
```

## Setup

1. Copy `.env.example` to `.env` at the repo root
2. Add your Groq API key (`gsk_...` from [console.groq.com](https://console.groq.com/keys))
3. Install dependencies:

```bash
npm install
```

## Development

Run frontend and backend together:

```bash
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8787

Or run separately:

```bash
npm run dev:backend   # API only
npm run dev           # Frontend only (proxies /api → backend)
```

## Build

```bash
npm run build         # Frontend production build → frontend/dist
npm run typecheck     # Backend TypeScript check
```

## Deploy (Vercel — frontend + API in one project)

1. Push to GitHub and import in Vercel
2. Set `GROQ_API_KEY` in Environment Variables
3. Deploy — `vercel.json` builds `frontend/` and serves `api/` routes

## Requirements

- Chrome or Edge for speech recognition
- Microphone permission (HTTPS in production)
- Groq API key for Jane's replies
