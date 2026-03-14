"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

interface ProtectedRouteProps {
  component: React.ReactNode
}

// Persistent logging that survives page redirects
function logPersistent(level: 'log' | 'error' | 'warn', ...args: any[]) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] ${args.join(' ')}`

  // Log to console
  console[level](...args)

  // Also save to localStorage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]')
    logs.push({ level, timestamp, message })
    // Keep last 50 entries
    if (logs.length > 50) logs.shift()
    localStorage.setItem('auth_debug_logs', JSON.stringify(logs))
  } catch (e) {
    // Silently fail if localStorage is not available
  }
}

export function ProtectedRoute({ component }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        // Retry getting session up to 10 times (same as AuthCallback)
        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
          const { data: { session }, error } = await supabase.auth.getSession()

          logPersistent('log', `[PROTECTED_ROUTE] Attempt ${attempts + 1}/${maxAttempts}: hasSession=${!!session}, userId=${session?.user?.id}`)

          if (session?.user) {
            logPersistent('log', `[PROTECTED_ROUTE] ✓ Session found, authorizing user`)
            if (isMounted) {
              setIsAuthorized(true)
            }
            return
          }

          attempts++
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }

        // No session found after retries
        if (isMounted) {
          const errorMsg = `No session found after ${maxAttempts} attempts. User not authenticated.`
          logPersistent('error', `[PROTECTED_ROUTE] ❌ CRITICAL:`, errorMsg)
          logPersistent('error', `[PROTECTED_ROUTE] Check localStorage.getItem('auth_debug_logs') in console for full history`)
          setDebugError(errorMsg)
          setIsAuthorized(false)
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        logPersistent('error', `[PROTECTED_ROUTE] ❌ Unexpected error:`, errMsg)
        if (isMounted) {
          setDebugError(errMsg)
          setIsAuthorized(false)
        }
      }
    }

    checkAuth()

    // Also listen for auth changes after initial check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          console.log('[PROTECTED_ROUTE] Auth state changed:', {
            event,
            hasSession: !!session,
            userId: session?.user?.id
          })
          setIsAuthorized(!!session?.user)
        }
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  if (isAuthorized === null) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  if (!isAuthorized) {
    if (debugError) {
      return (
        <div style={{
          padding: '2rem',
          maxWidth: '600px',
          margin: '2rem auto',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '0.5rem',
          color: '#991b1b',
        }}>
          <h2>⚠️ Authentication Failed</h2>
          <p><strong>{debugError}</strong></p>
          <p>Redirecting to login in 3 seconds...</p>
          <p style={{ fontSize: '0.875rem', marginTop: '1rem', color: '#7f1d1d' }}>
            Debug info: Open Developer Tools (F12) → Console → paste this to see logs:<br/>
            <code>JSON.stringify(JSON.parse(localStorage.getItem('auth_debug_logs')), null, 2)</code>
          </p>
        </div>
      )
    }

    setTimeout(() => router.replace("/waitlist"), 3000);

    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Redirecting to login...
      </div>
    );
  }

  return component
}
