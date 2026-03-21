'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

export function useAuthClient() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Supabase not configured'
      setError(msg)
      setLoading(false)
      console.error('[Auth]', msg)
      return
    }

    let mounted = true

    const initAuth = async () => {
      try {
        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (mounted) {
          setUser(session?.user || null)
        }
      } catch (err) {
        console.error('[Auth] Failed to get session:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Auth error')
        }
      }
    }

    initAuth().finally(() => {
      if (mounted) setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async (redirectTo?: string) => {
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo ?? (typeof window !== 'undefined' ? window.location.href : '/results'),
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, loading, error, signInWithGoogle, signOut }
}
