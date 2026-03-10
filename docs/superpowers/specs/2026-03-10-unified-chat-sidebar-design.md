# Unified Chat with Participant Sidebar - Design Specification

**Date:** 2026-03-10
**Status:** Approved
**Scope:** Frontend UI consolidation + participant sidebar

---

## Overview

Replace the current tab-based mode switching (God Mode / Conversation Mode) with a **Slack-like layout featuring a participant sidebar** and a unified chat window. This aligns the frontend UI with the backend's already-implemented single-session architecture with intelligent `@capybara` routing.

---

## Design Goals

1. **Single unified chat interface** - no mode switching, smoother UX
2. **Transparent participant visibility** - see all conversation participants (anonymized)
3. **Future deduplication ready** - anonymized hash function enables identifying same person across sessions
4. **Maintain routing flexibility** - `@capybara` prefix still routes to Capybara, default routes to active clones

---

## User Experience Flow

**Initial state (no clones activated):**
1. User sees "Capy Studyroom" header
2. Sidebar shows: "You" + "Capybara"
3. Chat area shows initial prompt: "Describe your research goal..."
4. User types research request
5. Message routes to Capybara AI (agentic loop with tools)

**After clones activated:**
1. Capybara returns `session_transition` with active clone list
2. Sidebar updates automatically: "You" + "Capybara" + anonymized clone hashes
3. Chat continues naturally - no UX disruption
4. Default messages route to all active clones
5. User can type `@capybara` to synthesize patterns from clone responses

---

## Component Architecture

### New Components

#### 1. `frontend/src/utils/anonymize.ts`
**Purpose:** Generate deterministic anonymized names from usernames

```typescript
export function anonymizeUsername(username: string): string {
  // Input: reddit_username (e.g., "dryisnotwet")
  // Output: anonymized hash (e.g., "a7f2b9e1")
  // Implementation: deterministic hash function
  // Future: improvable algorithm without breaking consistency
}
```

**Design notes:**
- Deterministic: same input always produces same output
- Enables future deduplication: same hash = same person
- Display format: first 8 characters of hash (can be tuned later)

#### 2. `frontend/src/components/ParticipantSidebar.tsx`
**Purpose:** Display all conversation participants

**Props:**
- `participants: Participant[]` - list of all participants
- `currentUser: string` - label for current user (always "You")

**Participant list (in order):**
1. **"You"** - current logged-in user, visual emphasis
2. **"Capybara"** - always present, distinct styling
3. **Active clones** - sorted by anonymized hash, one per active clone

**Styling:**
- Sidebar width: ~200px (fixed)
- Light background (var(--color-gray-50))
- Participant items: clickable/hoverable for future interaction
- Clear visual hierarchy: You > Capybara > Clones

#### 3. `frontend/src/components/UnifiedChat.tsx`
**Purpose:** Merged chat logic (replaces GodMode + ConversationMode)

**State:**
- `messages[]` - all messages in conversation
- `activeClones[]` - list of active clone names/IDs
- `loading` - boolean for message sending
- `error` - error message string

**Behavior:**
- Single component handles both initial state (no clones) and group state (with clones)
- Initial placeholder: "Describe your research goal..." (when no clones)
- Active clones indicator: shows in sidebar (not inline chat)
- `@capybara` parsing: unchanged from ChatInput (still works)
- Message display: consistent label format (You, Capybara, anonymized hash)

**Message sending:**
- Normal message + no clones → routes to Capybara
- Normal message + active clones → routes to clones (backend decides)
- `@capybara` prefix → always routes to Capybara (backend has explicit target)

**Session transitions:**
- When backend returns `session_transition` with clone list:
  - Update `activeClones[]`
  - Sidebar auto-updates participant list
  - No page reload or mode switching

### Updated Components

#### `frontend/src/pages/Chat.tsx`
**New layout:**
```
<div style={{ display: 'flex', height: '100vh' }}>
  <ParticipantSidebar participants={allParticipants} />
  <UnifiedChat sessionId={sessionId} />
</div>
```

**Changes:**
- Remove mode state and mode switcher button
- Remove conditional rendering of GodMode vs ConversationMode
- Simplify to: initialize session → pass to UnifiedChat + ParticipantSidebar
- Header shows: "Capy Studyroom" (no mode indicator)

#### `frontend/src/components/ChatInput.tsx`
**No changes required** - `@capybara` parsing already works

#### `frontend/src/components/ChatMessage.tsx`
**Minor update:**
- When role is 'clone', display anonymized hash instead of real username
- Compute hash on render: `anonymizeUsername(sender_id)`

### Deprecated Components
- `frontend/src/components/GodMode.tsx` - logic moved to UnifiedChat
- `frontend/src/components/ConversationMode.tsx` - logic moved to UnifiedChat

---

## Data Flow

```
User sends message
  ↓
ChatInput parses (checks for @capybara prefix)
  ↓
UnifiedChat.handleSendMessage()
  ├─ Add user message to state
  ├─ POST /chat/message with target (if specified)
  └─ Render immediately
  ↓
Backend response
  ├─ AI response(s) added to chat
  ├─ If session_transition: update activeClones[]
  └─ ParticipantSidebar auto-updates
  ↓
Render:
  - UnifiedChat shows all messages (labels: "You", "Capybara", anonymized hash)
  - ParticipantSidebar shows current participants
```

---

## Styling & Layout Details

**Chat.tsx layout:**
- Flex container: sidebar (flex: 0 0 200px) + chat area (flex: 1)
- Full height (100vh), no scrollable overflow

**ParticipantSidebar:**
- Background: var(--color-gray-50)
- Border-right: 1px solid var(--color-gray-200)
- Padding: var(--space-lg)
- Participant items: padding var(--space-sm), rounded corners, hover effect

**UnifiedChat:**
- Header: "Capy Studyroom" (simple text, no mode buttons)
- Messages area: flex: 1, scrollable
- Input area: ChatInput (unchanged styling)

---

## Message Labeling (for consistency)

**Chat messages display:**
- User messages: labeled "You" (right-aligned)
- Capybara messages: labeled "Capybara" (left-aligned, teal color)
- Clone messages: labeled with anonymized hash (left-aligned, gray color)

**Example:**
```
You: Find me 3 engineers in their 30s

Capybara: I'll search for engineers...

a7f2b9e1: That sounds like a solid idea...
b3c8f1d2: I'd definitely try that approach...
```

---

## Anonymous Naming Strategy

**Current approach:**
- Hash function: deterministic, converts reddit_username → 8-char hex string
- Display: raw hash (e.g., "a7f2b9e1")
- Consistency: same person always gets same hash

**Future improvements:**
- Can enhance hash algorithm (SHA-256, etc.)
- Can change display format (prefixes, colors based on hash)
- Can deduplicate clones by comparing hashes across sessions
- All changes backward compatible (just update `anonymizeUsername()` function)

---

## Error Handling

**UnifiedChat error states:**
- Network error: display error banner in chat area
- Empty message: disable send button
- Session error: redirect to waitlist (existing behavior)

**ParticipantSidebar:**
- Always shows "You" + "Capybara"
- Updates when activeClones changes
- No error states (passive component)

---

## Testing Considerations

**Component testing:**
- `anonymizeUsername()` - determinism (same input → same output)
- `ParticipantSidebar` - displays correct participants, handles empty clones
- `UnifiedChat` - message routing, session transitions, @capybara parsing
- `ChatMessage` - displays anonymized hash for clone messages

**E2E testing:**
1. Initialize session → sidebar shows "You" + "Capybara"
2. Send research query → Capybara activates clones
3. Sidebar updates with clone hashes
4. Send message → routes to clones
5. Type `@capybara` → routes to Capybara
6. View message history → hashes consistent with sidebar

---

## Implementation Order

1. Create `anonymize.ts` utility function
2. Create `ParticipantSidebar.tsx` component
3. Merge GodMode + ConversationMode into `UnifiedChat.tsx`
4. Update `Chat.tsx` with new layout
5. Update `ChatMessage.tsx` to display anonymized hashes
6. Remove deprecated mode state and buttons
7. Test message routing and session transitions

---

## Backward Compatibility

- No backend changes required (routing already supports this)
- Session state `active_clones[]` already available
- No API contract changes
- All existing functionality preserved

---

## Future Enhancements

1. **Participant avatars** - generate from hash
2. **Clone deduplication** - detect same person by hash, merge clones
3. **Participant filtering** - click sidebar to filter messages
4. **Online status** - show last activity timestamp
5. **Typing indicators** - show when participants are "typing"
