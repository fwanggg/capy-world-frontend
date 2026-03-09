# Capybara AI

A full-stack web application built with React, Node.js, and TypeScript.

## Project Structure

```
├── frontend/       # React + TypeScript web application
├── backend/        # Express.js API server
├── shared/         # Shared types and utilities
└── package.json    # Root workspace configuration
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Running Development Servers

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will:
- Run the frontend on `http://localhost:3000`
- Run the backend on `http://localhost:3001`
- Automatically proxy API calls from frontend to backend

### Running Individual Services

**Frontend only:**
```bash
npm run dev --workspace=frontend
```

**Backend only:**
```bash
npm run dev --workspace=backend
```

### Building

Build all workspaces:

```bash
npm run build
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development servers (frontend + backend) |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm test` | Run tests in all workspaces |

## Architecture

### Frontend

- React 18 with TypeScript
- Vite for fast development and optimized builds
- API integration with backend

### Backend

- Express.js server
- CORS enabled for frontend communication
- Runs on port 3001

### Shared

Shared types and utilities used by both frontend and backend.

## Authentication

Capybara AI uses **Supabase Auth** with **Google OAuth** for authentication.

### Setup (Development)

1. **Supabase Configuration**
   - Local Supabase instance runs on port 54321
   - Google OAuth provider configured in `supabase/config.toml`
   - JWT secret stored in `SUPABASE_JWT_SECRET` environment variable

2. **Google OAuth Credentials**
   - Get from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials (Web application type)
   - Authorized JavaScript Origins: `http://localhost:3000`
   - Authorized Redirect URIs: `http://localhost:3000/auth/callback`
   - Add Client ID to `supabase/config.toml`
   - Add Client Secret to `.env` as `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`

3. **Environment Variables**
   - Backend: `SUPABASE_JWT_SECRET` (from Supabase project settings)
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`
   - See `.env.example` and `frontend/.env.example` for template

### Sign-In Flow

1. User clicks "Sign in with Google" on `/waitlist` page
2. Google One-Tap UI loads and user selects account
3. Frontend calls `supabase.auth.signInWithIdToken()` with Google credential
4. Supabase creates session and JWT token automatically
5. Redirect to `/auth/callback` to verify session
6. On successful verification, redirect to `/chat`
7. Supabase SDK automatically stores session in localStorage and manages token refresh

### Approval Workflow

- New users are created with `approved: false` in `app_users` table
- Admin manually approves users in Supabase Dashboard
- Protected endpoints check approval status before granting access
- Development mode (`DEV=true`) auto-approves users on first login

### API Authentication

All backend API requests require:
```
Authorization: Bearer {jwt_token}
```

The Supabase SDK automatically includes this header when making requests. Frontend code uses:
```typescript
const authHeaders = await getAuthHeaders()
const response = await fetch('/api/...', {
  headers: { ...authHeaders, 'Content-Type': 'application/json' },
})
```

### Development Mode

Enable with:
```bash
DEV=true npm run dev
```

Features:
- Auto-creates users in `app_users` table with `approved: true`
- Bypasses Supabase OAuth setup for testing
- Uses real database for persistence
- Allows E2E testing with test credentials
