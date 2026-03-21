'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuthClient } from '@/hooks/useAuthClient'
import { SignInDialog } from '@/components/SignInDialog'
import type { User } from '@supabase/supabase-js'

function getUserDisplay(user: User) {
  const meta = user.user_metadata as Record<string, string> | undefined
  const name = meta?.full_name || meta?.name || meta?.user_name
  const displayName = name || user.email?.split('@')[0] || 'User'
  const avatarUrl = meta?.avatar_url || meta?.picture
  return { displayName, avatarUrl }
}

interface UserMenuProps {
  /** Optional className for the container (e.g. for nav-specific styling) */
  className?: string
  /** Show name next to avatar on button (default: true on md+) */
  showName?: boolean
}

export function UserMenu({ className = '', showName = true }: UserMenuProps) {
  const { user, loading, signOut } = useAuthClient()
  const [signInOpen, setSignInOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (!showMenu) return
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (!document.getElementById('user-menu-container')?.contains(target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showMenu])

  if (loading) return null

  if (!user) {
    return (
      <>
        <button
          onClick={() => setSignInOpen(true)}
          className={`px-4 py-1.5 bg-primary-container text-on-primary-container font-bold rounded-lg hover:brightness-110 transition-all text-xs flex items-center gap-1.5 ${className}`}
        >
          <span className="material-symbols-outlined text-sm">login</span>
          Sign In
        </button>
        <SignInDialog isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
      </>
    )
  }

  const { displayName, avatarUrl } = getUserDisplay(user)

  return (
    <div id="user-menu-container" className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={28}
            height={28}
            className="rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="material-symbols-outlined text-lg text-on-surface-variant">account_circle</span>
        )}
        {showName && (
          <span className="text-sm font-medium text-on-surface max-w-32 truncate hidden sm:inline">
            {displayName}
          </span>
        )}
      </button>
      {showMenu && (
        <div className="absolute top-full right-0 mt-2 bg-surface-container border border-outline-variant/20 rounded-lg shadow-lg min-w-48 overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={36}
                height={36}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="material-symbols-outlined text-2xl text-on-surface-variant">account_circle</span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">{displayName}</p>
              {user.email && (
                <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              signOut()
              setShowMenu(false)
            }}
            className="w-full text-left px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors text-sm font-body flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
