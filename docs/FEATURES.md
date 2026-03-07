# Capybara AI - Feature Requirements & Implementation

## Core Features (MVP)

### 1. God Mode (Default)
**Status:** ✅ IMPLEMENTED & TESTED

- User starts in God Mode when chat initializes
- Capybara AI is the only agent responding
- Capybara has access to two tools:
  - `search_clones()` - Find relevant digital clones from `agent_memory` table
  - `create_conversation_session()` - Activate N clones (default 5, configurable)
- Capybara asks clarifying questions to understand research goal before searching
- After clones activated, session switches to Conversation Mode

**Test Coverage:**
- ✅ Session initialized in god mode
- ✅ Capybara agentic loop with tool use works
- ✅ Clones correctly activated from database

---

### 2. Conversation Mode
**Status:** ✅ IMPLEMENTED & TESTED

- Activated when Capybara calls `create_conversation_session` tool
- Session.mode = 'conversation', session.active_clones = [list of IDs]
- All user messages route to active clones by default
- Each clone responds with their own perspective
- Clones fetch real system prompts from `agent_memory` table
- Each clone's response includes:
  - `role: "clone"`
  - `sender_id: "User_{clone_id}"`
  - `content: {clone's response}`

**Real System Prompt Sources:**
Each clone is a persona simulator that:
- Uses actual Reddit interaction history
- Generates responses in that user's communication style
- Maintains consistency with their documented perspectives

**Test Coverage:**
- ✅ 2 clones activated and responded
- ✅ Clone responses are distinct and personalized
- ✅ System prompts fetched from agent_memory table (logged)

---

### 3. Message Routing (@capybara mentions)
**Status:** ✅ IMPLEMENTED & TESTED

**Backend API:**
- POST /chat/message accepts optional `target` field
- `target: "capybara"` → Route to Capybara AI (agentic loop, can use tools)
- `target: "clones"` or undefined → Route to session.active_clones
- In god mode with no active clones: defaults to Capybara

**Frontend Implementation (TODO):**
- Parse `@capybara <message>` in chat input
- Strip @capybara prefix before sending
- Send with `target: "capybara"` in request body
- Show @mention hint in input field

**Routing Logic:**
```
if (target === 'capybara') → Capybara AI
else if (session.mode === 'conversation' && session.active_clones.length > 0) → Clones
else if (target === 'clones') → Clones (explicit)
else → Capybara AI (fallback)
```

**Test Coverage:**
- ✅ Explicit target=capybara routing works
- ✅ Capybara receives full conversation history as context
- ✅ Capybara can synthesize patterns from clone feedback

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

## Excluded Features (Out of Scope)

### ❌ Conversation Mode Toggle Button
- **Decision:** Removed from MVP
- **Reason:** Capybara activates clones automatically via tools
- **User Journey:** God Mode → Capybara finds clones → Clones activated → Conversation begins

### ❌ Clone Selection UI
- **Decision:** Capybara selects clones intelligently via search_clones tool
- **Reason:** LLM better at understanding research goals than dropdown menus

### ❌ Manual Mode Switching
- **Decision:** Mode switches automatically via create_conversation_session tool
- **Reason:** Simplified UX - no manual state management needed

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
  "metadata": { "thread_id": "uuid" },
  "created_at": "2026-03-07T..."
}
```

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
- [x] Session initialization in god mode
- [x] Capybara tool use (search_clones)
- [x] Clone activation (create_conversation_session)
- [x] Routing to active clones
- [x] Routing to Capybara with target parameter
- [x] Real system prompt fetching from agent_memory
- [x] Message persistence in chat_messages
- [x] History endpoint
- [x] 2+ clones responding in parallel

### Frontend (TODO)
- [ ] @capybara mention parsing
- [ ] Message routing with target parameter
- [ ] Loading states during tool execution
- [ ] Error handling for failed responses
- [ ] Message history UI
- [ ] Real-time clone response display

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
