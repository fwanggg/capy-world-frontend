# End-to-End Testing Guide

This document explains how to test the Capybara AI system end-to-end using only the standard API endpoints (no debug endpoints).

## Prerequisites

```bash
# 1. Start backend in dev mode
npm run dev --workspace=backend

# 2. In another terminal, start frontend
npm run dev --workspace=frontend

# 3. Both should be running:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
```

**Environment:** DEV=true enables auto-user-creation and skips approval checks for testing.

---

## Standard API Endpoints

### 1. POST /chat/init - Initialize Session

```bash
curl -X POST http://localhost:3001/chat/init \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-001" \
  -d '{ "mode": "god" }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "mode": "god",
  "active_clones": [],
  "metadata": { "thread_id": "session_1234567890" },
  "created_at": "2026-03-07T12:00:00Z"
}
```

**Save the `id` - you'll need it for all subsequent messages.**

---

### 2. POST /chat/message - Send a Message

#### Route 1: Message to Capybara (Initial)

```bash
SESS_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3001/chat/message \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-001" \
  -d "{
    \"session_id\": \"$SESS_ID\",
    \"content\": \"I want to test my pitch on startup founders\"
  }"
```

**Expected Behavior:**
1. Message routes to Capybara AI (no active clones)
2. Capybara enters agentic loop
3. Capybara calls `search_clones(research_goal='startup founders')`
4. Capybara calls `create_conversation_session([11, 12, 13, 14, 15])`
5. Response includes `session_transition` with clone names

**Response (Partial):**
```json
{
  "user_message": { "id": "...", "role": "user", "content": "..." },
  "ai_responses": [
    {
      "role": "capybara",
      "sender_id": "capybara-ai",
      "content": "I've selected 5 startup founders for you. You can now chat with them directly..."
    }
  ],
  "session_transition": {
    "clone_ids": ["11", "12", "13", "14", "15"],
    "clone_names": ["dryisnotwet", "kvm8410", "indiestack", "According-Union-6143", "copybreakdowns"]
  }
}
```

**Backend Logs (Check Terminal):**
```
[ORCHESTRATOR] Iteration 1/5
[TOOL] search_clones returning: 10 clones
[ORCHESTRATOR] Iteration 2/5
[TOOL] create_conversation_session returning: success
[ORCHESTRATOR] Iteration 3/5
[ORCHESTRATOR] No tool calls, extracting final response
[ROUTE] Routing to Capybara AI
[CLONE] ✓✓✓ FETCHED CLONE 11 FROM agent_memory TABLE ✓✓✓
```

---

#### Route 2: Message to Clones (After Activation)

```bash
SESS_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3001/chat/message \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-001" \
  -d "{
    \"session_id\": \"$SESS_ID\",
    \"content\": \"Here's my elevator pitch: my SaaS automates repetitive tasks for solopreneurs\"
  }"
```

**Expected Behavior:**
1. Session has `active_clones: [11, 12, 13, 14, 15]`
2. Message routes to all active clones (no target parameter)
3. Each clone fetches their real system prompt from agent_memory
4. Each clone responds in parallel

**Response:**
```json
{
  "user_message": { "id": "...", "role": "user", "content": "..." },
  "ai_responses": [
    {
      "role": "clone",
      "sender_id": "User_11",
      "content": "That's interesting, but the real test is whether non-technical people can actually use it..."
    },
    {
      "role": "clone",
      "sender_id": "User_12",
      "content": "Automation is key. The focus should be on those 20 hours saved per week..."
    },
    {
      "role": "clone",
      "sender_id": "User_13",
      "content": "We built IndieStack specifically for this use case. Documentation is crucial..."
    }
    // ... more clone responses
  ]
}
```

**Backend Logs:**
```
[ROUTE] Decision: { target: undefined, session.mode: 'conversation', hasActiveClones: true }
[ROUTE] Routing to clones, active: ['11', '12', '13', '14', '15']
[CLONE] ✓✓✓ FETCHED CLONE 11 FROM agent_memory TABLE ✓✓✓
[CLONE] ✓ Clone username: dryisnotwet
[CLONE] ===== FULL SYSTEM PROMPT FROM DATABASE =====
You are a persona simulator...
[CLONE] ===== END SYSTEM PROMPT =====
[CLONES] All clones completed, returning 5 responses
```

---

#### Route 3: Synthesis with @capybara Mention

```bash
SESS_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3001/chat/message \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-001" \
  -d "{
    \"session_id\": \"$SESS_ID\",
    \"content\": \"@capybara what patterns do you see from their feedback?\",
    \"target\": \"capybara\"
  }"
```

**Expected Behavior:**
1. `target: "capybara"` overrides routing logic
2. Message routes to Capybara (even though clones are active)
3. Capybara has full conversation history from this session
4. Capybara synthesizes patterns from all previous messages and responses
5. Response marked with `role: "capybara"` (visually distinct)

**Response:**
```json
{
  "user_message": { "id": "...", "role": "user", "content": "@capybara what patterns..." },
  "ai_responses": [
    {
      "role": "capybara",
      "sender_id": "capybara-ai",
      "content": "The key patterns I'm seeing: 1) Everyone emphasizes user simplicity... 2) Automation ROI is critical (especially time savings)... 3) Documentation and indie tools resonate..."
    }
  ]
}
```

**Backend Logs:**
```
[ROUTE] Decision: { target: 'capybara', routeToCapybara: true }
[ROUTE] Routing to Capybara AI
[ORCHESTRATOR] Iteration 1/5
[ORCHESTRATOR] No tool calls, extracting final response
```

---

### 3. GET /chat/history - Retrieve Conversation

```bash
SESS_ID="550e8400-e29b-41d4-a716-446655440000"

curl http://localhost:3001/chat/history?session_id=$SESS_ID \
  -H "x-user-id: test-user-001"
```

**Response:**
```json
[
  {
    "id": "msg_1",
    "session_id": "...",
    "role": "user",
    "sender_id": "test-user-001",
    "content": "I want to test my pitch on startup founders",
    "created_at": "2026-03-07T12:00:01Z"
  },
  {
    "id": "msg_2",
    "session_id": "...",
    "role": "capybara",
    "sender_id": "capybara-ai",
    "content": "I've selected 5 startup founders...",
    "created_at": "2026-03-07T12:00:05Z"
  },
  {
    "id": "msg_3",
    "session_id": "...",
    "role": "user",
    "sender_id": "test-user-001",
    "content": "Here's my elevator pitch...",
    "created_at": "2026-03-07T12:00:10Z"
  },
  {
    "id": "msg_4",
    "session_id": "...",
    "role": "clone",
    "sender_id": "User_11",
    "content": "That's interesting, but the real test...",
    "created_at": "2026-03-07T12:00:12Z"
  }
  // ... more messages
]
```

---

## Complete E2E Test Flow

```bash
#!/bin/bash

# Step 1: Initialize session
echo "=== Initializing session ==="
INIT_RESPONSE=$(curl -s -X POST http://localhost:3001/chat/init \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-001" \
  -d '{ "mode": "god" }')

SESSION_ID=$(echo $INIT_RESPONSE | jq -r '.id')
echo "Session ID: $SESSION_ID"

# Step 2: Ask Capybara to search and activate clones
echo -e "\n=== Asking Capybara to find clones ==="
CAPYBARA_RESPONSE=$(curl -s -X POST http://localhost:3001/chat/message \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-001" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"content\": \"I want to test my SaaS pitch on startup founders\"
  }")

echo $CAPYBARA_RESPONSE | jq '.ai_responses[0].content'
echo "Clones activated:"
echo $CAPYBARA_RESPONSE | jq '.session_transition.clone_names'

# Step 3: Send message to clones
echo -e "\n=== Sending pitch to clones ==="
CLONE_RESPONSE=$(curl -s -X POST http://localhost:3001/chat/message \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-001" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"content\": \"Here's my pitch: My SaaS automates email follow-ups, saving 10 hours per week\"
  }")

echo "Clone responses:"
echo $CLONE_RESPONSE | jq '.ai_responses[] | {sender_id, content}'

# Step 4: Ask Capybara to synthesize
echo -e "\n=== Asking Capybara for synthesis ==="
SYNTHESIS_RESPONSE=$(curl -s -X POST http://localhost:3001/chat/message \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-001" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"content\": \"@capybara what are the main objections?\",
    \"target\": \"capybara\"
  }")

echo $SYNTHESIS_RESPONSE | jq '.ai_responses[0].content'

# Step 5: View full conversation history
echo -e "\n=== Full conversation history ==="
curl -s http://localhost:3001/chat/history?session_id=$SESSION_ID \
  -H "x-user-id: test-user-001" | jq '.[] | {role, sender_id, content}'
```

Save this as `test_e2e.sh` and run:
```bash
bash test_e2e.sh
```

---

## Testing Checklist

- [ ] Session initializes with empty active_clones
- [ ] First message routes to Capybara (logs show [ROUTE] Routing to Capybara AI)
- [ ] Capybara executes search_clones tool (logs show [TOOL] search_clones)
- [ ] Capybara executes create_conversation_session tool (logs show [TOOL] create_conversation_session)
- [ ] Response includes session_transition with clone names
- [ ] Second message routes to clones (logs show [ROUTE] Routing to clones)
- [ ] Multiple clones respond in parallel (5 responses in one request)
- [ ] Each clone's system prompt fetched from agent_memory (logs show [CLONE] FETCHED FROM agent_memory TABLE)
- [ ] Message with target="capybara" routes to Capybara (logs show [ROUTE] Routing to Capybara AI)
- [ ] Capybara synthesis includes context from previous messages
- [ ] History endpoint returns all messages in chronological order

---

## Troubleshooting

### Issue: "No active clones in session"
- Reason: Previous Capybara call didn't successfully call create_conversation_session tool
- Check: Backend logs for [TOOL] create_conversation_session error
- Fix: Session not updated, verify database query succeeded

### Issue: "Session not found"
- Reason: Session ID is wrong or session not persisted to database
- Check: POST /chat/init response contains valid UUID
- Fix: Confirm DEV=true is set, Supabase is running

### Issue: Clone responses all identical
- Reason: System prompt not being fetched from agent_memory
- Check: Backend logs for [CLONE] FETCHED FROM agent_memory TABLE
- Fix: Verify agent_memory table has system_prompt column populated

### Issue: Backend logs not showing
- Reason: Logs sent to stdout, not stderr
- Check: Running with `npm run dev` in foreground
- Fix: `tail -f /tmp/dev.log` if running in background

---

## Database Verification

```bash
# Check if messages were saved
psql YOUR_DATABASE << SQL
SELECT session_id, role, sender_id, content FROM chat_messages
ORDER BY created_at DESC LIMIT 20;
SQL

# Check session state
psql YOUR_DATABASE << SQL
SELECT id, user_id, mode, active_clones FROM chat_sessions
ORDER BY created_at DESC LIMIT 5;
SQL

# Verify clone data
psql YOUR_DATABASE << SQL
SELECT id, reddit_username, LENGTH(system_prompt) as prompt_size
FROM agent_memory LIMIT 5;
SQL
```

---

## Next Steps

- [ ] Run this test flow daily during development
- [ ] Add more realistic pitches and use cases
- [ ] Test with different research goals (not just founders)
- [ ] Verify @capybara synthesis quality
- [ ] Test error cases (invalid session, malformed requests)
