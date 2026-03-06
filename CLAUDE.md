# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Capybara AI** is a full-stack web application using:
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript + Node.js
- **Shared**: TypeScript utilities and types shared between frontend and backend

The project uses npm workspaces to manage three independent packages (`frontend`, `backend`, `shared`) with shared TypeScript configuration at the root.

## Architecture

### Frontend (`/frontend`)
- Vite-powered React development
- Hot module replacement for fast iteration
- Proxies API requests to backend on `localhost:3001`
- Components in `src/`, styles in `main.css`
- Builds to `dist/`

### Backend (`/backend`)
- Express.js REST API
- Runs on port 3001
- CORS enabled for frontend requests
- Auto-reloads with `tsx watch` during development
- Compiles to `dist/`

### Shared (`/shared`)
- Reusable TypeScript types and utilities
- Used by both frontend and backend
- Think: API response types, validation functions, helpers
- Keep minimal — only genuinely shared code goes here

## Development Commands

**Start all services:**
```bash
npm run dev
```
Runs frontend (port 3000) + backend (port 3001) concurrently.

**Frontend only:**
```bash
npm run dev --workspace=frontend
```

**Backend only:**
```bash
npm run dev --workspace=backend
```

**Build:**
```bash
npm run build
```
Compiles TypeScript and bundles frontend with Vite.

**Lint:**
```bash
npm run lint
```

## Common Workflows

### Adding a New API Endpoint

1. **Backend**: Add route in `backend/src/index.ts` or create a new route file
2. **Frontend**: Fetch from `/api/your-endpoint` (Vite proxy handles routing)
3. **Types** (optional): If sharing response types, define in `shared/src/types.ts`

Example:
```typescript
// backend/src/index.ts
app.get('/api/data', (req, res) => {
  res.json({ data: 'example' })
})

// frontend/src/App.tsx
const res = await fetch('/api/data')
```

### Adding Shared Types

1. Create file in `shared/src/` (e.g., `types.ts`)
2. Export types from `shared/src/index.ts`
3. Import in frontend/backend:
   ```typescript
   import { MyType } from '../shared/src/types'
   ```

### Adding Frontend Components

- Create in `frontend/src/` directory
- Keep components focused and single-purpose
- Naming: PascalCase (e.g., `UserCard.tsx`)

### Adding Backend Routes

- Keep routes organized; create separate files as complexity grows
- Keep business logic separate from Express route handlers
- Example structure as you grow:
  ```
  backend/src/
  ├── routes/
  │   ├── api.ts
  │   └── health.ts
  └── index.ts
  ```

## File Organization Principles

- **One responsibility per file** — split files larger than ~300 lines
- **Domain-based structure** — organize by feature, not by type (don't put all "components" together)
- **Avoid duplication** — check if similar functionality exists before creating new files
- **Keep it modular** — each file should be independently understandable

## TypeScript Configuration

All three workspaces extend the root `tsconfig.json`:
- `compilerOptions.strict: true` — strict type checking enabled
- `target: ES2020` — modern JavaScript target
- Each workspace has its own `tsconfig.json` for specific compiler options

## Debugging

**Frontend debugging:**
- Open DevTools in browser (port 3000)
- Network tab shows requests to `/api/*` endpoints
- Console shows React errors and logs

**Backend debugging:**
- Terminal shows server logs
- Add `console.log()` statements or use a debugger with `node --inspect`

## Important Patterns

### API Integration
- Frontend always fetches from `/api/...` (Vite proxy handles routing)
- Backend should use `res.json()` for JSON responses
- Always handle errors on both sides

### State Management
- Currently using React hooks (useState, useEffect)
- If state grows complex, consider adding state management library

### Shared Code
- Before adding to `shared/`, confirm it's truly used by both frontend and backend
- Keep `shared/` lightweight — it's imported by both, so size impacts both builds

## When Modifying Existing Code

1. Understand the current structure before changing
2. Check if your change breaks anything (test common flows)
3. Keep the architecture clean — refactor bloated files while making changes
4. Update relevant docs if architecture changes

## Port Configuration

- **Frontend**: 3000 (Vite dev server)
- **Backend**: 3001 (Express server)
- Frontend proxies `/api/*` requests to backend

Change ports in:
- `frontend/vite.config.ts` (frontend port + proxy config)
- `backend/src/index.ts` (backend port)

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm run dev` to start development
3. Open `http://localhost:3000` to see the app
4. Start building!
