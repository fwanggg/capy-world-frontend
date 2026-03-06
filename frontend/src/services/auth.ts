export async function signInWithGoogle(token: string) {
  try {
    const response = await fetch('http://localhost:3001/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()

    if (data.user_id) {
      // Save session
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('session_token', data.session_token)
      localStorage.setItem('email', data.email)
      localStorage.setItem('approved', data.approved ? 'true' : 'false')

      return data
    } else {
      throw new Error(data.error || 'Auth failed')
    }
  } catch (error) {
    console.error('Auth error:', error)
    throw error
  }
}

export function getAuthHeaders() {
  const userId = localStorage.getItem('user_id')
  return userId ? { 'x-user-id': userId } : {}
}

export function isLoggedIn() {
  return !!localStorage.getItem('user_id')
}

export function isApproved() {
  return localStorage.getItem('approved') === 'true'
}

export function logout() {
  localStorage.removeItem('user_id')
  localStorage.removeItem('session_token')
  localStorage.removeItem('email')
  localStorage.removeItem('approved')
}
