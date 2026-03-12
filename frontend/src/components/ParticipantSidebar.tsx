import { anonymizeUsername } from '../utils/anonymize'
import { CloneEntry } from '../pages/Chat'

interface Participant {
  id: string // 'you', 'capybara', or clone ID
  type: 'user' | 'capybara' | 'clone'
  displayName?: string // For 'you' and 'capybara', explicit label
}

interface ParticipantSidebarProps {
  currentUserId: string
  activeClones: CloneEntry[] // List of { id, name } for active clones
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
      id: clone.id,
      type: 'clone' as const,
      displayName: anonymizeUsername(clone.name)
    }))
  ]

  return (
    <div style={{
      width: '200px',
      backgroundColor: 'var(--color-gray-50)',
      borderLeft: '1px solid var(--color-gray-200)',
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
