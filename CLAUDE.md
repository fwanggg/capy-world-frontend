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
- Frontend proxies `/api/*`, `/chat/*`, `/auth/*`, `/clones/*` requests to backend

Change ports in:
- `frontend/vite.config.ts` (frontend port + proxy config)
- `backend/src/index.ts` (backend port)

---

## Capybara AI Feature: Agentic Tool System

### Overview
Capybara AI is an intelligent orchestrator that:
1. **Receives** user messages via agentic loop with tool binding
2. **Searches** for relevant digital clones from `agent_memory` table
3. **Activates** selected clones as a group conversation
4. **Routes** subsequent messages to clones or back to Capybara for synthesis

**Key Principle:** Single unified session with intelligent message routing — no mode switching.

### Core Architecture

**Session State:**
- `active_clones: []` (initial) → routes messages to Capybara
- `active_clones: [11, 12, 13, 14, 15]` → routes messages to clones by default
- `target: "capybara"` (explicit) → always routes to Capybara (even with active clones)

**Message Flow:**
```
User → /chat/message
  ↓
Routing Decision:
  if (target === 'capybara')        → Capybara AI (agentic loop with tools)
  else if (active_clones.length > 0) → All active clones (parallel execution)
  else                               → Capybara AI (default)
  ↓
Response saved to chat_messages table
  ↓
Frontend receives response + optional session_transition
```

### Key Implementation Files

**Backend:**
- `backend/src/routes/chat.ts` - Message routing logic, session management
- `backend/src/services/langgraph-orchestrator.ts` - Agentic loop, clone execution
- `backend/src/middleware/auth.ts` - Authentication middleware

**Frontend:**
- `frontend/src/components/ChatInput.tsx` - @capybara mention parsing (line 14-19)
- `frontend/src/components/GodMode.tsx` - Initial message handling, clone activation UI
- `frontend/src/components/ConversationMode.tsx` - Group chat with clones
- `frontend/src/components/ChatMessage.tsx` - Message rendering with role-based styling

**Database:**
- `agent_memory` - Clone definitions with reddit_username and system_prompt
- `chat_sessions` - Session state (id, user_id, active_clones, metadata)
- `chat_messages` - Conversation history (role, sender_id, content)
- `app_users` - User profiles (auto-created in DEV mode)

### Agentic Loop (Capybara AI)

Located in `backend/src/services/langgraph-orchestrator.ts:callCapybaraAI()`

```typescript
1. Bind tools: search_clones, create_conversation_session
2. Loop (max 5 iterations):
   a. Invoke LLM with messages
   b. Check response.tool_calls
   c. If tool_calls:
      - Execute each tool
      - Append ToolMessage with tool_call_id + result
      - Continue loop
   d. If no tool_calls:
      - Extract finalResponse
      - Break loop
3. Return { response, session_transition? }
```

**Important:** Session ID passed into loop so `create_conversation_session` can update the right session.

### Message Routing Logic

**Backend (`backend/src/routes/chat.ts` POST /chat/message):**

```typescript
// Routing decision (lines 187-200)
const hasActiveClones = session.active_clones?.length > 0
const hasExplicitClones = target_clones?.length > 0
const routeToCapybara = target === 'capybara'
  || (session.mode === 'god' && target !== 'clones' && !hasActiveClones && !hasExplicitClones)

if (routeToCapybara) {
  callCapybaraAI(session_id, content, messageHistory)
} else {
  callMultipleClones(target_clones || session.active_clones, threadId, content)
}
```

**Frontend (@capybara parsing in `ChatInput.tsx`):**

```typescript
const capybaraMatch = input.match(/^@capybara\s+(.*)/)
if (capybaraMatch) {
  const message = capybaraMatch[1]
  onSend(message, undefined, 'capybara') // target='capybara'
}
```

### Clone Execution

**Each Clone (backend/src/services/langgraph-orchestrator.ts:callClone):**

1. Fetch clone from `agent_memory` table - **ALWAYS queries database, never mocks**
2. Log: `[CLONE] ✓✓✓ FETCHED CLONE X FROM agent_memory TABLE ✓✓✓`
3. Create LangChain messages with real system_prompt
4. Invoke LLM
5. Return response

**Multiple Clones (backend/src/services/langgraph-orchestrator.ts:callMultipleClones):**
- Execute all clones in parallel via Promise.all
- Return array of { clone_id, content }

### Real System Prompts

Each clone's `system_prompt` in agent_memory contains:
- Persona simulation instructions
- User's actual Reddit post/comment history (JSON)
- Context about their communication style
- Enables authentic, personalized responses

Example clone: User 11 (dryisnotwet) - infrastructure engineer with specific posting patterns

### UUID Mapping

**Why needed:** Supabase foreign keys require proper UUID format

**Implementation (backend/src/routes/chat.ts):**
```typescript
const userHeaderToUUID = (header: string): string => {
  const hash = createHash('md5').update(header).digest('hex')
  // MD5 hex → UUID v4 format
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`
}
```

DEV mode: x-user-id header (any string) → deterministic UUID
Session ID: generateUUID() → random UUID v4

### Development Mode

**Enable with:** `DEV=true npm run dev --workspace=backend`

**Features:**
- Auto-creates users in app_users table
- Sets `approved: true` (skips approval check)
- Sets `google_id: 'dev_' + userHeader` (required field)
- Uses real database for all persistence

**Why needed:** Allows E2E testing without OAuth setup

### API Contracts

**POST /chat/init**
- Request: `{ mode: "god" }`
- Response: Session with `active_clones: []`, UUID id

**POST /chat/message**
- Request: `{ session_id, content, target?: "capybara" | "clones" }`
- Response: `{ user_message, ai_responses[], session_transition? }`
- `session_transition` appears when clones are activated (contains clone_ids + clone_names)

**GET /chat/history**
- Query: `session_id={uuid}`
- Response: Array of all messages in chronological order

### Testing

**See:** `docs/E2E_TESTING.md` for complete testing guide with curl examples and bash scripts.

**Quick test flow:**
1. `POST /chat/init` → get session_id
2. `POST /chat/message` "test my pitch on startup founders" → Capybara activates clones
3. Look for `session_transition` in response
4. `POST /chat/message` "here's my pitch..." → clones respond
5. `POST /chat/message` "@capybara what patterns?" with `target: "capybara"` → synthesis

**Verification:**
- Check backend logs for `[CLONE] FETCHED`, `[ORCHESTRATOR]`, `[ROUTE]` prefixes
- Query `chat_messages` table to verify persistence
- Run `GET /chat/history` to retrieve full conversation

### Common Tasks

**Modifying message routing:**
- Location: `backend/src/routes/chat.ts` lines 187-220
- Always check: target parameter first, then active_clones state
- Test: All three routing paths (capybara, clones, fallback)

**Adding a new tool for Capybara:**
- Define function in `langgraph-orchestrator.ts`
- Create tool wrapper with schema using `tool()` from @langchain/core/tools
- Add to tools array in `llmWithTools = llm.bindTools([...])`
- Implement execution logic in tool_calls loop

**Adjusting clone behavior:**
- Edit system_prompt in agent_memory table
- CloneId fetch happens in real-time (no caching in callClone)
- Changes take effect immediately on next message

**Testing a new feature:**
- Use `docs/E2E_TESTING.md` bash script as template
- Always test with DEV=true and x-user-id header
- Verify backend logs show expected routing
- Check database for message persistence

---

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm run dev` to start development (or `DEV=true npm run dev --workspace=backend` for backend-only with dev mode)
3. Open `http://localhost:3000` to see the app
4. Follow `docs/E2E_TESTING.md` to test the full flow
