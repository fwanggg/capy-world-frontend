import React, { useState } from 'react'

interface ChatInputProps {
  onSend: (message: string, targetClones?: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      // Parse @mentions
      const mentions = (input.match(/@\w+/g) || []).map((m) => m.slice(1))
      onSend(input, mentions.length > 0 ? mentions : undefined)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderTop: '1px solid #ccc' }}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type your message... (use @mention for specific clones)'}
        disabled={disabled}
        style={{
          flex: 1,
          padding: '0.75rem',
          borderRadius: '0.25rem',
          border: '1px solid #ccc',
          fontFamily: 'inherit',
          fontSize: '1rem',
        }}
        rows={2}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
          opacity: disabled || !input.trim() ? 0.5 : 1,
          fontSize: '1rem',
        }}
      >
        Send
      </button>
    </div>
  )
}
