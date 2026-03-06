# Copybar MVP Design Document

**Date:** 2026-03-06
**Product:** Copybar — AI-powered instant user research
**Status:** Design Approved

---

## Executive Summary

Copybar is a platform for early-stage founders and marketers to test sales pitches, marketing statements, and product concepts against AI-simulated user personas. Unlike aggregated research tools, Copybar provides instant, actionable user-level insights by leveraging digital clones (AI agents) trained on real user personas crawled from the internet.

**Core value proposition:**
- **Speed:** Minutes instead of weeks
- **Depth:** Individual user perspectives with implicit signal understanding
- **Actionability:** Catches nuances that aggregated summaries miss
- **AI-native:** Fully powered by LLMs (DeepSeek)

---

## Architecture Overview

### Three Core Entities

1. **Customer** — End user (marketer, founder, salesperson) using the platform
2. **Capybara AI** — Orchestrator/expert agent that guides workflows, interprets user intent, suggests digital clones, and relays messages
3. **Digital Clones** — Pool of specialized AI agents, each representing a distinct user persona (trained on real data, stored in Supabase with prompts)

### Interaction Modes

#### God Mode (Admin/Expert Mode)
- Customer converses directly with Capybara AI
- Customer describes research goal (e.g., "test my sales pitch on game dev users")
- Capybara AI intelligently queries Supabase to find matching clone candidates
- AI suggests: "Found 100 game developers. How many would you like? (default: 5, or top 10 active, or random)"
- Customer provides input → selected clones are loaded into chat
- Messages in this mode do NOT go to digital clones; all intelligence stays with Capybara AI
- Can exit and return to conversation mode anytime

#### Conversation Mode (Live Group Chat)
- Customer communicates with selected digital clones (e.g., 5-10 agents)
- One message → all clones respond (or selective messaging to specific clones, like Slack @mentions)
- Clones maintain **thin session memory** (conversation history only, lower weight than system prompt)
- Customer can switch back to God Mode to adjust clones or get guidance
- **No hardcoded logic** — all routing, memory management, and context handling is driven by Capybara AI's reasoning

---

## User Journeys

### Journey 1: Landing → Waitlist → Access

1. User visits landing page (public, no auth required)
2. User clicks "Join Waitlist"
3. System redirects to Google Sign-In
4. User authenticates with Google
5. System creates record in `users` table with `approved: false`
6. User is added to `waitlist` table
7. **Approval gate:** User cannot access chat until marked `approved: true` in backend
8. Once approved + logged in, user can access chat product

### Journey 2: God Mode → Select Clones → Conversation Mode

1. User logs in and enters chat product
2. Starts in God Mode (talking to Capybara AI)
3. User: "I want to test my sales pitch on early-stage SaaS founders"
4. Capybara AI queries Supabase for candidates matching "early-stage SaaS founders"
5. AI responds: "Found 47 early-stage SaaS founders. Would you like the top 10 most active, or 5 random?"
6. User selects (or defaults to 5)
7. Clones are loaded into chat room
8. **User enters Conversation Mode** — now talking to group of digital clones
9. User asks questions → clones respond with individual perspectives
10. User can return to God Mode anytime to adjust or ask Capybara AI for guidance

### Journey 3: Selective Messaging

1. In Conversation Mode with 10 clones active
2. User types: "@Clone3 @Clone7 do you think this tagline resonates?"
3. Message only sent to Clone3 and Clone7
4. Those two respond; others remain silent
5. Enables targeted follow-ups

---

## Technical Architecture

### Frontend (React 18 + TypeScript + Vite)
- **Pages:**
  - `/` — Landing page (lean marketing, tone: professional + creator-friendly)
  - `/about` — About page (company vision, product story)
  - `/docs` — Basic documentation and help
  - `/waitlist` — Waitlist form (integrated with Google auth)
  - `/chat` — Main chat product (protected by auth + approval)

- **Chat Component:**
  - Responsive design (mobile + desktop)
  - Minimal, text-focused interface
  - Message list with obfuscated clone names (User A, User B, etc.)
  - Input box with optional @mention functionality
  - Mode indicator (God Mode vs. Conversation Mode)

- **Auth:**
  - Google OAuth 2.0 integration
  - Token management and session handling
  - Protected routes (chat requires `approved: true`)

### Backend (Express + TypeScript)
- **Core Routes:**
  - `POST /auth/google` — Google auth callback
  - `POST /auth/logout` — Sign out
  - `GET /user/profile` — Get current user + approval status

  - `POST /chat/init` — Start new chat session (choose mode)
  - `POST /chat/message` — Send message to chat
  - `GET /chat/history` — Get conversation history

  - `POST /clones/search` — Query Supabase for clone candidates (called by Capybara AI)
  - `GET /clones/list` — List available clones for a user session

- **Orchestration Logic:**
  - Message routing (determine if message goes to Capybara AI, clones, or specific clones)
  - Session management (track active clones, conversation mode state)
  - Capybara AI calls to DeepSeek for clone selection and guidance
  - Clone calls to DeepSeek for individual responses

- **Database Integration:**
  - Query Supabase for clone personas, system prompts
  - Store conversation history (with session-level memory management)
  - Track user approval status, usage stats

### Database (Supabase)
- **Tables:**
  - `users` — (id, email, google_id, created_at, approved)
  - `waitlist` — (id, user_id, joined_at, approved_at)
  - `clones` — (id, name, persona_description, system_prompt, category, tags)
  - `chat_sessions` — (id, user_id, created_at, mode, active_clones_json)
  - `chat_messages` — (id, session_id, role, sender_id, content, created_at)

### LLM Integration (DeepSeek API)
- **Capybara AI:**
  - System prompt: Expert user research guide
  - Responsibilities: Suggest clones, interpret customer intent, route messages, provide guidance
  - Input: Customer intent, Supabase query results, conversation context
  - Output: Suggestions, message routing, insights

- **Digital Clones:**
  - System prompt: Individual persona (stored in Supabase)
  - Input: Customer questions, conversation history (thin session memory)
  - Output: Individual perspectives and responses
  - Memory weight: System prompt > conversation history

---

## Marketing & Landing Strategy

### Landing Page Messaging
**Tone:** Professional + Creator-friendly (for early-stage founders, Series A/B)

**Core angles:**
1. **Speed** — "Get instant feedback in minutes, not weeks"
2. **Depth** — "Real user perspectives, not aggregated patterns"
3. **Actionability** — "Catch what will actually fail with users"
4. **AI-native** — "Fully powered by advanced AI"

**Example headline:** "Talk to 10 digital clones. Get honest feedback in minutes."

**CTA:** "Join the Waitlist" (leads to Google auth → waitlist signup)

### Pages
- **Landing:** Lean (hero, value props, waitlist CTA)
- **About:** Product story, why we built it
- **Docs:** Basic usage guide, how to get started
- **Waitlist:** Form + approval messaging ("We'll notify you when you're approved")

---

## Implementation Scope

### Phase 1 (MVP)
- Google auth + waitlist flow
- Basic landing, about, docs pages
- Chat UI (God Mode + Conversation Mode)
- Single Capybara AI agent orchestration
- Basic clone selection logic (via Capybara AI prompting)
- Thin session memory for conversation history
- DeepSeek API integration

### Out of Scope (Future)
- Analytics dashboard
- Advanced user segmentation
- Clone customization UI
- Multiple conversation threads
- Export/sharing features

---

## Success Criteria

1. ✅ Users can sign up via Google + join waitlist
2. ✅ Approved users can access chat product
3. ✅ God Mode: Capybara AI suggests clones based on user intent
4. ✅ Conversation Mode: Users can chat with selected clones and receive individual responses
5. ✅ Selective messaging: Users can @mention specific clones
6. ✅ Session memory: Clones remember conversation context within session
7. ✅ Landing page clearly communicates value prop (speed, depth, actionability)

---

## Open Questions / Future Refinement

- Exact DeepSeek model to use for Capybara AI vs. clones (same or different?)
- Clone obfuscation strategy (User A/B or randomized IDs?)
- Fallback behavior if clone selection fails or API rate limits hit
- Data retention policy for conversation history
- Capacity planning (how many concurrent clones per session?)

