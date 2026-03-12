import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatMessage } from '../ChatMessage'

describe('ChatMessage recipient display', () => {
  it('displays recipient in bold white (user bubble) before message content', () => {
    const { container } = render(
      <ChatMessage
        role="user"
        sender_id="user"
        content="grab me personas"
        recipient="capybara"
      />
    )

    // Find all span elements and look for one that contains @capybara
    const allSpans = container.querySelectorAll('span')
    let recipientSpan: Element | null = null

    for (const span of allSpans) {
      if (span.textContent === '@capybara') {
        recipientSpan = span
        break
      }
    }

    expect(recipientSpan).toBeTruthy()
    expect(recipientSpan?.textContent).toBe('@capybara')
    // User bubble: recipient is white bold, no separate background
    const style = (recipientSpan as HTMLElement)?.style
    expect(style?.fontWeight).toBe('bold')
    expect(style?.color).toBe('var(--color-white)')
    expect(screen.getByText('grab me personas')).toBeInTheDocument()
  })

  it('does not display recipient span when recipient is undefined', () => {
    const { container } = render(
      <ChatMessage
        role="user"
        sender_id="user"
        content="test message"
      />
    )

    // Should not have any span with @ prefix
    const allSpans = container.querySelectorAll('span')
    const hasRecipientSpan = Array.from(allSpans).some(span =>
      span.textContent?.startsWith('@')
    )

    expect(hasRecipientSpan).toBe(false)
    expect(screen.getByText('test message')).toBeInTheDocument()
  })

  it('displays @all_participants recipient', () => {
    const { container } = render(
      <ChatMessage
        role="clone"
        sender_id="clone-1"
        content="what do you think"
        recipient="all_participants"
      />
    )

    // Find span with @all_participants text
    const allSpans = container.querySelectorAll('span')
    let recipientSpan: Element | null = null

    for (const span of allSpans) {
      if (span.textContent === '@all_participants') {
        recipientSpan = span
        break
      }
    }

    expect(recipientSpan).toBeTruthy()
    expect(recipientSpan?.textContent).toBe('@all_participants')
    expect(screen.getByText('what do you think')).toBeInTheDocument()
  })

  it('does not render whitespace-only recipient', () => {
    const { container } = render(
      <ChatMessage
        role="user"
        sender_id="user"
        content="test"
        recipient="  "  // Whitespace only
      />
    )

    // Should not display due to trim() check
    const allSpans = container.querySelectorAll('span')
    const hasRecipientSpan = Array.from(allSpans).some(span =>
      span.textContent?.startsWith('@')
    )

    expect(hasRecipientSpan).toBe(false)
  })
})
