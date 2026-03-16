# Capybara AI

A full-stack web application for research and persona testing. Capybara AI orchestrates digital personas—you describe your research goal, and it finds, activates, and manages relevant personas for group conversations.

## Features

- **Agentic orchestration** — Capybara AI uses tools to explore demographics, search personas, and activate them in your session
- **Studyrooms** — Organize research by room; each studyroom owns one chat session
- **Group conversations** — Message multiple personas in parallel, or route to Capybara for synthesis
- **Streaming** — Live reasoning steps and responding indicators
- **Privacy** — Personas are identified by `anonymous_id` only; Reddit usernames are never exposed

## Project Structure

```
├── frontend/       # React 18 + TypeScript + Vite
├── backend/        # Express.js API server
├── shared/         # Shared types and utilities
└── package.json    # Root npm workspace
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Running Development Servers

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Proxies: `/api`, `/chat`, `/auth`, `/clones`, `/studyrooms`, `/user` → backend

### Individual Services

```bash
npm run dev --workspace=frontend   # Frontend only
npm run dev --workspace=backend   # Backend only
```

### Vercel Dev (production-like local)

Run the app with Vercel's local server to test SPA routing and rewrites as in production:

```bash
npx vercel login   # One-time: authenticate with Vercel
cd frontend && npx vercel link --yes   # One-time: link to a Vercel project (creates one if needed)
npm run dev:vercel
```

- Uses `vercel dev` from `frontend/` + backend (DEV mode)
- SPA routes like `/waitlist` work the same as production
- Frontend: `http://localhost:3000`

**Note:** `vercel dev` must run from the `frontend/` directory (root dir name `capybara-AI` has uppercase and violates Vercel project naming).

**Production:** Set `BACKEND_URL` in Vercel project settings (e.g. `https://api.yourdomain.com`). Local dev uses `http://127.0.0.1:3001` when unset. No config changes needed per deploy.

### Build

```bash
npm run build
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend |
| `npm run dev:vercel` | Vercel dev + backend (test prod-like routing) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |

## Architecture

- **Frontend:** React 18, Vite, studyroom-based chat flow
- **Backend:** Express.js, Capybara agentic loop with 8 tools, persona/clone execution
- **Shared:** TypeScript types and utilities
- **Database:** Supabase (PostgreSQL). Key tables: `personas`, `chat_sessions`, `chat_messages`, `studyrooms`, `waitlist`

## Authentication

Uses **Supabase Auth** with **Google OAuth**.

### Setup

1. **Supabase** — Configure in `supabase/config.toml`, JWT secret in `SUPABASE_JWT_SECRET`
2. **Google OAuth** — Create credentials in [Google Cloud Console](https://console.cloud.google.com/). Redirect: `http://localhost:3000/auth/callback`
3. **Environment** — Single root `.env`. See `.env.example`. Vite loads via `envDir: '..'`

### Sign-In Flow

1. User signs in with Google on `/waitlist`
2. Supabase creates session, stores JWT
3. Redirect to `/auth/callback` → `/chat`
4. `checkApproval` middleware enforces `waitlist.approval_status === 'approved'`

### Development

Auth works the same as production. Sign in with Google OAuth on `/waitlist`. Admin must approve users in the waitlist table for chat access.

## Documentation

- `CLAUDE.md` — Detailed architecture and implementation guide
- `docs/PERSONA_PRIVACY.md` — anonymous_id and future inserts
- `docs/E2E_TESTING.md` — Testing guide
