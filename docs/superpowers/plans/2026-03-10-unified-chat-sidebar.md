# Unified Chat with Participant Sidebar Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace tab-based mode switching with a Slack-like sidebar showing all participants (anonymized) and a unified chat window, improving UX transparency and aligning frontend with backend architecture.

**Architecture:**
- Create a `anonymize.ts` utility that generates deterministic hashes from usernames
- Build `ParticipantSidebar.tsx` to display "You", "Capybara", and active clones with anonymized names
- Merge `GodMode.tsx` + `ConversationMode.tsx` logic into `UnifiedChat.tsx`
- Update `Chat.tsx` layout from mode tabs to flex-based sidebar + chat
- Update `ChatMessage.tsx` to display anonymized hashes for clone messages

**Tech Stack:** React 18, TypeScript, existing CSS variables (var(--color-*), var(--space-*))

---

## File Structure Overview

**New files:**
- `frontend/src/utils/anonymize.ts` - username → anonymized hash function
- `frontend/src/components/ParticipantSidebar.tsx` - sidebar showing participants
- `frontend/src/components/UnifiedChat.tsx` - merged chat logic (replaces mode switching)

**Modified files:**
- `frontend/src/pages/Chat.tsx` - layout from tabs to sidebar + chat
- `frontend/src/components/ChatMessage.tsx` - display anonymized hash for clones

**Deprecated (can delete later):**
- `frontend/src/components/GodMode.tsx`
- `frontend/src/components/ConversationMode.tsx`

---

## Chunk 1: Anonymization Utility

### Task 1: Create anonymize.ts utility function

**Files:**
- Create: `frontend/src/utils/anonymize.ts`

- [ ] **Step 1: Write the test file**

Create `frontend/src/utils/anonymize.test.ts`:

```typescript
import { anonymizeUsername } from './anonymize'

describe('anonymizeUsername', () => {
  it('should generate a hash from username', () => {
    const hash = anonymizeUsername('dryisnotwet')
    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })

  it('should be deterministic - same input produces same output', () => {
    const username = 'testuser123'
    const hash1 = anonymizeUsername(username)
    const hash2 = anonymizeUsername(username)
    expect(hash1).toBe(hash2)
  })

  it('should produce different hashes for different usernames', () => {
    const hash1 = anonymizeUsername('user1')
    const hash2 = anonymizeUsername('user2')
    expect(hash1).not.toBe(hash2)
  })

  it('should return a reasonable length (8-16 chars)', () => {
    const hash = anonymizeUsername('someuser')
    expect(hash.length).toBeGreaterThanOrEqual(8)
    expect(hash.length).toBeLessThanOrEqual(16)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- frontend/src/utils/anonymize.test.ts
```

Expected: All 4 tests FAIL with "Cannot find module './anonymize'"

- [ ] **Step 3: Write the anonymize function**

Create `frontend/src/utils/anonymize.ts`:

```typescript
/**
 * Convert a username to an anonymized deterministic identifier (hash).
 *
 * Design:
 * - Deterministic: same username always produces same hash
 * - Anonymized: hash is opaque, doesn't reveal original username
 * - Future-proof: can improve hash algorithm later without breaking consistency
 *
 * Used for: displaying clone participants in sidebar while maintaining user privacy
 * and enabling future deduplication (same hash = same person across sessions)
 *
 * @param username - The original username (e.g., reddit handle)
 * @returns Anonymized hash string (e.g., "a7f2b9e1")
 */
export function anonymizeUsername(username: string): string {
  // Simple implementation using base36 hash
  // Future: can upgrade to SHA-256 or other algorithms

  let hash = 0
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to hex string and take first 8 characters
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8)
  return hexHash
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- frontend/src/utils/anonymize.test.ts
```

Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/anonymize.ts frontend/src/utils/anonymize.test.ts
git commit -m "feat: add anonymizeUsername utility for deterministic username hashing"
```

---

## Chunk 2: ParticipantSidebar Component

### Task 2: Create ParticipantSidebar component

**Files:**
- Create: `frontend/src/components/ParticipantSidebar.tsx`

- [ ] **Step 1: Write the component**

Create `frontend/src/components/ParticipantSidebar.tsx`:

```typescript
import { anonymizeUsername } from '../utils/anonymize'

interface Participant {
  id: string // 'you', 'capybara', or clone name
  type: 'user' | 'capybara' | 'clone'
  displayName?: string // For 'you' and 'capybara', explicit label
}

interface ParticipantSidebarProps {
  currentUserId: string
  activeClones: string[] // List of clone names/reddit_usernames
}

export function ParticipantSidebar({ currentUserId, activeClones }: ParticipantSidebarProps) {
  // Build participant list in order: You, Capybara, Active Clones
  const participants: Participant[] = [
    {
      id: 'you',
      type: 'user',
      displayName: 'You'
    },
    {
      id: 'capybara',
      type: 'capybara',
      displayName: 'Capybara'
    },
    ...activeClones.map(clone => ({
      id: clone,
      type: 'clone' as const,
      displayName: anonymizeUsername(clone)
    }))
  ]

  return (
    <div style={{
      width: '200px',
      backgroundColor: 'var(--color-gray-50)',
      borderRight: '1px solid var(--color-gray-200)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: 'var(--space-lg)',
        borderBottom: '1px solid var(--color-gray-200)',
        backgroundColor: 'var(--color-white)',
      }}>
        <h3 style={{
          fontSize: 'var(--text-xs)',
          fontWeight: '600',
          color: 'var(--color-gray-600)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Participants
        </h3>
      </div>

      {/* Participants List */}
      <div style={{
        padding: 'var(--space-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
      }}>
        {participants.map((participant) => (
          <div
            key={participant.id}
            style={{
              padding: 'var(--space-sm) var(--space-base)',
              borderRadius: '0.375rem',
              fontSize: 'var(--text-sm)',
              fontWeight: '500',
              color: 'var(--color-navy)',
              backgroundColor: participant.type === 'user' ? 'var(--color-gray-100)' : 'transparent',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)',
              wordBreak: 'break-all',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-gray-200)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor =
                participant.type === 'user' ? 'var(--color-gray-100)' : 'transparent'
            }}
          >
            {participant.type === 'capybara' ? (
              <span style={{ color: 'var(--color-teal)', fontWeight: '600' }}>
                {participant.displayName}
              </span>
            ) : (
              participant.displayName
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify component renders without errors**

Add temporary export to a test or manually verify the component structure looks right:
- Sidebar width: 200px
- Header: "Participants"
- List items: "You" (highlighted), "Capybara" (teal), clones with anonymized hashes
- Hover effect on items

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ParticipantSidebar.tsx
git commit -m "feat: add ParticipantSidebar component showing anonymized participants"
```

---

## Chunk 3: UnifiedChat Component

### Task 3: Create UnifiedChat component (merge GodMode + ConversationMode)

**Files:**
- Create: `frontend/src/components/UnifiedChat.tsx`

- [ ] **Step 1: Write the component (part 1 - state & message handling)**

Create `frontend/src/components/UnifiedChat.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { getAuthHeaders } from '../services/auth'

interface ReasoningStep {
  iteration: number
  action: string
  toolName: string
  input?: any
  output?: any
  summary: string
}

interface ChatMessageData {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: number
  role: 'user' | 'capybara' | 'clone'
  sender_id: string
  reasoning?: ReasoningStep[]
}

interface ChatResponse {
  ai_responses: ChatMessageData[]
  user_message: ChatMessageData
  capybara_reasoning?: ReasoningStep[]
  session_transition?: {
    clone_ids: number[]
    clone_names: string[]
  }
}

interface UnifiedChatProps {
  sessionId: string
  onActiveClonesChange?: (clones: string[]) => void
}

export function UnifiedChat({ sessionId, onActiveClonesChange }: UnifiedChatProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [activeClones, setActiveClones] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchingPersonas, setSearchingPersonas] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Notify parent when active clones change
  useEffect(() => {
    onActiveClonesChange?.(activeClones)
  }, [activeClones, onActiveClonesChange])

  const handleSendMessage = async (
    content: string,
    _targetClones?: string[],
    target?: 'capybara' | 'clones'
  ) => {
    setError(null)
    setLoading(true)
    setSearchingPersonas(target === 'capybara')

    const controller = new AbortController()

    try {
      if (!content.trim()) {
        throw new Error('Message cannot be empty')
      }

      // Add user message immediately
      const userMsg: ChatMessageData = {
        id: `msg_${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: Date.now(),
        role: 'user',
        sender_id: 'user'
      }
      setMessages((prev) => [...prev, userMsg])

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const authHeaders = await getAuthHeaders()
      if ('Authorization' in authHeaders) {
        headers['Authorization'] = authHeaders['Authorization']
      }

      const requestBody: any = { session_id: sessionId, content }
      if (target === 'capybara') {
        requestBody.target = 'capybara'
      }

      console.log('[UNIFIED_CHAT] Sending message:', {
        content,
        target,
        requestBody: JSON.stringify(requestBody)
      })

      const response = await fetch('/chat/message', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      console.log('[UNIFIED_CHAT] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      console.log('[UNIFIED_CHAT] Response data:', {
        userMessage: data.user_message,
        aiResponses: data.ai_responses?.map((r: any) => ({ role: r.role, sender_id: r.sender_id })),
        sessionTransition: data.session_transition
      })

      // Add AI responses with reasoning (if from Capybara)
      if (data.ai_responses) {
        const responsesWithReasoning = data.ai_responses.map((response) => ({
          ...response,
          reasoning: response.role === 'capybara' ? data.capybara_reasoning : undefined
        }))
        setMessages((prev) => [...prev, ...responsesWithReasoning])
      }

      // If session_transition is present, update active clones
      if (data.session_transition) {
        const { clone_names } = data.session_transition
        console.log('[UNIFIED_CHAT] Updating active clones:', clone_names)
        setActiveClones(clone_names)
      }
    } catch (err: any) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Message request cancelled')
        return
      }
      const errorMsg = err.message || 'An unexpected error occurred'
      setError(errorMsg)
      console.error('[UNIFIED_CHAT] Error:', err)
    } finally {
      setLoading(false)
      setSearchingPersonas(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-white)' }}>
      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-2xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}>
        {/* Initial state prompt - shown when no clones active */}
        {messages.length === 0 && activeClones.length === 0 && !error && (
          <div style={{
            padding: 'var(--space-2xl)',
            backgroundColor: 'var(--color-gray-50)',
            borderRadius: '0.5rem',
            borderLeft: '4px solid var(--color-teal)',
          }}>
            <h3 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: '600',
              color: 'var(--color-navy)',
              marginBottom: 'var(--space-base)',
              margin: 0,
            }}>
              Describe Your Research Goal
            </h3>
            <p style={{
              color: 'var(--color-gray-600)',
              fontSize: 'var(--text-base)',
              margin: '0.5rem 0 0 0',
            }}>
              Talk to Capybara AI to plan your research. For example: "I want to test my sales pitch on game developers."
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            sender_id={msg.sender_id}
            content={msg.content}
            reasoning={msg.reasoning}
          />
        ))}

        {/* Searching personas state */}
        {searchingPersonas && (
          <div style={{
            padding: 'var(--space-lg)',
            backgroundColor: 'var(--color-gray-50)',
            borderRadius: '0.5rem',
            borderLeft: '4px solid var(--color-teal)',
            color: 'var(--color-gray-600)',
          }}>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
              Searching for relevant personas...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: 'var(--space-lg)',
            borderRadius: '0.5rem',
            marginBottom: 'var(--space-lg)',
            border: '1px solid #fecaca',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={loading}
        placeholder={activeClones.length > 0 ? "Ask your clones a question..." : "Describe your research goal..."}
        activeClones={activeClones}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify component logic**

Verify:
- State management: messages, activeClones, loading, error
- Message sending: sends to backend, handles @capybara target
- Session transitions: updates activeClones when clones are activated
- Placeholders: shows different text based on activeClones state
- Error handling: displays errors and can recover

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/UnifiedChat.tsx
git commit -m "feat: add UnifiedChat component merging GodMode and ConversationMode logic"
```

---

## Chunk 4: Update Chat.tsx and ChatMessage.tsx

### Task 4: Update Chat.tsx with new sidebar layout

**Files:**
- Modify: `frontend/src/pages/Chat.tsx`

- [ ] **Step 1: Update Chat.tsx to use sidebar layout**

Replace entire file content with:

```typescript
import { useState, useEffect } from 'react'
import { ParticipantSidebar } from '../components/ParticipantSidebar'
import { UnifiedChat } from '../components/UnifiedChat'
import { getAuthHeaders, supabase, waitForAuthInitialization } from '../services/auth'

export function Chat() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [activeClones, setActiveClones] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Monitor auth state - redirect if session is lost
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        console.log('[CHAT] Session lost, redirecting to waitlist')
        window.location.href = '/waitlist'
      }
    })

    // Initialize chat session
    initializeSession()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const initializeSession = async () => {
    const controller = new AbortController()

    try {
      // Wait for Supabase to load the session from storage
      await waitForAuthInitialization()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const authHeaders = await getAuthHeaders()
      if ('Authorization' in authHeaders) {
        headers['Authorization'] = authHeaders['Authorization']
        console.log('[CHAT_INIT] Auth header set successfully')
      } else {
        console.warn('[CHAT_INIT] No Authorization header available')
      }

      const response = await fetch('/chat/init', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'god' }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        if (response.status === 401) {
          window.location.href = '/waitlist'
          return
        }
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const session = await response.json()
      setSessionId(session.id)
    } catch (err: any) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Session initialization cancelled')
        return
      }
      setError(err.message || 'Session init error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-white)',
        color: 'var(--color-gray-400)',
      }}>
        <p style={{ fontSize: 'var(--text-lg)' }}>Initializing chat session...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-white)',
        padding: 'var(--space-xl)',
      }}>
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: 'var(--space-2xl)',
          borderRadius: '0.5rem',
          maxWidth: '500px',
        }}>
          <h2 style={{ marginBottom: 'var(--space-base)', fontSize: 'var(--text-lg)' }}>Session Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-white)',
        color: 'var(--color-gray-500)',
      }}>
        <p>Failed to initialize chat session</p>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-white)',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-100)',
        padding: 'var(--space-lg) var(--space-xl)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: '700',
          color: 'var(--color-navy)',
          margin: 0,
        }}>
          Capy Studyroom
        </h1>
      </div>

      {/* Main Layout: Sidebar + Chat */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        <ParticipantSidebar currentUserId="you" activeClones={activeClones} />
        <UnifiedChat sessionId={sessionId} onActiveClonesChange={setActiveClones} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify layout structure**

Check:
- Header shows "Capy Studyroom"
- ParticipantSidebar and UnifiedChat side-by-side
- No mode switching buttons
- activeClones state synced between components

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Chat.tsx
git commit -m "feat: update Chat layout to sidebar + unified chat (remove mode switching)"
```

---

### Task 5: Update ChatMessage to display anonymized hashes

**Files:**
- Modify: `frontend/src/components/ChatMessage.tsx`

- [ ] **Step 1: Import anonymize function and update clone display**

Read the current file first, then update the clone label rendering:

In `frontend/src/components/ChatMessage.tsx`, find the line that displays `sender_id` for clones and update it:

```typescript
import { anonymizeUsername } from '../utils/anonymize'

// ... existing code ...

export function ChatMessage({ role, sender_id, content, reasoning }: ChatMessageProps) {
  const isUser = role === 'user'
  const isCapybara = role === 'capybara'
  const [showReasoning, setShowReasoning] = useState(false)

  // Get display name for sender
  const getDisplayName = () => {
    if (role === 'user') return 'You'
    if (role === 'capybara') return 'Capybara AI'
    if (role === 'clone') return anonymizeUsername(sender_id)
    return sender_id
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 'var(--space-base)',
      animation: 'slideIn 0.3s ease-out',
    }}>
      <div style={{
        maxWidth: '75%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: '500',
          color: isCapybara ? 'var(--color-teal)' : 'var(--color-gray-500)',
          textAlign: isUser ? 'right' : 'left',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {getDisplayName()}
        </div>

        {/* Rest of the component remains the same... */}
```

- [ ] **Step 2: Verify anonymization in messages**

Check:
- User messages still show "You"
- Capybara messages still show "Capybara AI"
- Clone messages show anonymized hash (e.g., "a7f2b9e1")
- Hashes are consistent with sidebar

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ChatMessage.tsx
git commit -m "feat: display anonymized hashes for clone messages in chat"
```

---

## Chunk 5: Testing & Verification

### Task 6: E2E testing (manual verification)

- [ ] **Step 1: Start development server**

```bash
npm run dev
```

Expected: Frontend on port 3000, backend on port 3001

- [ ] **Step 2: Navigate to chat and verify initial state**

1. Go to `http://localhost:3000/chat`
2. Verify:
   - Header shows "Capy Studyroom"
   - Sidebar shows: "You" + "Capybara"
   - Chat area shows "Describe Your Research Goal" prompt
   - No mode switching buttons visible

- [ ] **Step 3: Send a research query**

1. Type: "Find me 3 engineers in their 30s"
2. Send message
3. Verify:
   - Message appears in chat labeled "You"
   - Capybara response appears with "Capybara AI" label
   - Sidebar updates with clone hashes after `session_transition`

- [ ] **Step 4: Send follow-up message**

1. Type: "Here's my pitch..."
2. Send message
3. Verify:
   - Routes to clones (not Capybara)
   - Clone responses appear with anonymized hashes
   - Hashes match sidebar participant list

- [ ] **Step 5: Send @capybara message**

1. Type: "@capybara what patterns do you see?"
2. Send message
3. Verify:
   - Routes to Capybara (not clones)
   - Capybara response appears with reasoning steps

- [ ] **Step 6: Verify sidebar participant display**

1. Check that clones in sidebar match responses in chat
2. Verify hashes are consistent (same clone always same hash)
3. Verify "You" and "Capybara" are always present

- [ ] **Step 7: Commit**

```bash
git add -A  # If any console changes needed
git commit -m "test: verify unified chat sidebar E2E flow"
```

---

## Cleanup (Optional - after implementation)

### Task 7: Remove deprecated components

**Files:**
- Delete: `frontend/src/components/GodMode.tsx`
- Delete: `frontend/src/components/ConversationMode.tsx`

- [ ] **Step 1: Remove deprecated files**

```bash
git rm frontend/src/components/GodMode.tsx frontend/src/components/ConversationMode.tsx
```

- [ ] **Step 2: Verify no imports remain**

```bash
grep -r "GodMode\|ConversationMode" frontend/src --include="*.tsx" --include="*.ts"
```

Expected: No results (zero matches)

- [ ] **Step 3: Commit**

```bash
git commit -m "cleanup: remove deprecated GodMode and ConversationMode components"
```

---

## Summary of Changes

**New files:**
- ✅ `frontend/src/utils/anonymize.ts` - username hashing
- ✅ `frontend/src/components/ParticipantSidebar.tsx` - participant list sidebar
- ✅ `frontend/src/components/UnifiedChat.tsx` - merged chat logic

**Modified files:**
- ✅ `frontend/src/pages/Chat.tsx` - sidebar layout, removed mode switching
- ✅ `frontend/src/components/ChatMessage.tsx` - anonymized clone names

**Removed files (optional):**
- ✅ `frontend/src/components/GodMode.tsx`
- ✅ `frontend/src/components/ConversationMode.tsx`

**Key behaviors:**
- ✅ Single unified chat (no tabs)
- ✅ Sidebar shows "You", "Capybara", active clones with anonymized hashes
- ✅ @capybara routing works
- ✅ Session transitions auto-update sidebar
- ✅ Message labels consistent (You, Capybara AI, anonymized hash)

**Backend changes required:** None (already supports this architecture)

---

## Testing Checklist

- [ ] `anonymizeUsername()` produces deterministic hashes
- [ ] Different usernames produce different hashes
- [ ] ParticipantSidebar displays all participants correctly
- [ ] UnifiedChat handles both initial and group states
- [ ] Chat messages route correctly (@capybara vs default)
- [ ] Session transitions update sidebar
- [ ] E2E flow: init → research query → clone activation → messaging
- [ ] Styling matches design spec (sidebar width, colors, spacing)

