import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChatInput } from '../ChatInput'

describe('ChatInput recipient extraction', () => {
  it('extracts @capybara recipient and strips from message', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} activeClones={[]} />)

    const textarea = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(textarea, { target: { value: '@capybara grab me personas' } })
    fireEvent.click(screen.getByText('Send'))

    expect(onSend).toHaveBeenCalledWith(
      'grab me personas',    // Clean message
      'capybara',            // Route to capybara
      'capybara'             // Recipient
    )
  })

  it('extracts @all_participants and routes to clones', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} activeClones={['eng', 'designer']} />)

    const textarea = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(textarea, { target: { value: '@all_participants what do you think' } })
    fireEvent.click(screen.getByText('Send'))

    expect(onSend).toHaveBeenCalledWith(
      'what do you think',
      'clones',
      'all_participants'
    )
  })

  it('extracts specific clone name and routes', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} activeClones={['engineer', 'designer']} />)

    const textarea = screen.getByPlaceholderText(/Type your message/)
    fireEvent.change(textarea, { target: { value: '@engineer test pitch' } })
    fireEvent.click(screen.getByText('Send'))

    expect(onSend).toHaveBeenCalledWith(
      'test pitch',
      'clones',
      'engineer'
    )
  })

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
})
