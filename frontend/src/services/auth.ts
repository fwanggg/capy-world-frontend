import { createClient, User } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Validate environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function signInWithGoogle() {
  try {
    // Use Supabase OAuth flow to redirect to Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return null
    return data.session.access_token
  } catch (error) {
    console.error('Failed to get auth token:', error)
    return null
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('[AUTH] getUser error:', error.message, error.status)
      return null
    }
    if (!data.user) return null
    return data.user
  } catch (error) {
    console.error('[AUTH] Failed to get current user:', error)
    return null
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null)
  })
}

export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

export async function getAuthHeaders(): Promise<{ Authorization: string } | {}> {
  const token = await getAuthToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function isApproved(): Promise<boolean> {
  // In the new system, approval is checked on the backend via requireApproval middleware
  // For now, this always returns true - the server will enforce approval checks
  return true
}
