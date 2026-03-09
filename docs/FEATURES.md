# Capybara AI - Feature Requirements & Implementation

## Core Concept

**Single Unified Session** with intelligent message routing:
- User initiates one session (not switching between modes)
- Capybara AI starts as the default receiver
- User can activate digital clones via Capybara's tools
- Message routing determined by `target` parameter + `active_clones` state
- User can synthesize insights via @capybara mentions at any time

---

## Core Features (MVP)

### 1. Capybara AI Orchestration
**Status:** ✅ IMPLEMENTED & TESTED

**Capybara's Capabilities:**
- Agentic loop with tool binding (max 5 iterations)
- Tool access:
  - `search_clones()` - Find relevant digital clones from `agent_memory` table
  - `create_conversation_session()` - Activate N clones (default 5, configurable)
- Asks clarifying questions to understand research goal before searching
- Auto-activates clones when user requests feedback/testing/pitches

**When Capybara Responds:**
- Initially: All messages route to Capybara (no active clones)
- With clones active: Use `target: "capybara"` or @capybara mention to reach Capybara
- Capybara always has full conversation history for context

**Real System Prompt Sources:**
Each clone is a persona simulator that:
- Uses actual Reddit interaction history
- Generates responses in that user's communication style
- Maintains consistency with their documented perspectives

**Test Coverage:**
- ✅ Agentic loop with tool use works correctly
- ✅ Tools execute in sequence and update session state
- ✅ Capybara receives conversation history
- ✅ Session transition tracking works

---

### 2. Digital Clones (When Activated)
**Status:** ✅ IMPLEMENTED & TESTED

**What Happens:**
- Capybara calls `create_conversation_session([clone_ids])` tool
- Session updates: `active_clones = [11, 12, 13, 14, 15]`
- Frontend receives `session_transition` event showing clone names
- User can now message clones directly

**Clone Responses:**
- Each clone fetches real system prompt from `agent_memory` table
- Clones execute in parallel (concurrent responses)
- Each response includes:
  - `role: "clone"`
  - `sender_id: "User_{clone_id}"`
  - `content: {clone's authentic response}`
- Clone personalities remain consistent throughout conversation

**Test Coverage:**
- ✅ Multiple clones activated and responded correctly
- ✅ Clone responses are distinct and personalized
- ✅ System prompts fetched from agent_memory table (logged)
- ✅ Parallel clone execution verified

---

### 3. Message Routing (Smart Destination Selection)
**Status:** ✅ IMPLEMENTED & TESTED

**Routing Rules:**
```
if (target === 'capybara')
  → Capybara AI (agentic loop, tool access, synthesis)
else if (session.active_clones.length > 0)
  → All active clones (group conversation)
else
  → Capybara AI (default when no clones active)
```

**Target Parameter in Request:**
- `target: "capybara"` - Explicitly route to Capybara for synthesis/orchestration
- Omit target or `target: "clones"` - Route to active clones (if any exist)

**Frontend Implementation (✅ DONE):**
- Parse `@capybara <message>` in chat input (ChatInput.tsx)
- Strip @capybara prefix before sending
- Send with `target: "capybara"` in request body
- Show @mention hint in input placeholder

**Synthesis Workflow:**
1. Clones respond to user message with their perspectives
2. User: "@capybara what patterns do you see?"
3. Frontend sends `target: "capybara"`
4. Capybara receives full conversation history
5. Capybara synthesizes patterns/insights from clone feedback

**Test Coverage:**
- ✅ Explicit target=capybara routing works
- ✅ Capybara synthesis from conversation history works
- ✅ @capybara parsing and routing verified
- ✅ Clone responses appear before synthesis

---

### 4. Persistence & Data Management
**Status:** ✅ IMPLEMENTED & TESTED

**Database Schema:**
- `chat_sessions` - Session state (id, user_id, mode, active_clones, metadata)
- `chat_messages` - Conversation history (session_id, role, sender_id, content)
- `agent_memory` - Clone definitions (id, reddit_username, system_prompt, ...)

**Persistence:**
- All messages saved to chat_messages table
- Session state (active_clones, mode) persists in chat_sessions
- History endpoint: GET /chat/history?session_id={id}
- Frontend can reconstruct conversation from database

**Test Coverage:**
- ✅ Messages saved to database
- ✅ Session state persisted
- ✅ History endpoint retrieves conversation

---

## Design Decisions (Not Included)

### ❌ Manual Clone Selection UI
- **Decision:** Capybara selects clones intelligently via search_clones tool
- **Reason:** LLM better at understanding research goals than dropdown menus
- **UX:** "Test my pitch on startup founders" → Capybara automatically finds relevant clones

### ❌ Explicit Mode Toggle
- **Decision:** No mode switching UI needed (single session)
- **Reason:** Routing determined by message state, not explicit mode selection
- **UX:** Seamless - send message → route determined automatically based on active_clones

---

## Technical Implementation

### Real System Prompts
Each clone in agent_memory contains:
- `id` - Unique identifier (11-20+ currently)
- `reddit_username` - Display name (e.g., "dryisnotwet", "indiestack")
- `system_prompt` - Full persona definition with Reddit interaction history
  - Instruction to simulate user's communication style
  - JSON of user's posts, comments, references
  - Context about subreddit, scores, timestamps
  - Allows LLM to generate authentic responses

**Example Clone Personality:**
User 11 (dryisnotwet) - Technical founder, infrastructure-focused
- Posts about OpenClaw, DevOps automation
- Skeptical of overly complex solutions
- Values pragmatic, working implementations

System prompt format:
```
You are a persona simulator. Your task is to generate ONE response that 
imitates how a specific User would reply to a given prompt.

CONTEXT: User's Interaction History:
{
  "posts": [...],
  "comments": [...],
  "references": [...]
}
```

### Agentic Loop (Capybara AI)
1. Receive user message with system prompt
2. Bind tools: search_clones, create_conversation_session
3. Loop (max 5 iterations):
   - Invoke LLM with bound tools
   - Check if response contains tool_calls
   - If yes: Execute tools, append ToolMessage, continue loop
   - If no: Extract final response, exit loop
4. Return response + optional session_transition

---

## API Contracts

### POST /chat/init
**Request:**
```json
{ "mode": "god" }
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "mode": "god",
  "active_clones": [],
  "metadata": { "thread_id": "session_1234567890" },
  "created_at": "2026-03-07T..."
}
```

**Notes:**
- `active_clones: []` initially (no clones activated yet)
- Mode starts as "god" but changes to "conversation" when clones are activated via tool
- Session ID is a proper UUID, persists throughout conversation

### POST /chat/message
**Request:**
```json
{
  "session_id": "uuid",
  "content": "user message",
  "target": "capybara" | "clones" | null
}
```

**Response:**
```json
{
  "user_message": { ... },
  "ai_responses": [
    {
      "role": "capybara" | "clone",
      "sender_id": "capybara-ai" | "User_11",
      "content": "..."
    }
  ],
  "session_transition": {
    "clone_ids": [11, 12, ...],
    "clone_names": ["dryisnotwet", "kvm8410", ...]
  }
}
```

### GET /chat/history
**Query:** `session_id={uuid}`

**Response:**
```json
[
  {
    "id": "uuid",
    "session_id": "uuid",
    "role": "user" | "capybara" | "clone",
    "sender_id": "...",
    "content": "...",
    "created_at": "2026-03-07T..."
  }
]
```

---

## Testing Checklist

### Backend (✅ All Passing)
- [x] Session initialization with UUID
- [x] Capybara agentic loop with tool binding (max 5 iterations)
- [x] search_clones tool execution and results
- [x] create_conversation_session tool updates session state
- [x] Message routing based on target parameter
- [x] Message routing based on active_clones state
- [x] Real system prompt fetching from agent_memory table
- [x] All messages persisted to chat_messages table
- [x] Session state persisted to chat_sessions table
- [x] History endpoint retrieves full conversation
- [x] Multiple clones responding in parallel (2+ concurrent)
- [x] Development mode (DEV=true) auto-creates users
- [x] Error handling and edge cases

### Frontend (✅ Implemented)
- [x] @capybara mention parsing in ChatInput
- [x] Message routing with target parameter in requests
- [x] Visual distinction for Capybara responses (teal styling)
- [x] Loading states during tool execution

### Frontend (TODO - Enhancement)
- [ ] Real-time clone response streaming
- [ ] Message history UI view
- [ ] Clone personality display cards
- [ ] Error toast notifications

---

## Development Mode
- DEV=true enables auto-user-creation
- No approval check required
- All features tested end-to-end
- Real database persistence

## Production Mode
- Auth required (x-user-id header)
- Approval check enforced
- Google OAuth integration
- Full access control
