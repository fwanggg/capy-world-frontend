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
  recipient?: string
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

interface GodModeProps {
  sessionId: string
  onEnterConversation: (clones: string[]) => void
}

export function GodMode({ sessionId, onEnterConversation }: GodModeProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchingPersonas, setSearchingPersonas] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = async (content: string, target?: 'capybara' | 'clones', recipient?: string) => {
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
        sender_id: 'user',
        recipient: recipient
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

      console.log('[GODMODE] Sending message:', {
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

      console.log('[GODMODE] Response status:', response.status)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      console.log('[GODMODE] Response data:', {
        userMessage: data.user_message,
        aiResponses: data.ai_responses?.map((r: any) => ({ role: r.role, sender_id: r.sender_id })),
        sessionTransition: data.session_transition
      })

      // Add AI responses with reasoning (if from Capybara)
      if (data.ai_responses) {
        const responsesWithReasoning = data.ai_responses.map((response) => ({
          ...response,
          // Attach reasoning to Capybara responses
          reasoning: response.role === 'capybara' ? data.capybara_reasoning : undefined
        }))
        setMessages((prev) => [...prev, ...responsesWithReasoning])
      }

      // If session_transition is present, auto-transition to conversation mode
      if (data.session_transition) {
        const { clone_names } = data.session_transition
        onEnterConversation(clone_names)
      }
    } catch (err: any) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Message request cancelled')
        return
      }
      const errorMsg = err.message || 'An unexpected error occurred'
      setError(errorMsg)
      console.error('GodMode error:', err)
    } finally {
      setLoading(false)
      setSearchingPersonas(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-white)' }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-2xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}>
        {messages.length === 0 && !error && (
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
              God Mode
            </h3>
            <p style={{
              color: 'var(--color-gray-600)',
              fontSize: 'var(--text-base)',
              margin: '0.5rem 0 0 0',
            }}>
              Talk to Capybara AI to plan your research. Start by describing what you'd like to research. For example: "I want to test my sales pitch on game developers."
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            sender_id={msg.sender_id}
            content={msg.content}
            reasoning={msg.reasoning}
            recipient={msg.recipient}
          />
        ))}
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
      <ChatInput onSend={handleSendMessage} disabled={loading} placeholder="Describe your research goal..." activeClones={[]} />
    </div>
  )
}
