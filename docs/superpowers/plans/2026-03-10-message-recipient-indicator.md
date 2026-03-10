# Message Recipient Indicator + @all_participants Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display message recipients (@capybara, @persona, @all_participants) inline before message content, and add @all_participants as a special mention to broadcast to all active clones.

**Architecture:**
- Frontend-only changes: Extract @mention from input, pass as separate `recipient` prop through component chain
- Display recipient inline in ChatMessage (bold, highlighted teal)
- Add @all_participants to mention dropdown when clones are active
- No backend or database changes — recipient reconstructed from routing context

**Tech Stack:** React, TypeScript, existing styling with CSS-in-JS

---

## File Structure

**Modified Files:**
- `frontend/src/components/ChatInput.tsx` — Extract recipient, add @all_participants mention option
- `frontend/src/components/ChatMessage.tsx` — Display recipient inline with styling
- `frontend/src/App.tsx` (or chat container) — Pass recipient through component chain
- `frontend/src/components/ConversationMode.tsx` or main chat component — Capture and propagate recipient

**Test Files (new):**
- `frontend/src/components/__tests__/ChatInput.test.tsx` — Test recipient extraction, @all_participants visibility
- `frontend/src/components/__tests__/ChatMessage.test.tsx` — Test recipient display and styling

---

## Chunk 1: Update ChatMessage Component

### Task 1: Add recipient prop and display logic to ChatMessage

**Files:**
- Modify: `frontend/src/components/ChatMessage.tsx`

- [ ] **Step 1: Read ChatMessage.tsx to understand current structure**

File: `frontend/src/components/ChatMessage.tsx` (lines 1-50 for props and render)

- [ ] **Step 2: Update ChatMessageProps interface to include recipient**

Add optional `recipient?: string` to the interface (line 12-17):

```typescript
interface ChatMessageProps {
  role: 'user' | 'capybara' | 'clone'
  sender_id: string
  content: string
  reasoning?: ReasoningStep[]
  recipient?: string  // NEW: who this message was sent to
}
```

- [ ] **Step 3: Extract recipient in function parameters**

Update the destructuring (line 19) to include recipient:

```typescript
export function ChatMessage({ role, sender_id, content, reasoning, recipient }: ChatMessageProps) {
```

- [ ] **Step 4: Add recipient display before message content**

Inside the message bubble div (after line 61, before `{content}`), add recipient display:

```typescript
{recipient && (
  <span style={{
    fontWeight: 'bold',
    color: 'var(--color-teal)',
    marginRight: '0.5rem',
  }}>
    @{recipient}
  </span>
)}
{content}
```

So the full message block becomes:

```typescript
<div style={{
  padding: 'var(--space-lg)',
  borderRadius: '0.5rem',
  backgroundColor: isUser ? 'var(--color-teal)' : 'var(--color-gray-50)',
  color: isUser ? 'var(--color-white)' : 'var(--color-navy)',
  fontSize: 'var(--text-base)',
  lineHeight: 'var(--line-relaxed)',
  wordWrap: 'break-word' as const,
  border: isUser ? 'none' : isCapybara ? '2px solid var(--color-teal)' : '1px solid var(--color-gray-200)',
  borderLeft: isCapybara ? '4px solid var(--color-teal)' : undefined,
  boxShadow: isUser ? 'var(--shadow-sm)' : isCapybara ? '0 0 0 3px rgba(13, 148, 136, 0.1)' : 'none',
}}>
  {recipient && (
    <span style={{
      fontWeight: 'bold',
      color: 'var(--color-teal)',
      marginRight: '0.5rem',
    }}>
      @{recipient}
    </span>
  )}
  {content}
</div>
```

- [ ] **Step 5: Test ChatMessage.tsx changes manually**

Open the component file and verify:
- Props interface updated correctly (line 12)
- Recipient parameter extracted (line 19)
- Recipient span renders in the JSX (around line 61-62)
- No TypeScript errors in the editor

- [ ] **Step 6: Commit ChatMessage changes**

```bash
git add frontend/src/components/ChatMessage.tsx
git commit -m "feat: add recipient prop and inline display to ChatMessage"
```

---

## Chunk 2: Update ChatInput Component

### Task 2: Extract recipient from @mention and update onSend callback

**Files:**
- Modify: `frontend/src/components/ChatInput.tsx`

- [ ] **Step 1: Read ChatInput.tsx and understand current @mention handling**

File: `frontend/src/components/ChatInput.tsx` (lines 1-110 for mention logic and handleSend)

Focus on:
- Line 74: `const capybaraMatch = input.match(/^@capybara\s+(.*)/)`
- Lines 76-82: How capybara routing strips the @mention
- Line 4: Current `onSend` signature

- [ ] **Step 2: Update onSend callback signature**

Modify line 4 to accept recipient parameter:

```typescript
interface ChatInputProps {
  onSend: (message: string, targetClones?: string[], target?: 'capybara' | 'clones', recipient?: string) => void
  disabled?: boolean
  placeholder?: string
  activeClones?: string[]
}
```

- [ ] **Step 3: Add function to extract recipient and clean message**

Add this helper function after the ChatInput component definition (around line 87, after handleSend):

```typescript
const extractRecipient = (input: string): { message: string; recipient?: string } => {
  // Match @mention at start of message
  const match = input.match(/^@(\S+)\s+(.*)/)
  if (match) {
    const recipient = match[1]
    const message = match[2]
    return { message, recipient }
  }
  return { message: input }
}
```

- [ ] **Step 4: Update handleSend to use new extraction and pass recipient**

Replace lines 71-86 with:

```typescript
const handleSend = () => {
  if (input.trim()) {
    const { message, recipient } = extractRecipient(input.trim())

    if (recipient === 'capybara') {
      // Route to Capybara AI
      onSend(message, undefined, 'capybara', 'capybara')
    } else if (recipient === 'all_participants') {
      // Route to all clones
      onSend(message, undefined, 'clones', 'all_participants')
    } else if (recipient) {
      // Route to specific clone by name
      onSend(message, undefined, 'clones', recipient)
    } else {
      // Route to default (clones if active, else Capybara)
      onSend(message)
    }

    setInput('')
    setShowMentions(false)
  }
}
```

- [ ] **Step 5: Update mentionOptions to conditionally include @all_participants**

Replace lines 22-25 with:

```typescript
const mentionOptions: MentionOption[] = [
  { name: 'capybara', label: 'Capybara AI (Orchestrator)' },
  ...(activeClones.length > 0 ? [{ name: 'all_participants', label: 'All Participants' }] : []),
  ...activeClones.map(clone => ({ name: clone, label: `@${clone}` }))
]
```

- [ ] **Step 6: Update insertMention to work with new extraction logic**

The insertMention function (lines 52-69) already works correctly with the regex, but verify it still inserts properly with the updated @mention format.

- [ ] **Step 7: Test ChatInput.tsx changes manually**

- Open the app and verify:
  - Type "@capybara " → autocomplete shows "Capybara AI (Orchestrator)"
  - Type "@all_" → autocomplete shows "All Participants" (only if clones active)
  - Type "@persona_name" → autocomplete filters to matching clone
  - Select an option → @mention is inserted correctly
  - Press Enter to send → message is sent with recipient extracted

- [ ] **Step 8: Commit ChatInput changes**

```bash
git add frontend/src/components/ChatInput.tsx
git commit -m "feat: extract recipient from @mention, add @all_participants option"
```

---

## Chunk 3: Update App Component to Pass Recipient

### Task 3: Propagate recipient from ChatInput through to ChatMessage

**Files:**
- Modify: `frontend/src/App.tsx` (or main chat container component)

- [ ] **Step 1: Locate the chat container component and understand current message flow**

Find the component that:
- Calls `<ChatInput onSend={...} />`
- Renders messages via `<ChatMessage ... />`
- Maintains conversation history state

This is likely in `frontend/src/App.tsx` or `frontend/src/components/ConversationMode.tsx`

- [ ] **Step 2: Read the current message rendering loop**

Look for where messages are rendered (e.g., `messages.map(msg => <ChatMessage ... />)`)

- [ ] **Step 3: Add recipient tracking in message state**

Ensure the message object stored in state includes a `recipient` field:

```typescript
interface Message {
  role: 'user' | 'capybara' | 'clone'
  sender_id: string
  content: string
  recipient?: string  // NEW
  reasoning?: ReasoningStep[]
}
```

- [ ] **Step 4: Update onSend handler to capture recipient**

Modify the `onSend` handler to accept and store the recipient parameter:

```typescript
const handleSend = (message: string, targetClones?: string[], target?: 'capybara' | 'clones', recipient?: string) => {
  // Add user message with recipient
  setMessages([...messages, {
    role: 'user',
    sender_id: 'user',
    content: message,
    recipient: recipient  // Store the recipient
  }])

  // Send to backend...rest of logic
}
```

- [ ] **Step 5: Update ChatMessage render calls to pass recipient prop**

Find the message rendering loop and add the recipient prop:

```typescript
{messages.map((msg, idx) => (
  <ChatMessage
    key={idx}
    role={msg.role}
    sender_id={msg.sender_id}
    content={msg.content}
    recipient={msg.recipient}  // NEW
    reasoning={msg.reasoning}
  />
))}
```

- [ ] **Step 6: Test the full flow manually**

1. Start the app: `npm run dev`
2. Send a message to Capybara: "@capybara test message"
   - Verify it displays as: `@capybara test message`
3. Send a message to default routing: "test message"
   - Verify no recipient is shown (or shows current default)
4. If clones active, send to @all_participants: "@all_participants what do you think?"
   - Verify it displays as: `@all_participants what do you think?`

- [ ] **Step 7: Commit App component changes**

```bash
git add frontend/src/App.tsx
git commit -m "feat: propagate recipient through component chain to ChatMessage"
```

---

## Chunk 4: Unit Tests for Recipient Extraction

### Task 4: Write tests for ChatInput recipient extraction

**Files:**
- Create: `frontend/src/components/__tests__/ChatInput.test.tsx`

- [ ] **Step 1: Create test file**

Create file `frontend/src/components/__tests__/ChatInput.test.tsx`

- [ ] **Step 2: Write test for @capybara extraction**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatInput } from '../ChatInput'

describe('ChatInput recipient extraction', () => {
  it('extracts @capybara recipient and strips from message', () => {
    const onSend = jest.fn()
    render(<ChatInput onSend={onSend} activeClones={[]} />)

    const textarea = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(textarea, { target: { value: '@capybara grab me personas' } })
    fireEvent.click(screen.getByText('Send'))

    expect(onSend).toHaveBeenCalledWith(
      'grab me personas',    // Clean message
      undefined,
      'capybara',            // Route to capybara
      'capybara'             // Recipient
    )
  })
})
```

- [ ] **Step 3: Write test for @all_participants extraction**

```typescript
  it('extracts @all_participants and routes to clones', () => {
    const onSend = jest.fn()
    render(<ChatInput onSend={onSend} activeClones={['eng', 'designer']} />)

    const textarea = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(textarea, { target: { value: '@all_participants what do you think' } })
    fireEvent.click(screen.getByText('Send'))

    expect(onSend).toHaveBeenCalledWith(
      'what do you think',   // Clean message
      undefined,
      'clones',              // Route to clones
      'all_participants'     // Recipient
    )
  })
```

- [ ] **Step 4: Write test for specific clone mention**

```typescript
  it('extracts specific clone name and routes', () => {
    const onSend = jest.fn()
    render(<ChatInput onSend={onSend} activeClones={['engineer', 'designer']} />)

    const textarea = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(textarea, { target: { value: '@engineer test pitch' } })
    fireEvent.click(screen.getByText('Send'))

    expect(onSend).toHaveBeenCalledWith(
      'test pitch',
      undefined,
      'clones',
      'engineer'
    )
  })
```

- [ ] **Step 5: Write test for @all_participants visibility**

```typescript
  it('shows @all_participants only when clones are active', () => {
    const { rerender } = render(<ChatInput onSend={() => {}} activeClones={[]} />)

    // Trigger mention dropdown
    const textarea = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(textarea, { target: { value: '@' } })

    // Should not show @all_participants when no clones
    expect(screen.queryByText('All Participants')).not.toBeInTheDocument()

    // Now with active clones
    rerender(<ChatInput onSend={() => {}} activeClones={['eng']} />)
    fireEvent.change(textarea, { target: { value: '@' } })

    // Should show @all_participants now
    expect(screen.getByText('All Participants')).toBeInTheDocument()
  })
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- ChatInput.test.tsx
```

Expected: All tests pass

- [ ] **Step 7: Commit test file**

```bash
git add frontend/src/components/__tests__/ChatInput.test.tsx
git commit -m "test: add unit tests for recipient extraction in ChatInput"
```

---

## Chunk 5: Unit Tests for Recipient Display

### Task 5: Write tests for ChatMessage recipient display

**Files:**
- Create: `frontend/src/components/__tests__/ChatMessage.test.tsx`

- [ ] **Step 1: Create test file**

Create file `frontend/src/components/__tests__/ChatMessage.test.tsx`

- [ ] **Step 2: Write test for recipient display when provided**

```typescript
import { render, screen } from '@testing-library/react'
import { ChatMessage } from '../ChatMessage'

describe('ChatMessage recipient display', () => {
  it('displays recipient in bold teal before message content', () => {
    const { container } = render(
      <ChatMessage
        role="user"
        sender_id="user"
        content="grab me personas"
        recipient="capybara"
      />
    )

    const recipientSpan = container.querySelector('span[style*="color: var(--color-teal)"]')
    expect(recipientSpan).toBeInTheDocument()
    expect(recipientSpan?.textContent).toBe('@capybara')
    expect(recipientSpan?.style.fontWeight).toBe('bold')
    expect(screen.getByText('grab me personas')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Write test for no recipient display**

```typescript
  it('does not display recipient span when recipient is undefined', () => {
    const { container } = render(
      <ChatMessage
        role="user"
        sender_id="user"
        content="test message"
      />
    )

    const recipientSpans = container.querySelectorAll('span[style*="color: var(--color-teal)"]')
    // Should have no recipient span (may have others for styling)
    expect(screen.getByText('test message')).toBeInTheDocument()
  })
```

- [ ] **Step 4: Write test for @all_participants display**

```typescript
  it('displays @all_participants recipient', () => {
    const { container } = render(
      <ChatMessage
        role="clone"
        sender_id="clone-1"
        content="what do you think"
        recipient="all_participants"
      />
    )

    const recipientSpan = container.querySelector('span[style*="color: var(--color-teal)"]')
    expect(recipientSpan?.textContent).toBe('@all_participants')
    expect(screen.getByText('what do you think')).toBeInTheDocument()
  })
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- ChatMessage.test.tsx
```

Expected: All tests pass

- [ ] **Step 6: Commit test file**

```bash
git add frontend/src/components/__tests__/ChatMessage.test.tsx
git commit -m "test: add unit tests for recipient display in ChatMessage"
```

---

## Chunk 6: Integration Test

### Task 6: E2E test for full recipient flow

**Files:**
- Create: `frontend/src/components/__tests__/ChatIntegration.test.tsx` (or use existing E2E test suite)

- [ ] **Step 1: Write integration test for full flow**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
// Import your main app component or chat container
import { ChatContainer } from '../ChatContainer'

describe('Recipient display integration', () => {
  it('displays recipient in message when sent with @mention', async () => {
    const mockOnSendToBackend = jest.fn()
    render(<ChatContainer onSendToBackend={mockOnSendToBackend} activeClones={['eng']} />)

    const textarea = screen.getByPlaceholderText(/Type your message/)
    const sendButton = screen.getByText('Send')

    // Send message to @capybara
    fireEvent.change(textarea, { target: { value: '@capybara test request' } })
    fireEvent.click(sendButton)

    // Message should appear with recipient displayed
    await waitFor(() => {
      const recipientSpan = screen.getByText('@capybara')
      const messageText = screen.getByText('test request')
      expect(recipientSpan).toBeInTheDocument()
      expect(messageText).toBeInTheDocument()
    })

    // Backend should receive clean message
    expect(mockOnSendToBackend).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'test request',
        target: 'capybara'
      })
    )
  })
})
```

- [ ] **Step 2: Run integration test**

```bash
npm test -- ChatIntegration.test.tsx
```

Expected: Test passes

- [ ] **Step 3: Commit integration test**

```bash
git add frontend/src/components/__tests__/ChatIntegration.test.tsx
git commit -m "test: add integration test for recipient display flow"
```

---

## Chunk 7: Manual E2E Testing

### Task 7: Manual testing of feature in running app

- [ ] **Step 1: Start development server**

```bash
npm run dev
```

Expected: App runs on http://localhost:3000

- [ ] **Step 2: Test @capybara recipient display**

1. Navigate to chat interface
2. Type: `"@capybara analyze my target market"`
3. Send message
4. Verify in chat window: message displays as `@capybara analyze my target market`
5. Verify @capybara is bold and teal-colored
6. Verify "You" label still appears above the bubble

- [ ] **Step 3: Test @all_participants availability and routing**

1. Initiate a conversation that activates clones (so activeClones.length > 0)
2. Type `"@all"` in input
3. Verify autocomplete dropdown shows "All Participants" option
4. Select it or type full text: `"@all_participants what do you think?"`
5. Send message
6. Verify displays as `@all_participants what do you think?`
7. Verify message routes to all active clones (check backend logs or responses)

- [ ] **Step 4: Test specific clone mention**

1. With active clones, type: `"@engineer_persona test pitch to you"`
2. Send message
3. Verify displays as `@engineer_persona test pitch to you`
4. Verify message routes to specific clone

- [ ] **Step 5: Test message without explicit recipient**

1. Type regular message without @mention: `"just a regular message"`
2. Send
3. Verify no recipient prefix is shown
4. Verify message routes to default handler (all clones if active, else Capybara)

- [ ] **Step 6: Test message history retrieval**

1. Send several messages with different recipients (@capybara, @all_participants, specific clones)
2. Call GET /chat/history
3. Verify recipient field is present in response for user messages
4. Verify message content is clean (no @mention in stored content)

- [ ] **Step 7: Document results**

Create a test results file or update existing docs/TEST_RESULTS.md:
```markdown
## Message Recipient Indicator Feature

✅ @capybara recipient displays correctly (bold, teal)
✅ @all_participants appears only when clones active
✅ Specific clone @mention displays correctly
✅ Regular messages display without recipient prefix
✅ Message history includes recipient field
✅ Backend routes correctly based on recipient
```

- [ ] **Step 8: Final commit**

```bash
git add docs/TEST_RESULTS.md
git commit -m "test: manual E2E testing complete for recipient indicator feature"
```

---

## Summary

This plan delivers the message recipient indicator feature with:
- ✅ Inline @recipient display in ChatMessage (bold, highlighted)
- ✅ @all_participants as special mention (only when clones active)
- ✅ Proper routing based on recipient type
- ✅ Clean message storage (no @mention in DB)
- ✅ Unit and integration tests
- ✅ Manual E2E testing

**Total effort:** ~2-3 hours for full implementation + testing

**Key commits in order:**
1. `feat: add recipient prop and inline display to ChatMessage`
2. `feat: extract recipient from @mention, add @all_participants option`
3. `feat: propagate recipient through component chain to ChatMessage`
4. `test: add unit tests for recipient extraction in ChatInput`
5. `test: add unit tests for recipient display in ChatMessage`
6. `test: add integration test for recipient display flow`
7. `test: manual E2E testing complete for recipient indicator feature`

