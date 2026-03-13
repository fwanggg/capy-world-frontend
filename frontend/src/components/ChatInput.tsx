import React, { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (message: string, target?: 'capybara' | 'clones', recipient?: string) => void
  disabled?: boolean
  placeholder?: string
  activeClones?: string[]
}

interface MentionOption {
  name: string
  label: string
}

export function ChatInput({ onSend, disabled, placeholder, activeClones = [] }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const mentionOptions: MentionOption[] = [
    { name: 'capybara', label: 'Capybara AI (Orchestrator)' },
    ...(activeClones.length > 0 ? [{ name: 'all_participants', label: 'All Participants' }] : []),
    ...activeClones.map(clone => ({ name: clone, label: `@${clone}` }))
  ]

  const filteredMentions = mentionQuery.length > 0
    ? mentionOptions.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : mentionOptions

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setInput(text)

    // Check if user is typing a mention
    const lastAtIndex = text.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const textAfterAt = text.substring(lastAtIndex + 1)
      // Only show mentions if user hasn't typed a space after @
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt)
        setShowMentions(true)
        setSelectedMentionIndex(0)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (mentionName: string) => {
    const lastAtIndex = input.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const beforeMention = input.substring(0, lastAtIndex)
      const newInput = beforeMention + '@' + mentionName + ' '
      setInput(newInput)
      setShowMentions(false)
      setMentionQuery('')
      // Focus textarea and move cursor to end
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.selectionStart = newInput.length
          textareaRef.current.selectionEnd = newInput.length
        }
      }, 0)
    }
  }

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

  const handleSend = () => {
    if (input.trim()) {
      const { message, recipient } = extractRecipient(input.trim())

      if (recipient === 'capybara') {
        // Route to Capybara AI
        onSend(message, 'capybara', 'capybara')
      } else if (recipient === 'all_participants') {
        // Route to all clones
        onSend(message, 'clones', 'all_participants')
      } else if (recipient) {
        // Route to specific clone by name
        onSend(message, 'clones', recipient)
      } else {
        // Default: route to Capybara (no mention = Capybara)
        onSend(message)
      }

      setInput('')
      setShowMentions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIndex((prev) => (prev + 1) % filteredMentions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredMentions[selectedMentionIndex]) {
          insertMention(filteredMentions[selectedMentionIndex].name)
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    setSelectedMentionIndex(0)
  }, [mentionQuery])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      padding: 'var(--space-lg) var(--space-xl)',
      borderTop: '1px solid var(--color-gray-200)',
      backgroundColor: 'var(--color-white)',
      flexShrink: 0,
      position: 'relative',
      width: '100%',
      minWidth: 0,
    }}>
      {/* Mention autocomplete dropdown */}
      {showMentions && filteredMentions.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 'var(--space-lg)',
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-gray-200)',
          borderRadius: '0.5rem',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 10,
          minWidth: '250px',
          marginBottom: 'var(--space-sm)',
        }}>
          {filteredMentions.map((option, index) => (
            <div
              key={option.name}
              onClick={() => insertMention(option.name)}
              style={{
                padding: 'var(--space-sm) var(--space-lg)',
                backgroundColor: index === selectedMentionIndex ? 'var(--color-gray-50)' : 'transparent',
                cursor: 'pointer',
                borderBottom: index < filteredMentions.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={() => setSelectedMentionIndex(index)}
            >
              <div style={{ fontWeight: '500', color: 'var(--color-navy)' }}>
                @{option.name}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>
                {option.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: 'var(--space-base)',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type your message... (default: Capybara; use @ to mention participants)'}
          disabled={disabled}
          style={{
            flex: 1,
            padding: 'var(--space-base)',
            borderRadius: '0.375rem',
            border: '1px solid var(--color-gray-200)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-navy)',
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
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-gray-400)',
        margin: 0,
        fontStyle: 'italic',
      }}>
        Tip: Type @ to mention (↑↓ to navigate, Enter to select)
      </p>
    </div>
  )
}
