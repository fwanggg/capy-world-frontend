import { useState, useEffect, useRef, useCallback } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { RespondingBubble } from './RespondingBubble'
import { getAuthHeaders } from '../services/auth'
import { CloneEntry } from '../pages/Chat'
import type { ReasoningStep, ChatMessageData, ChatResponse, RespondingState } from '../types/chat'

interface UnifiedChatProps {
  sessionId: string
  activeClones: CloneEntry[]
  onActiveClonesChange?: (clones: CloneEntry[]) => void
  initialMessages?: any[]
}

export function UnifiedChat({ sessionId, activeClones, onActiveClonesChange, initialMessages }: UnifiedChatProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState<RespondingState>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Hydrate from persisted history when switching studyrooms
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      const hydrated: ChatMessageData[] = initialMessages.map((msg: any, i: number) => ({
        id: msg.id || `hist_${i}`,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: new Date(msg.created_at).getTime(),
        role: msg.role,
        sender_id: msg.sender_id || msg.role,
      }))
      setMessages(hydrated)
    } else {
      setMessages([])
    }
  }, [initialMessages])

  const scrollToBottom = () => {
    const el = messagesEndRef.current
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, loading, responding])

  const handleDonePayload = useCallback((data: ChatResponse) => {
    if (data.ai_responses) {
      const responsesWithReasoning = data.ai_responses.map((r) => ({
        ...r,
        reasoning: r.role === 'capybara' ? data.capybara_reasoning : undefined,
      }))
      setMessages((prev) => [...prev, ...responsesWithReasoning])
    }
    if (data.session_transition) {
      const { clone_ids, clone_names } = data.session_transition
      const newClones: CloneEntry[] = clone_ids.map((id, idx) => ({
        id: String(id),
        name: clone_names[idx] || String(id),
      }))
      onActiveClonesChange?.(newClones)
    }
  }, [onActiveClonesChange])

  const sendStreamingCapybara = useCallback(async (
    requestBody: any,
    headers: Record<string, string>,
    signal: AbortSignal,
  ) => {
    setResponding({ type: 'capybara', reasoning: [] })

    const response = await fetch('/chat/message', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...requestBody, stream: true }),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const jsonStr = trimmed.slice(6)
        try {
          const event = JSON.parse(jsonStr)
          if (event.type === 'reasoning') {
            setResponding((prev) => {
              if (!prev || prev.type !== 'capybara') return prev
              return { ...prev, reasoning: [...prev.reasoning, event.step] }
            })
          } else if (event.type === 'done') {
            handleDonePayload(event as ChatResponse)
          } else if (event.type === 'error') {
            throw new Error(event.error)
          }
        } catch (parseErr: any) {
          if (parseErr.message && !parseErr.message.startsWith('Unexpected')) throw parseErr
        }
      }
    }
  }, [handleDonePayload])

  const handleSendMessage = async (content: string, target?: 'capybara' | 'clones', recipient?: string) => {
    setError(null)
    setLoading(true)

    const controller = new AbortController()

    try {
      if (!content.trim()) throw new Error('Message cannot be empty')

      const userMsg: ChatMessageData = {
        id: `msg_${Date.now()}`,
        content,
        sender: 'user',
        timestamp: Date.now(),
        role: 'user',
        sender_id: 'user',
        recipient,
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
      } else if (target === 'clones') {
        if (recipient === 'all_participants') {
          requestBody.target = 'clones'
        } else if (recipient) {
          const cloneRecord = activeClones.find(c => c.name === recipient)
          if (cloneRecord) {
            requestBody.target_clones = [cloneRecord.id]
          } else {
            requestBody.target_clones = [recipient]
          }
        } else {
          requestBody.target = 'clones'
        }
      }

      // Default: route to Capybara. Only route to clones when explicitly requested (target=clones or target_clones specified)
      const routeToCapybara = target !== 'clones' && !requestBody.target_clones

      if (routeToCapybara) {
        await sendStreamingCapybara(requestBody, headers, controller.signal)
      } else {
        // Clone path: show per-clone responding bubbles (clone.name is anonymous_id)
        const cloneNames = requestBody.target_clones
          ? requestBody.target_clones.map((id: string) => {
              const clone = activeClones.find(c => c.id === id || c.name === id)
              return clone ? clone.name : id
            })
          : activeClones.map(c => c.name)
        setResponding({ type: 'clones', names: cloneNames })

        const response = await fetch('/chat/message', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data: ChatResponse = await response.json()
        handleDonePayload(data)
      }
    } catch (err: any) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err.message || 'An unexpected error occurred')
      console.error('[UNIFIED_CHAT] Error:', err)
    } finally {
      setLoading(false)
      setResponding(null)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      minWidth: 0,
      backgroundColor: 'var(--color-white)',
    }}>
      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 'var(--space-2xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        minHeight: 0,
      }}>
        {/* Initial state prompt */}
        {messages.length === 0 && activeClones.length === 0 && !error && (
          <div style={{
            width: '100%',
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
            recipient={msg.recipient}
            activeClones={activeClones}
          />
        ))}

        {/* Responding bubbles */}
        {responding?.type === 'capybara' && (
          <RespondingBubble
            entityType="capybara"
            displayName="Capybara AI"
            reasoning={responding.reasoning}
            isStreaming={true}
          />
        )}
        {responding?.type === 'clones' && responding.names.map((name) => (
          <RespondingBubble
            key={name}
            entityType="clone"
            displayName={name}
          />
        ))}

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
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={loading}
        placeholder={activeClones.length > 0 ? "Ask your clones a question..." : "Describe your research goal..."}
        activeClones={activeClones.map(c => c.name)}
      />
    </div>
  )
}
