# Message Recipient Indicator + @all_participants Feature Design

**Date:** 2026-03-10
**Feature:** Display message recipient in chat window and add @all_participants mention
**Status:** Approved for Implementation

---

## Overview

Add visual clarity to message routing by:
1. Displaying the message recipient inline with the message content (bold, highlighted)
2. Adding `@all_participants` as a special mention to broadcast to all active clones at once

### Example
```
User types:     "@capybara grab me 10 personas"
Displayed as:   @capybara grab me 10 personas
                [message bubble]

User types:     "@all_participants what do you think?"
Displayed as:   @all_participants what do you think?
                [message bubble]
```

---

## Feature Requirements

### 1. Inline Recipient Display
- **Display Location:** Directly before message text in the message bubble
- **Format:** `@<recipient>` (bold, highlighted, teal color)
- **Recipients:**
  - `@capybara` — Capybara AI orchestrator
  - `@<persona_name>` — Specific persona (e.g., `@engineer_persona`)
  - `@all_participants` — All active clones
- **Data Source:** Reconstructed from routing target, not stored in DB

### 2. @all_participants Mention
- **Visibility:** Only appears in mention dropdown when `activeClones.length > 0`
- **Behavior:** Routes message to all active clones in parallel (same as current multi-clone behavior)
- **Display:** Shows as `@all_participants` in autocomplete and inline
- **Fallback:** If no clones active, option is hidden

### 3. Existing "Who Sent" Indicator
- **Already implemented** in ChatMessage.tsx (lines 37-48)
- **Shows:** "You", "Capybara AI", or persona name above message bubble
- **No changes needed** for this feature

---

## Implementation Details

### Frontend Changes

#### ChatInput.tsx
1. **Extract recipient from @mention:**
   - Parse `@<name>` prefix from input (e.g., `@capybara ` → `capybara`)
   - Extract clean message content (strip @mention)
   - Return as separate `recipient` parameter to `onSend()`

2. **Add @all_participants to mention options:**
   - Conditionally include in `mentionOptions` array
   - Only add when `activeClones.length > 0`
   - Format: `{ name: 'all_participants', label: 'All Participants' }`

3. **Map @all_participants to routing:**
   - When user selects `@all_participants`, set `target: 'clones'`
   - Backend routes to all active clones

4. **Update onSend callback signature:**
   - Current: `onSend(message: string, targetClones?: string[], target?: 'capybara' | 'clones')`
   - New: `onSend(message: string, targetClones?: string[], target?: 'capybara' | 'clones', recipient?: string)`
   - `recipient` is the @mention name (e.g., "capybara", "all_participants")

#### ChatMessage.tsx
1. **Add recipient prop:**
   - Accept `recipient?: string` in `ChatMessageProps`
   - Render before message content if present

2. **Display recipient inline:**
   ```tsx
   {recipient && (
     <span style={{
       fontWeight: 'bold',
       color: 'var(--color-teal)',
       marginRight: '0.5rem',
       // Could add subtle background: backgroundColor: 'rgba(13, 148, 136, 0.1)'
     }}>
       @{recipient}
     </span>
   )}
   {content}
   ```

3. **Styling:**
   - Bold weight
   - Teal color (`var(--color-teal)`)
   - Optional: subtle background box or slightly larger font

#### App.tsx (or chat container)
1. **Capture recipient from ChatInput:**
   - Update `handleSend()` callback to receive `recipient` parameter
   - Pass to `ChatMessage` component when rendering

2. **Store recipient in message history:**
   - Include `recipient` when building message array for display
   - Frontend-only (not sent to backend)

### Backend Changes
- **No changes needed** — already routes based on `target` parameter
- Message content stored clean (no @mention prefix)
- Recipient info reconstructed on frontend during display

### Database Changes
- **No changes** — message schema stays the same
- Message content: `"grab me 10 personas"` (clean, without @mention)
- Recipient determined dynamically from routing context on frontend

---

## Message Data Flow

### Sending
1. User types: `"@capybara grab me 10 personas"`
2. ChatInput extracts:
   - `content: "grab me 10 personas"`
   - `recipient: "capybara"`
   - `target: "capybara"`
3. Frontend sends to backend: `{ content, target }`
4. Backend stores: `{ content: "grab me 10 personas", role: "user", ... }`

### Displaying
1. Backend returns: `{ content: "grab me 10 personas", role: "user", sender_id: "..." }`
2. Frontend reconstructs context: knows this was sent with `target: "capybara"`
3. ChatMessage renders: `@capybara grab me 10 personas`

---

## Edge Cases & Handling

| Scenario | Behavior |
|----------|----------|
| User types `"@unknown_name ..."` | Backend fails gracefully (existing validation) |
| No active clones, user types `"@all_participants ..."` | Option not shown in dropdown; user must type manually; backend routes to no clones (message sent, no responses) |
| User edits message with @mention | Mention re-extracted on each change |
| Clone list changes mid-typing | Dropdown updates dynamically to show/hide @all_participants |

---

## Testing Plan

### Frontend
- [ ] @mention parsing extracts recipient correctly
- [ ] @all_participants only shows in dropdown when activeClones > 0
- [ ] Recipient displays bold/highlighted before message text
- [ ] Message content stored clean in component state
- [ ] Keyboard navigation works with new mention options

### End-to-End
- [ ] Send `"@capybara test"` → displays as `@capybara test`
- [ ] Send `"@all_participants test"` → routes to all clones, displays as `@all_participants test`
- [ ] Message history retrieval shows clean content, recipient reconstructed on display
- [ ] Switching between targets (@capybara, @clone_name, @all_participants) works correctly

---

## Success Criteria

✅ Users can see who each message is being sent to at a glance
✅ @all_participants available to broadcast to all active clones
✅ Visual indicator (bold, highlighted) makes recipient clear
✅ No database schema changes needed
✅ Clean message content stored in DB
✅ Recipient reconstructed correctly from routing context

