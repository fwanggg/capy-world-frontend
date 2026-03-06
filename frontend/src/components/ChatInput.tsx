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
    <div style={{
      display: 'flex',
      gap: 'var(--space-base)',
      padding: 'var(--space-lg) var(--space-xl)',
      borderTop: '1px solid var(--color-gray-200)',
      backgroundColor: 'var(--color-white)',
    }}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type your message... (use @mention for specific clones)'}
        disabled={disabled}
        style={{
          flex: 1,
          padding: 'var(--space-base)',
          borderRadius: '0.375rem',
          border: '1px solid var(--color-gray-200)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          fontColor: 'var(--color-navy)',
          resize: 'vertical',
          transition: 'all var(--transition-fast)',
          minHeight: '3rem',
          maxHeight: '120px',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-teal)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-gray-200)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        rows={2}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        style={{
          padding: 'var(--space-base) var(--space-lg)',
          backgroundColor: disabled || !input.trim() ? 'var(--color-gray-300)' : 'var(--color-teal)',
          color: 'var(--color-white)',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
          opacity: disabled || !input.trim() ? 0.6 : 1,
          fontWeight: '600',
          fontSize: 'var(--text-base)',
          transition: 'all var(--transition-fast)',
          whiteSpace: 'nowrap',
        }}
        onMouseOver={(e) => {
          if (!disabled && input.trim()) {
            e.currentTarget.style.backgroundColor = 'var(--color-teal-light)'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-teal)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        Send
      </button>
    </div>
  )
}
