import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

export interface Studyroom {
  id: string
  name: string
  display_name: string | null
  session_id: string | null
  created_at: string
  updated_at: string
}

interface StudyroomSidebarProps {
  studyrooms: Studyroom[]
  activeStudyroomId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function StudyroomSidebar({
  studyrooms,
  activeStudyroomId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: StudyroomSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startEditing = (room: Studyroom) => {
    setEditingId(room.id)
    setEditName(room.display_name ?? room.name)
  }

  const commitRename = () => {
    if (editingId && editName.trim()) {
      trackEvent('studyroom_renamed', { studyroom_id: editingId, new_name: editName.trim() })
      onRename(editingId, editName.trim())
    }
    setEditingId(null)
    setEditName('')
  }

  return (
    <div style={{
      width: '220px',
      backgroundColor: 'var(--color-gray-50)',
      borderRight: '1px solid var(--color-gray-200)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-lg)',
        borderBottom: '1px solid var(--color-gray-200)',
        backgroundColor: 'var(--color-white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{
          fontSize: 'var(--text-xs)',
          fontWeight: '600',
          color: 'var(--color-gray-600)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Studyrooms
        </h3>
        <button
          onClick={() => {
            trackEvent('studyroom_created')
            onCreate()
          }}
          style={{
            background: 'none',
            border: '1px solid var(--color-gray-300)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-gray-600)',
            padding: '2px 8px',
            lineHeight: '1.4',
          }}
          title="New studyroom"
        >
          +
        </button>
      </div>

      {/* Studyroom list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {studyrooms.map((room) => {
          const isActive = room.id === activeStudyroomId
          const isEditing = room.id === editingId

          return (
            <div
              key={room.id}
              onClick={() => {
                if (!isEditing) {
                  trackEvent('studyroom_selected', { studyroom_id: room.id })
                  onSelect(room.id)
                }
              }}
              onDoubleClick={() => {
                trackEvent('studyroom_edit_started', { studyroom_id: room.id })
                startEditing(room)
              }}
              style={{
                padding: 'var(--space-sm) var(--space-base)',
                borderRadius: '0.375rem',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--color-teal)' : 'var(--color-navy)',
                backgroundColor: isActive ? 'var(--color-gray-100)' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-xs)',
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-gray-100)'
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') { setEditingId(null); setEditName('') }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    fontSize: 'var(--text-sm)',
                    border: '1px solid var(--color-teal)',
                    borderRadius: '0.25rem',
                    padding: '2px 4px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    minWidth: 0,
                  }}
                />
              ) : (
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {room.display_name ?? room.name}
                </span>
              )}

              {/* Rename and Delete buttons */}
              {!isEditing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(room)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: 'var(--color-gray-400)',
                      padding: '0 2px',
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                    title="Rename studyroom"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (studyrooms.length > 1) {
                        trackEvent('studyroom_deleted', { studyroom_id: room.id })
                        onDelete(room.id)
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: studyrooms.length > 1 ? 'pointer' : 'not-allowed',
                      fontSize: '11px',
                      color: 'var(--color-gray-400)',
                      padding: '0 2px',
                      opacity: studyrooms.length > 1 ? 0.5 : 0.2,
                      lineHeight: 1,
                    }}
                    title={studyrooms.length > 1 ? 'Delete studyroom' : 'Cannot delete last studyroom'}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
