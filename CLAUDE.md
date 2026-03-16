# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Capybara AI** is a full-stack Next.js application that allows users to interview AI personas representing real Reddit users. It combines:
- **Frontend**: React 19 + TypeScript (pages in `src/app/`)
- **Backend**: Next.js API routes (handlers in `src/app/api/`)
- **Services**: Business logic in `src/lib/` (LangGraph orchestration, authentication, logging, Supabase client)
- **Database**: Supabase PostgreSQL with auth, personas, chat sessions, studyrooms, etc.

Everything runs as a **single Next.js application** on one port (default 3000).

## Recent Major Updates

✅ **Observability System Complete** — Production-ready logging with `app_log` table, 30+ events covering auth, chat, and orchestration layers. See **Observability & Logging** section.

✅ **Personas Table Architecture** — Smart demographic search with conversational memory. Capybara accesses interaction_history for context-aware responses. See **Capybara AI Feature** section.

✅ **Auth Flow Stabilized** — Fixed regression with hybrid event listener + fallback pattern. See **Auth Regression Fix & Lessons** in Authentication section.

✅ **Authentication Clarified** — No custom users table; all auth managed by Supabase Auth exclusively. Updated documentation for clarity.

## Architecture

### Project Structure

```
src/
├── app/
│   ├── api/                 # Next.js API routes (request handlers)
│   │   ├── chat/           # Chat endpoints
│   │   ├── clones/         # Clone management
│   │   ├── studyrooms/     # Studyroom CRUD
│   │   ├── user/           # User profile
│   │   ├── auth/           # Authentication
│   │   └── waitlist/       # Waitlist signup
│   ├── (pages)             # Server/client pages (chat, waitlist, about, etc.)
│   └── layout.tsx          # Root layout
├── components/             # React components (UI, chat, sidebar, etc.)
├── lib/                    # Business logic & services
│   ├── auth.ts            # Auth utilities
│   ├── jwt.ts             # JWT verification
│   ├── langgraph-orchestrator.ts  # Agentic loop & persona execution
│   ├── logging.ts         # App logging service
│   ├── supabase.ts        # Supabase client
│   └── llm.ts             # LLM setup
├── hooks/                  # React hooks
├── types/                  # TypeScript types
└── utils/                  # Utility functions
```

### Frontend (React Pages & Components)

- **Pages** in `src/app/` — Next.js App Router pages (Chat, Waitlist, About, etc.)
- **Components** in `src/components/` — Reusable React components (ChatMessage, ChatInput, Sidebar, etc.)
- **Hooks** in `src/hooks/` — Custom React hooks for state management
- **Styling** — Tailwind CSS (configured in `tailwind.config.ts`)

### Backend (API Routes)

All API endpoints are in `src/app/api/`:
- **POST `/api/chat/init`** — Initialize chat session
- **POST `/api/chat/message`** — Send message (routes to Capybara or clones)
- **GET `/api/chat/history`** — Retrieve conversation history
- **GET `/api/studyrooms`** — List user's studyrooms
- **POST `/api/studyrooms`** — Create studyroom
- **DELETE `/api/studyrooms/[id]`** — Delete studyroom
- **GET `/api/clones/search`** — Search personas by demographics
- **GET `/api/clones/list`** — List active clones in session
- **POST `/api/user/profile`** — Get user profile
- **POST `/api/waitlist/join`** — Join waitlist

### Services (Business Logic)

Located in `src/lib/`:
- **`langgraph-orchestrator.ts`** — Agentic loop, tool execution, persona responses
- **`auth.ts`** — Auth utilities and middleware
- **`jwt.ts`** — JWT verification and claims extraction
- **`logging.ts`** — App logging service with database writes
- **`supabase.ts`** — Supabase client initialization and helpers
- **`llm.ts`** — Claude API client setup

## Development Commands

**Start development server:**
```bash
npm run dev
```
Runs Next.js dev server on `http://localhost:3000`. Hot reload enabled.

**Build for production:**
```bash
npm run build
```
Creates optimized build in `.next/`.

**Start production server:**
```bash
npm run start
```
Runs built app (requires `npm run build` first).

**Lint:**
```bash
npm run lint
```

## Development Setup

Auth works the same in development and production. Use Google OAuth to sign in; no shortcuts.

```bash
npm run dev
```

**Environment variables** (in root `.env`):
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_JWT_SECRET` — JWT secret for verification
- `OPENAI_API_KEY` — Claude API key (note: uses Anthropic not OpenAI)

## Common Workflows

### Adding a New API Endpoint

1. Create route handler: `src/app/api/[domain]/[endpoint]/route.ts`
2. Implement `POST`, `GET`, or `DELETE` function
3. Use auth middleware (`requireAuth`, `checkApproval`) if protected
4. Use Supabase client from `lib/supabase.ts` for database access
5. Return JSON response

Example:
```typescript
// src/app/api/example/route.ts
import { requireAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const userId = await requireAuth(req)

  const { data, error } = await supabase
    .from('some_table')
    .select()
    .eq('user_id', userId)

  if (error) throw error
  return Response.json(data)
}
```

### Adding Frontend Components

1. Create in `src/components/` directory
2. Keep components focused and single-purpose
3. Use React hooks for state management
4. Naming: PascalCase (e.g., `ChatMessage.tsx`)
5. Import and use in pages or other components

### Adding a New Page

1. Create directory in `src/app/` (e.g., `src/app/mypage/`)
2. Add `page.tsx` file
3. Implement as client or server component
4. Next.js automatically creates route `/mypage`

### Modifying Persona Behavior

- **Data**: Edit `interaction_history` JSONB in `personas` table
- **Prompt**: Edit `buildPersonaPrompt()` in `langgraph-orchestrator.ts`
- **Result**: Changes take effect immediately on next message (no caching)

### Adding a New Tool for Capybara

1. Define function in `langgraph-orchestrator.ts` (pure logic, NO LLM calls)
2. Create tool definition with schema using `tool()` from @langchain/core/tools
3. Add to tools array in `llmWithTools = llm.bindTools([...])`
4. Handle execution in tool_calls loop with reasoning capture
5. Return plain data — let LLM interpret results

## File Organization Principles

- **One responsibility per file** — split files larger than ~300 lines
- **Domain-based structure** — organize by feature, not by type
- **Avoid duplication** — check if similar functionality exists before creating new files
- **Keep it modular** — each file should be independently understandable
- **API routes** — keep route handlers thin; move logic to `src/lib/`
- **Components** — keep UI components small; extract state logic to hooks or services

## TypeScript Configuration

- `tsconfig.json` — Strict mode enabled (`compilerOptions.strict: true`)
- Target: ES2020
- Path aliases: `@/*` points to `src/*` for clean imports

## Debugging

**Frontend debugging:**
- Open DevTools in browser (http://localhost:3000)
- Network tab shows requests to `/api/*` endpoints
- Console shows React errors and logs
- React DevTools extension helpful for component inspection

**Backend debugging:**
- Terminal shows Next.js server logs
- Add `console.log()` statements in route handlers or services
- Check `app_log` table for structured logging of important events
- Use `node --inspect` flag for debugger breakpoints

## Important Patterns

### API Integration

- Frontend fetches from `/api/...` (same origin)
- Backend returns JSON responses via `Response.json()`
- Always handle errors on both sides

### State Management

- React hooks (`useState`, `useEffect`) for component state
- Custom hooks in `src/hooks/` for shared logic
- No global state library currently (add if state grows complex)

### Authentication

- All protected routes use `requireAuth` middleware (sets `userId`)
- Use `checkApproval` middleware for approval workflow enforcement
- JWT verified server-side using Supabase public key

### Database Access

- Use Supabase client from `lib/supabase.ts`
- Always verify user has permission to access data
- Handle errors gracefully (don't expose internal details)

## When Modifying Existing Code

1. Understand the current structure before changing
2. Check if your change breaks anything (test common flows)
3. Keep the architecture clean — refactor bloated files while making changes
4. Update relevant docs if architecture changes
5. Verify auth/permissions for any data access changes

---

## Observability & Logging

**Complete logging infrastructure for production visibility:**

**App Log Table (`app_log`):**
- Columns: `id`, `timestamp`, `level`, `environment`, `event`, `message`, `user_id`, `request_id`, `source_file`, `source_line`, `metadata` (JSONB), `duration_ms`
- Indexed on: timestamp, level, environment, event, user_id, request_id, and composite index for performance
- No FK constraint on `user_id` (Supabase manages auth.users separately)

**Logging Service (`src/lib/logging.ts`):**
```typescript
import { log } from '@/lib/logging'
log.info('event_name', 'Message', { metadata })
log.warn('event_name', 'Message', { metadata })
log.error('event_name', 'Message', { metadata })
```
- Async non-blocking writes to database
- Automatic console logging for dev visibility
- Error-resilient (logs to console if DB write fails)
- Environment auto-detection from `NODE_ENV` or `DEV` flag

**Coverage (30+ events):**
- **Auth events (10):** dev_mode, header_check, header_missing, token_verify, token_invalid, success, extraction_failed, etc.
- **Approval events (7):** localhost_skip, check_start, user_not_found, not_approved, check_failed, success, no_user_id
- **Chat events (7):** session_init, init_failed, message_invalid_input, route_decision, route_capybara, route_clones, route_clones_failed
- **Orchestration events (6):** capybara_start, tool_execution_failed, clone_fetched, clone_fetch_failed, clones_start, clone_complete

**Usage:** Events are automatically logged at critical junctures. No configuration needed — just run the app.

---

## Capybara AI Feature: Agentic Tool System

### Recent Architecture Updates (Latest Session)

✅ **Eight Tools** — Full clone lifecycle: `get_demographic_segments`, `get_demographic_values`, `search_clones`, `create_conversation_session`, `recruit_clones`, `release_clones`, `list_clones`, `send_message`

✅ **Personas Table** — Uses `personas` table with demographics. `callClone()` fetches `interaction_history`, builds prompt via `buildPersonaPrompt()` (redacts author/username for privacy).

✅ **anonymous_id Privacy** — Reddit usernames never exposed. All user-facing identifiers use `anonymous_id` (hash of reddit_username). See `docs/PERSONA_PRIVACY.md`.

✅ **Studyrooms** — Each studyroom owns one chat_session. Sidebar for switching rooms. Cascade delete on studyroom delete.

✅ **SSE Streaming** — Capybara responses stream reasoning steps via SSE when `stream: true`. Frontend shows live "responding" bubbles (Capybara + clones).

✅ **Reasoning Chain** — Every Capybara response includes reasoning; frontend expand/collapse. Max 15 iterations.

✅ **search_clones** — Uses `ilike` for location (wildcards), profession/gender/spending_power (case-insensitive). Orders by confidence when filters applied.

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
User → POST /api/chat/message
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

**API Routes:**
- `src/app/api/chat/init/route.ts` - Session initialization
- `src/app/api/chat/message/route.ts` - Message routing logic, session management
- `src/app/api/studyrooms/route.ts` - Studyroom management
- `src/app/api/clones/search/route.ts` - Clone search

**Services:**
- `src/lib/langgraph-orchestrator.ts` - Agentic loop, clone execution, tool binding
- `src/lib/auth.ts` - Authentication middleware
- `src/lib/logging.ts` - Structured logging

**Frontend:**
- `src/app/chat/page.tsx` - Studyroom-based chat page
- `src/components/UnifiedChat.tsx` - Main chat UI, streaming, session_transition handling
- `src/components/StudyroomSidebar.tsx` - Studyroom list, create/delete/switch
- `src/components/ChatInput.tsx` - @capybara mention parsing, recipient dropdown
- `src/components/ChatMessage.tsx` - Message rendering, ThinkingSteps for Capybara
- `src/components/RespondingBubble.tsx` - Live "responding" indicator
- `src/components/ParticipantSidebar.tsx` - You, Capybara, active clones (anonymous_id)

**Database Tables:**

**personas** — Digital personas with demographics and instructions
- `id` — Unique identifier
- `reddit_username` — Person's handle (internal only; never exposed to frontend or LLM)
- `anonymous_id` — Opaque display identifier (hash of reddit_username). Use this everywhere user-facing. Formula: `left(md5(reddit_username), 8)`. **Future inserts must set anonymous_id** using this formula.
- `age` — Age in years (for age range filtering)
- `gender` — "male", "female", or null
- `location` — City/region (e.g., "Seattle, USA")
- `profession` — Job/role (e.g., "engineer", "student", "dancer")
- `spending_power` — "high", "mid", "low", or null
- `interests` — Array of interests (e.g., ["technology", "startups"])
- `interaction_history` — JSONB of the persona's Reddit interaction data (posts, comments, references). Used by `buildPersonaPrompt()` to construct the system prompt. Author/username fields are redacted before sending to LLM.
- `prompt` — Legacy full system prompt (retained for reference; no longer read by `callClone()`)

**persona_embeddings** — Vector embeddings of interaction_history chunks for semantic search. Populated by `embed-personas` Edge Function (invoke from Supabase Dashboard). See `docs/TEST_SEMANTIC_SEARCH_SUPABASE.md`.
- `created_at`, `updated_at` — Timestamps

**chat_sessions** — Session state for each conversation
- `id` — Session UUID
- `user_id` — User's auth UUID
- `active_clones` — Array of persona IDs currently active (e.g., [17, 24])
- `metadata` — Additional context (JSON)
- `created_at`, `updated_at` — Timestamps

**studyrooms** — User's research rooms (each owns one chat_session)
- `id` — Studyroom UUID
- `user_id` — User's auth UUID
- `name` — Room name
- `session_id` — FK to chat_sessions (created on first message or init)
- Cascade delete: deleting studyroom deletes checkpoint data and chat_session

**chat_messages** — Conversation history
- `id` — Message UUID
- `session_id` — Session UUID (foreign key)
- `role` — "user", "capybara", or "clone"
- `sender_id` — User UUID or "capybara-ai" or persona ID
- `content` — Message text
- `created_at` — Timestamp

**waitlist** — Approval workflow (used by checkApproval middleware)
- `user_id` — User UUID (foreign key to auth.users)
- `approval_status` — 'approved' | 'pending' (must be 'approved' to access app)
- `created_at`, `updated_at` — Timestamps

### Eight-Tool Architecture

Capybara uses **eight tools** with **no LLM calls inside them**. The LLM orchestrates tool usage in the agentic loop:

**Tools 1–4:** `get_demographic_segments`, `get_demographic_values`, `search_clones`, `create_conversation_session` (same as before)

**Tool 5: `recruit_clones({demographic_filters?, count?, session_id})`** — Add personas without removing existing. Deduplicates.

**Tool 6: `release_clones({clone_ids?, release_all?, session_id})`** — Remove specific or all personas from session.

**Tool 7: `list_clones({session_id})`** — List active personas with demographics (returns `anonymous_id`, not reddit_username).

**Tool 8: `send_message({prompt, clone_ids})`** — Send a question to specific personas, collect responses (e.g. pitch testing, surveys).

**search_clones** — Two paths: (1) Semantic: when `query` provided, calls embed Edge Function → `search_personas_semantic` RPC (one SQL: embedding + demographics). LLM translates user intent to keywords. (2) Demographic-only: `ilike` for location/profession/gender/spending_power, interests filter. Orders by confidence when filters applied.

**session_transition** — `clone_names` are `anonymous_id` values (never reddit_username).

### Agentic Loop (Capybara AI)

Located in `src/lib/langgraph-orchestrator.ts:callCapybaraAI()`

```typescript
1. Bind all eight tools to LLM
2. Loop (max 15 iterations):
   a. Invoke LLM with messages and tools
   b. Check response.tool_calls
   c. If tool_calls:
      - Execute each tool (1-8)
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

**Backend Capture** (`src/lib/langgraph-orchestrator.ts`):
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

**API Response** (`src/app/api/chat/message/route.ts`):
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

**Frontend Display** (`src/components/ChatMessage.tsx`):
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

**Backend (`src/app/api/chat/message/route.ts` POST /api/chat/message):**

```typescript
// Default: route to Capybara. Only route to clones when target=clones or target_clones specified
const routeToCapybara = !(target === 'clones' || (target_clones && target_clones.length > 0))

if (routeToCapybara) {
  callCapybaraAI(session_id, content, messageHistory)
} else {
  callMultipleClones(target_clones || session.active_clones, session_id, content)
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

**Each Clone (`src/lib/langgraph-orchestrator.ts:callClone`):**

1. Fetch from `personas` table: `interaction_history`, `anonymous_id`
2. Redact author/username fields from `interaction_history` (privacy)
3. Build system prompt via `buildPersonaPrompt(interaction_history)`
4. Invoke LLM
5. Return response

**Multiple Clones (callMultipleClones):** Execute in parallel via Promise.all. Return `{ clone_id, content }`.

### Persona Prompts

`buildPersonaPrompt()` in langgraph-orchestrator.ts constructs the system prompt from a template + redacted `interaction_history`. The `interaction_history` JSONB (posts, comments, linked_content) is stripped of author/username fields before being sent to the LLM to prevent privacy leakage.

### UUID Mapping

**Why needed:** Supabase foreign keys require proper UUID format

Session ID: generateUUID() → random UUID v4. User ID comes from JWT (Supabase auth.users.id).

### API Contracts

**POST /api/chat/init**
- Request: `{ studyroom_id?: string }` — If `studyroom_id` provided, reuse that studyroom's session
- Response: Session with `active_clones: []`, UUID id

**POST /api/chat/message**
- Request: `{ session_id, content, target?: "capybara" | "clones", target_clones?: string[], stream?: boolean }`
- Response: `{ user_message, ai_responses[], session_transition?, capybara_reasoning? }`
- `session_transition`: `{ clone_ids, clone_names }` — clone_names are `anonymous_id` values
- When `stream: true`, response is SSE; final event is `{ type: "done", ... }` with full payload

**GET /api/studyrooms** — List user's studyrooms. **POST /api/studyrooms** — Create. **DELETE /api/studyrooms/[id]** — Delete (cascade).

**GET /api/chat/history**
- Query: `session_id={uuid}`
- Response: Array of all messages in chronological order

### Testing

**See:** `docs/E2E_TESTING.md` for complete testing guide with curl examples and bash scripts.

**Quick test flow:**
1. `POST /api/chat/init` → get session_id
2. `POST /api/chat/message` "test my pitch on startup founders" → Capybara activates clones
3. Look for `session_transition` in response
4. `POST /api/chat/message` "here's my pitch..." → clones respond
5. `POST /api/chat/message` "@capybara what patterns?" with `target: "capybara"` → synthesis

**Verification:**
- Check server logs for `[ORCHESTRATOR]`, `[TOOL]`, `[ROUTE]` prefixes
- Verify reasoning chain is captured in response (`capybara_reasoning` array)
- Query `chat_messages` table to verify persistence
- Run `GET /api/chat/history` to retrieve full conversation

**Expected log flow for "Find 3 engineers in their 30s":**
```
[ORCHESTRATOR] Iteration 1/15
[ORCHESTRATOR] Executing tool: get_demographic_segments
[TOOL] Available segments: ['age', 'gender', 'location', 'profession', 'spending_power', 'interests']

[ORCHESTRATOR] Iteration 2/15
[ORCHESTRATOR] Executing tool: get_demographic_values
[TOOL] profession values: ['engineer', 'student', 'dancer', ...]

[ORCHESTRATOR] Iteration 3/15
[ORCHESTRATOR] Executing tool: search_clones
[TOOL] Found: 1 personas (ilike filters for profession, age range)

[ORCHESTRATOR] Iteration 4/15
[ORCHESTRATOR] Executing tool: create_conversation_session
[TOOL] Session activated with 1 persona(s)
[ORCHESTRATOR] Returning response with session_transition: true
```

### Common Tasks

**Modifying message routing:**
- Location: `src/app/api/chat/message/route.ts`
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
- Sign in with Google OAuth to get JWT
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

### Architecture Overview

⚠️ **Important:** No `app_users` table exists. All users are managed exclusively by **Supabase Auth** in the `auth.users` table (Supabase-managed schema, not in our app schema). The `user_id` field in our code and logs refers to Supabase's `auth.users.id`, not a custom users table.

**User flow:**
1. User signs in with Google OAuth
2. Supabase Auth creates entry in `auth.users` (id, email, metadata)
3. Backend verifies JWT token and extracts `user_id` (Supabase's ID)
4. Approval check: lookup `user_id` in our `waitlist` table (FK to auth.users, no constraint needed since auth.users is in separate schema)
5. User gains access to protected routes

### Key Implementation Files

- `src/lib/auth.ts` - Auth utilities and middleware
- `src/lib/jwt.ts` - JWT verification and claims extraction
- `src/app/api/user/profile/route.ts` - User profile endpoint
- `src/components/AuthCallback.tsx` - OAuth callback handler with retry logic (see Auth Regression Fix)
- `src/components/ProtectedRoute.tsx` - Route protection with event listener + fallback
- `src/app/auth/page.tsx` - Auth page with Google sign-in button
- `.env` - Secrets: `SUPABASE_JWT_SECRET`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`

### Important Patterns

**Backend:**
- All protected routes use `requireAuth` middleware which sets `userId` in request
- Additional `checkApproval` middleware ensures `waitlist.approval_status === 'approved'`
- JWT verification uses Supabase public key (from `SUPABASE_JWT_SECRET`)
- Never trust claims without signature verification

**Frontend:**
- Use `await getAuthHeaders()` to get `Authorization: Bearer {token}` header
- Supabase SDK automatically manages session and token refresh
- Session stored in localStorage as `supabase.auth.token`
- Use JWT Authorization headers only

**Database:**
- `auth.users` table managed by Supabase (user_id, email, metadata) — NOT in our app schema
- `waitlist` table for approval workflow (user_id, approval_status). `checkApproval` middleware enforces `approval_status === 'approved'`.

### Auth Regression Fix & Lessons

**The Bug (Commit 84ca834):**
After Google OAuth login, users weren't redirected to `/chat` — they stayed on waitlist or got stuck.

**Root Cause:**
Race condition in event-based auth. Old approach (simple `isLoggedIn()` check on mount) worked reliably. New approach (event listener for `onAuthStateChange`) missed events fired before listener attached. Problem: Supabase parses OAuth fragment → fires event → but listener attaches too late.

**The Fix:**
1. **AuthCallback.tsx:** Retry loop instead of single wait. Keeps trying to get session up to 10 times (200ms each = 2 seconds total).
2. **ProtectedRoute.tsx:** Hybrid approach — both event listener (waits up to 3 seconds for auth ready event) AND fallback direct `getSession()` check. Handles both fast and slow auth initialization paths.

**Lesson:** Event-based auth can miss events if listener attaches after event fires. Mixing event listeners with fallback direct checks is more robust. Always verify complete auth flow in E2E testing, not just backend features.

### Development Setup

```bash
npm run dev
```

Auth works the same as production. Sign in with Google OAuth.

### Testing Auth Flow

1. Start development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Sign in with Google on `/waitlist`
4. Verify you're redirected to `/chat` with active session (after admin approves in waitlist)
5. Verify requests include `Authorization: Bearer {token}` header (DevTools → Network)
6. Check localStorage for `supabase.auth.token`

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid JWT" | Token expired | Supabase SDK auto-refreshes; re-authenticate if needed |
| "User not approved" (403) | `waitlist.approval_status !== 'approved'` | Admin must set approval_status in waitlist table |
| "Missing Authorization header" (401) | Frontend not including JWT | Verify `getAuthHeaders()` called before fetch |
| Google OAuth fails | Bad credentials or redirect URI | Check Google Cloud Console and Supabase auth settings |

### Adding Protected Endpoints

```typescript
// src/app/api/protected/route.ts
import { requireAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const userId = await requireAuth(req)

  // Check approval
  const { data: approval } = await supabase
    .from('waitlist')
    .select('approval_status')
    .eq('user_id', userId)
    .single()

  if (approval?.approval_status !== 'approved') {
    return Response.json({ error: 'Not approved' }, { status: 403 })
  }

  // Protected logic here
  return Response.json({ data: 'protected' })
}
```

---

## Environment

- **Single root `.env`** — All environment variables in one file at project root
- **Variables loaded** automatically by Next.js
- **Frontend access** — Only variables prefixed `NEXT_PUBLIC_` are accessible in browser

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Database
# (Migrations managed separately; not in repo)
```

## Next Steps

1. Run `npm install` to install dependencies
2. Configure `.env` with Supabase credentials and API keys
3. Run `npm run dev` to start development server
4. Navigate to `http://localhost:3000`
5. Follow `docs/E2E_TESTING.md` to test the full flow
