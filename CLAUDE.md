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

**Backend with dev mode** (auto-creates test users, skips OAuth):
```bash
DEV=true npm run dev --workspace=backend
```
Enables:
- Auto-creates users in `app_users` table
- Skips approval checks (sets `approved: true`)
- Accepts `x-user-id` header for testing
- Uses mock sessions to avoid foreign key constraints
- Real database for all persistence

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

### Recent Architecture Updates (Latest Session)

✅ **Three Independent Tools** — Replaced nested LLM calls with clean tool-based architecture:
- `get_demographic_segments()` — Explore available demographic fields
- `get_demographic_values()` — Get unique values for specified fields
- `search_clones()` — Query personas with demographic filters
- `create_conversation_session()` — Activate selected personas

✅ **Personas Table** — Switched from `agent_memory` to `personas` table with full demographic data

✅ **Reasoning Chain Capture** — Every Capybara response includes complete reasoning showing:
- Each tool call iteration
- Tool inputs and outputs
- Human-readable summaries
- Displayed in frontend UI with expand/collapse

✅ **No LLM Calls in Tools** — All intelligence in agentic loop, tools return pure data

### Overview
Capybara AI is an intelligent orchestrator that:
1. **Receives** user messages via agentic loop with tool binding
2. **Explores** available demographic segments using `get_demographic_segments()`
3. **Retrieves** available values for relevant demographics using `get_demographic_values()`
4. **Searches** for matching personas from `personas` table using `search_clones()`
5. **Activates** selected personas as a group conversation using `create_conversation_session()`
6. **Routes** subsequent messages to personas or back to Capybara for synthesis

**Key Principle:** Single unified session with intelligent message routing — no mode switching. LLM orchestrates tool usage dynamically based on user intent.

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

**Database Tables:**

**personas** — Digital personas with demographics and instructions
- `id` — Unique identifier
- `reddit_username` — Person's handle (e.g., "dryisnotwet")
- `age` — Age in years (for age range filtering)
- `gender` — "male", "female", or null
- `location` — City/region (e.g., "Seattle, USA")
- `profession` — Job/role (e.g., "engineer", "student", "dancer")
- `spending_power` — "high", "mid", "low", or null
- `interests` — Array of interests (e.g., ["technology", "startups"])
- `interaction_history` — JSONB of the persona's Reddit interaction data (posts, comments, references, total_conversations). Used by `buildPersonaPrompt()` to dynamically construct the full system prompt.
- `prompt` — Legacy full system prompt (retained for reference; no longer read by `callClone()`)
- `created_at`, `updated_at` — Timestamps

**chat_sessions** — Session state for each conversation
- `id` — Session UUID
- `user_id` — User's auth UUID
- `active_clones` — Array of persona IDs currently active (e.g., [17, 24])
- `mode` — "god" (Capybara only) or "conversation" (with personas)
- `metadata` — Additional context (JSON)
- `created_at`, `updated_at` — Timestamps

**chat_messages** — Conversation history
- `id` — Message UUID
- `session_id` — Session UUID (foreign key)
- `role` — "user", "capybara", or "clone"
- `sender_id` — User UUID or "capybara-ai" or persona ID
- `content` — Message text
- `created_at` — Timestamp

**app_users** — User profiles and approval status
- `user_id` — User UUID (foreign key to auth.users)
- `approved` — Boolean (true = can access app)
- `google_id` — OAuth identifier
- `created_at`, `updated_at` — Timestamps

### Three-Tool Architecture

Capybara uses **three independent tools** with **no LLM calls inside them**. The LLM orchestrates tool usage in the agentic loop:

**Tool 1: `get_demographic_segments()`**
- Returns available demographic field names: `["age", "gender", "location", "profession", "spending_power", "interests"]`
- Pure data retrieval — no computation

**Tool 2: `get_demographic_values({segments: string[]})`**
- Input: List of demographic field names to explore
- Output: Distinct values for each field (e.g., `{profession: ["engineer", "student", "dancer"], gender: ["male", "female"]}`)
- Pure database query — helps LLM understand available values before searching

**Tool 3: `search_clones({profession?, age_min?, age_max?, gender?, location?, spending_power?, interests?, count?})`**
- Input: Specific demographic filters (not natural language)
- Output: Array of matching personas from `personas` table
- Pure SQL query — LLM decides which filters to apply based on Tool 2 results

**Tool 4: `create_conversation_session({clone_ids: string[], session_id: string})`**
- Activates selected personas in the session
- Triggers `session_transition` for frontend routing

### Agentic Loop (Capybara AI)

Located in `backend/src/services/langgraph-orchestrator.ts:callCapybaraAI()`

```typescript
1. Bind all four tools to LLM
2. Loop (max 10 iterations):
   a. Invoke LLM with messages and tools
   b. Check response.tool_calls
   c. If tool_calls:
      - Execute each tool (1-4)
      - Capture ReasoningStep for each execution
      - Append ToolMessage with result
      - Continue loop
   d. If no tool_calls:
      - Extract finalResponse
      - Break loop
3. Return {
     response: string,
     reasoning: ReasoningStep[],
     session_transition?: {...}
   }
```

**Intelligence Flow:**
1. User: "Find 3 engineers in their 30s"
2. Capybara calls `get_demographic_segments()` → learns what fields exist
3. Capybara calls `get_demographic_values({segments: ["profession"]})` → learns available professions
4. Capybara calls `search_clones({profession: "engineer", age_min: 30, age_max: 39, count: 3})` → finds matches
5. Capybara calls `create_conversation_session({clone_ids: [...]})` → activates personas
6. Capybara generates response: "I've activated 3 engineer personas..."

**Important:**
- No LLM calls inside tools — all intelligence happens in the agentic loop
- LLM decides tool order and parameters dynamically
- Session ID passed into loop so tools can update the right session

### Reasoning Chain Capture & Display

Every Capybara response includes a **reasoning chain** showing the thought process. This is captured during tool execution and displayed in the frontend UI.

**Backend Capture** (`backend/src/services/langgraph-orchestrator.ts`):
```typescript
interface ReasoningStep {
  iteration: number          // Which iteration (1, 2, 3...)
  action: string            // What Capybara was trying to do
  toolName: string          // Which tool was called
  input?: any               // What was passed to the tool
  output?: any              // What the tool returned
  summary: string           // Human-readable explanation
}
```

Each tool execution creates a `ReasoningStep` and stores in `reasoning[]` array.

**API Response** (`backend/src/routes/chat.ts`):
```json
{
  "user_message": {...},
  "ai_responses": [{
    "role": "capybara",
    "sender_id": "capybara-ai",
    "content": "I've activated 1 engineer persona: EQ4C..."
  }],
  "capybara_reasoning": [
    {
      "iteration": 1,
      "action": "Exploring available demographic fields",
      "toolName": "get_demographic_segments",
      "summary": "Found 6 demographic segments: age, gender, location..."
    },
    {
      "iteration": 2,
      "action": "Fetching available values for: profession",
      "toolName": "get_demographic_values",
      "input": {"segments": ["profession"]},
      "summary": "Retrieved: profession (6 values)"
    },
    ...
  ],
  "session_transition": {...}
}
```

**Frontend Display** (`frontend/src/components/ChatMessage.tsx`):
- Capybara messages show "▶ Show Capybara's Thinking (N steps)" button
- On click, expands to show numbered steps with:
  - Iteration circle badge
  - Action description
  - Tool name (code-formatted)
  - Result summary
  - Collapsible input/output details

**Benefits:**
- ✅ Transparency — customers see how decisions are made
- ✅ Trust — demonstrates intelligent reasoning
- ✅ Debuggability — understand why personas were selected
- ✅ Non-intrusive — hidden by default, available on-demand

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
- Check backend logs for `[ORCHESTRATOR]`, `[TOOL]`, `[ROUTE]` prefixes
- Verify reasoning chain is captured in response (`capybara_reasoning` array)
- Query `chat_messages` table to verify persistence
- Run `GET /chat/history` to retrieve full conversation

**Expected log flow for "Find 3 engineers in their 30s":**
```
[ORCHESTRATOR] Iteration 1/10
[ORCHESTRATOR] Executing tool: get_demographic_segments
[TOOL] Available segments: ['age', 'gender', 'location', 'profession', 'spending_power', 'interests']

[ORCHESTRATOR] Iteration 2/10
[ORCHESTRATOR] Executing tool: get_demographic_values
[TOOL] profession values: ['engineer', 'student', 'dancer', ...]

[ORCHESTRATOR] Iteration 3/10
[ORCHESTRATOR] Executing tool: search_clones
[SEARCH_SQL] Query: ... WHERE profession = 'engineer' AND age >= 30 AND age <= 39 LIMIT 3
[TOOL] Found: 1 personas

[ORCHESTRATOR] Iteration 4/10
[ORCHESTRATOR] Executing tool: create_conversation_session
[TOOL] Session activated with 1 persona(s): EQ4C
[ORCHESTRATOR] Returning response with session_transition: true
```

### Common Tasks

**Modifying message routing:**
- Location: `backend/src/routes/chat.ts` lines 187-220
- Always check: target parameter first, then active_clones state
- Test: All three routing paths (capybara, clones, fallback)

**Adding a new tool for Capybara:**
1. Define function in `langgraph-orchestrator.ts` (pure logic, NO LLM calls)
2. Create tool definition with schema using `tool()` from @langchain/core/tools
3. Add to tools array in `llmWithTools = llm.bindTools([...])`
4. Handle execution in tool_calls loop with reasoning capture
5. Return plain data — let LLM interpret results

**Adjusting persona behavior:**
- Edit `interaction_history` (jsonb) in `personas` table to change persona data
- Edit `buildPersonaPrompt()` in `langgraph-orchestrator.ts` to change prompt template/instructions
- `callClone()` fetches `interaction_history` from database and constructs prompt dynamically via `buildPersonaPrompt()` (no caching)
- Changes take effect immediately on next message

**Testing the tool orchestration:**
- Use `DEV=true npm run dev --workspace=backend` for testing
- Test with `x-user-id: test_user` header
- Verify in logs that LLM calls tools in logical order
- Check `capybara_reasoning` in API response for reasoning steps
- Use `docs/E2E_TESTING.md` as reference for curl commands

**Reasoning display testing:**
- Request should include `capybara_reasoning` array in response
- Frontend shows "▶ Show Capybara's Thinking (N steps)" for Capybara messages
- Expand to see iteration numbers, tool names, and summaries
- Click "Show input" to see detailed filter parameters

---

## Authentication

The project uses **Supabase Auth** with **Google OAuth** for user authentication.

### Key Implementation Files

- `backend/src/middleware/auth.ts` - JWT verification middleware
- `backend/src/utils/jwt.ts` - JWT utility functions (verify, extract user ID)
- `backend/src/routes/auth.ts` - Auth endpoints (profile, callback handling)
- `frontend/src/services/auth.ts` - Auth SDK wrapper (sign-in, headers, user info)
- `supabase/config.toml` - Supabase configuration with Google OAuth
- `.env` - Secrets: `SUPABASE_JWT_SECRET`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`

### Important Patterns

**Backend:**
- All protected routes use `requireAuth` middleware which sets `req.userId`
- Additional `checkApproval` middleware ensures `app_users.approved = true`
- JWT verification uses Supabase public key (from `SUPABASE_JWT_SECRET`)
- Never trust claims without signature verification

**Frontend:**
- Use `await getAuthHeaders()` to get `Authorization: Bearer {token}` header
- Supabase SDK automatically manages session and token refresh
- Session stored in localStorage as `supabase.auth.token`
- No x-user-id headers (deprecated) - only JWT Authorization headers

**Database:**
- `auth.users` table managed by Supabase (user_id, email, metadata)
- `app_users` table for approval workflow (user_id, approved)
- First login creates `app_users` entry with `approved: false` (or `true` in DEV)

### Development Setup

```bash
# With development mode (auto-approves users)
DEV=true npm run dev --workspace=backend

# Or with frontend+backend
DEV=true npm run dev
```

Features:
- Auto-creates users in `app_users` table with `approved: true`
- Allows testing without manual approval
- Uses real database for persistence

### Testing Auth Flow

1. Start development servers: `DEV=true npm run dev`
2. Navigate to `http://localhost:3000/waitlist`
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Verify Authorization header in network requests (DevTools → Network)
6. Check localStorage for `supabase.auth.token`

**Testing protected endpoints:**
```bash
TOKEN=$(curl -s http://localhost:3001/auth/session | jq -r '.session.access_token')
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/chat/init
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid JWT" | Token expired | Supabase SDK auto-refreshes; re-authenticate if needed |
| "User not approved" (403) | `app_users.approved = false` | Enable `DEV=true` or admin approval |
| "Missing Authorization header" (401) | Frontend not including JWT | Verify `getAuthHeaders()` called before fetch |
| Google OAuth fails | Bad credentials or redirect URI | Check Google Cloud Console and `supabase/config.toml` |

### Adding Protected Endpoints

```typescript
// backend/src/routes/myroute.ts
app.post('/api/protected', requireAuth, checkApproval, (req, res) => {
  const userId = req.userId  // Available after requireAuth
  // Protected logic here
  res.json({ data: 'protected' })
})
```

Frontend usage:
```typescript
const headers = await getAuthHeaders()
const res = await fetch('/api/protected', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'example' })
})
```

---

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm run dev` to start development (or `DEV=true npm run dev --workspace=backend` for backend-only with dev mode)
3. Open `http://localhost:3000` to see the app
4. Follow `docs/E2E_TESTING.md` to test the full flow
