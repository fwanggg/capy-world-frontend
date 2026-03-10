import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConversationMode } from '../ConversationMode'

// Mock the auth service
vi.mock('../../services/auth', () => ({
  getAuthHeaders: vi.fn(() => Promise.resolve({})),
}))

describe('Message recipient display integration', () => {
  beforeEach(() => {
    // Mock fetch for all tests
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            user_message: {
              id: 'msg_1',
              content: 'test message',
              sender: 'user',
              timestamp: Date.now(),
              role: 'user',
              sender_id: 'you',
            },
            ai_responses: [
              {
                id: 'ai_1',
                content: 'response content',
                sender: 'ai',
                timestamp: Date.now(),
                role: 'capybara',
                sender_id: 'capybara-ai',
              },
            ],
          }),
      })
    ) as any
  })

  it('displays recipient in message when sent with @mention', async () => {
    const { container } = render(
      <ConversationMode sessionId="session_123" activeClones={['eng']} />
    )

    const textarea = screen.getByPlaceholderText(/Ask your clones/)
    const sendButton = screen.getByText('Send')

    // Send message to @capybara
    fireEvent.change(textarea, { target: { value: '@capybara test request' } })
    fireEvent.click(sendButton)

    // Message should appear with recipient displayed
    await waitFor(() => {
      expect(screen.getByText('@capybara')).toBeInTheDocument()
      expect(screen.getByText('test request')).toBeInTheDocument()
    })
  })

  it('routes message to capybara with correct target when @capybara is used', async () => {
    render(<ConversationMode sessionId="session_123" activeClones={[]} />)

    const textarea = screen.getByPlaceholderText(/Ask your clones/)
    fireEvent.change(textarea, { target: { value: '@capybara analyze my market' } })
    fireEvent.click(screen.getByText('Send'))

    // Backend should receive message with target='capybara'
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/chat/message',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"target":"capybara"'),
        })
      )
    })

    // UI should show recipient
    expect(screen.getByText('@capybara')).toBeInTheDocument()
  })

  it('displays @all_participants when broadcast to clones', async () => {
    render(
      <ConversationMode sessionId="session_123" activeClones={['eng', 'designer']} />
    )

    const textarea = screen.getByPlaceholderText(/Ask your clones/)
    fireEvent.change(textarea, { target: { value: '@all_participants what do you think?' } })
    fireEvent.click(screen.getByText('Send'))

    // Recipient should appear in message
    await waitFor(() => {
      expect(screen.getByText('@all_participants')).toBeInTheDocument()
      expect(screen.getByText('what do you think?')).toBeInTheDocument()
    })
  })

  it('message without @mention routes to default without showing recipient', async () => {
    render(
      <ConversationMode sessionId="session_123" activeClones={['eng']} />
    )

    const textarea = screen.getByPlaceholderText(/Ask your clones/)
    fireEvent.change(textarea, { target: { value: 'regular message' } })
    fireEvent.click(screen.getByText('Send'))

    // Should not show recipient indicator
    await waitFor(() => {
      expect(screen.getByText('regular message')).toBeInTheDocument()
    })

    // Should not have @ symbol for recipient
    const recipientElements = screen.queryAllByText(/^@/)
    expect(recipientElements).toHaveLength(0)
  })

  it('displays specific clone name as recipient', async () => {
    render(
      <ConversationMode sessionId="session_123" activeClones={['engineer', 'designer']} />
    )

    const textarea = screen.getByPlaceholderText(/Ask your clones/)
    fireEvent.change(textarea, { target: { value: '@engineer what is your take?' } })
    fireEvent.click(screen.getByText('Send'))

    // Should show specific recipient
    await waitFor(() => {
      expect(screen.getByText('@engineer')).toBeInTheDocument()
      expect(screen.getByText('what is your take?')).toBeInTheDocument()
    })
  })

  it('clears input after sending message', async () => {
    render(
      <ConversationMode sessionId="session_123" activeClones={['eng']} />
    )

    const textarea = screen.getByPlaceholderText(/Ask your clones/) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: '@capybara test message' } })
    fireEvent.click(screen.getByText('Send'))

    // Input should be cleared after sending
    await waitFor(() => {
      expect(textarea.value).toBe('')
    })
  })

  it('preserves message content while stripping @mention', async () => {
    render(
      <ConversationMode sessionId="session_123" activeClones={['eng']} />
    )

    const textarea = screen.getByPlaceholderText(/Ask your clones/)
    fireEvent.change(textarea, { target: { value: '@capybara this is my actual message' } })
    fireEvent.click(screen.getByText('Send'))

    // Should show the message content without the @mention
    await waitFor(() => {
      expect(screen.getByText('@capybara')).toBeInTheDocument()
      expect(screen.getByText('this is my actual message')).toBeInTheDocument()
    })

    // Should not have the full text with @mention
    expect(screen.queryByText('@capybara this is my actual message')).not.toBeInTheDocument()
  })

  it('handles multiple messages in conversation with different recipients', async () => {
    render(
      <ConversationMode sessionId="session_123" activeClones={['eng', 'designer']} />
    )

    const textarea = screen.getByPlaceholderText(/Ask your clones/) as HTMLTextAreaElement

    // First message to capybara
    fireEvent.change(textarea, { target: { value: '@capybara first message' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText('@capybara')).toBeInTheDocument()
    })

    // Second message to all participants
    fireEvent.change(textarea, { target: { value: '@all_participants second message' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText('@all_participants')).toBeInTheDocument()
    })

    // Both recipients should be visible
    const recipientElements = screen.getAllByText(/^@/)
    expect(recipientElements.length).toBeGreaterThanOrEqual(2)
  })
})
