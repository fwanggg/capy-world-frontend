# Supabase Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate authentication from custom manual system to Supabase Auth with Google OAuth, maintaining existing approval workflow.

**Architecture:** Backend verifies Supabase JWTs + checks approval status. Frontend uses Supabase SDK with Google One-Tap sign-in. Session managed automatically by Supabase.

**Tech Stack:** Supabase Auth SDK, @supabase/supabase-js, Google OAuth 2.0, JWT verification

---

## Task 1: Configure Supabase for Google OAuth

**Files:**
- Modify: `supabase/config.toml`
- Modify: `.env`

**Step 1: Add Google OAuth configuration to config.toml**

Open `supabase/config.toml` and add/update the Google provider section:

```toml
[auth.external.google]
enabled = true
client_id = "YOUR_GOOGLE_CLIENT_ID"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

**Step 2: Set environment variable in .env**

Add to `.env`:
```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Note:** Get `YOUR_GOOGLE_CLIENT_ID` and `your_google_client_secret` from Google Cloud Console (OAuth 2.0 credentials). Ensure redirect URI is configured in Google Cloud.

**Step 3: Verify Supabase local configuration**

Run: `supabase status`

Expected output includes Google OAuth enabled in auth config.

**Step 4: Commit**

```bash
git add supabase/config.toml .env
git commit -m "config: enable Supabase Google OAuth provider"
```

---

## Task 2: Create Backend JWT Verification Utility

**Files:**
- Create: `backend/src/utils/jwt.ts`

**Step 1: Write JWT verification utility**

```typescript
import { jwtVerify } from 'jose';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'your-supabase-jwt-secret';

interface JWTPayload {
  sub: string // user ID
  email?: string
  aud?: string
  exp?: number
  iat?: number
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '')

    // Use Supabase's JWT secret (available in Supabase project settings)
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET)

    const verified = await jwtVerify(cleanToken, secret)
    return verified.payload as JWTPayload
  } catch (error) {
    console.error('[JWT] Verification failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}

export function extractUserIdFromJWT(payload: JWTPayload): string {
  return payload.sub
}
```

**Step 2: Install jose package**

Run: `npm install jose --workspace=backend`

Expected: Package installed successfully.

**Step 3: Verify file created**

Run: `ls -la backend/src/utils/jwt.ts`

Expected: File exists.

**Step 4: Commit**

```bash
git add backend/src/utils/jwt.ts package.json package-lock.json
git commit -m "feat: add JWT verification utility for Supabase tokens"
```

---

## Task 3: Update Backend Auth Middleware

**Files:**
- Modify: `backend/src/middleware/auth.ts`

**Step 1: Read current auth middleware**

Current file uses x-user-id header. Replace entire file:

```typescript
import { Request, Response, NextFunction } from 'express'
import { verifyJWT, extractUserIdFromJWT } from '../utils/jwt'
import { supabase } from 'shared'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization']

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix
    const payload = await verifyJWT(token)

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userId = extractUserIdFromJWT(payload)
    req.userId = userId
    req.userEmail = payload.email

    next()
  } catch (error) {
    console.error('[AUTH] Middleware error:', error instanceof Error ? error.message : String(error))
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

export async function requireApproval(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select('approved')
      .eq('id', req.userId)
      .single()

    if (error || !user) {
      console.log('[APPROVAL] User not found in app_users:', req.userId)
      // User will be created on first chat init, allow to proceed to show pending approval UI
      return next()
    }

    if (!user.approved) {
      return res.status(403).json({ error: 'Pending approval' })
    }

    next()
  } catch (error) {
    console.error('[APPROVAL] Check failed:', error instanceof Error ? error.message : String(error))
    return res.status(500).json({ error: 'Approval check failed' })
  }
}
```

**Step 2: Verify syntax**

Run: `npx tsc --noEmit backend/src/middleware/auth.ts`

Expected: No errors.

**Step 3: Commit**

```bash
git add backend/src/middleware/auth.ts
git commit -m "refactor: update auth middleware to use Supabase JWT verification"
```

---

## Task 4: Update Backend Routes - Chat Init

**Files:**
- Modify: `backend/src/routes/chat.ts:40-102` (POST /chat/init)

**Step 1: Update the chat init route to use JWT userId**

Replace the POST /chat/init handler:

```typescript
router.post('/init', async (req: AuthRequest, res: Response) => {
  try {
    const { mode } = req.body
    // User ID comes from JWT (set by requireAuth middleware)
    const userIdFromJWT = req.userId!

    // Convert to UUID format for database compatibility
    const userId = userHeaderToUUID(userIdFromJWT)

    // Validate that mode is provided
    if (!mode || !['god', 'conversation'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Must be "god" or "conversation"' })
    }

    // In development mode, skip approval check and ensure user exists
    const isDev = process.env.NODE_ENV === 'development' || process.env.DEV === 'true'

    if (isDev) {
      // Auto-create user if doesn't exist
      const { error: userError } = await supabase.from('app_users').upsert({
        id: userId,
        approved: true,
        email: req.userEmail || `${userIdFromJWT}@dev.local`,
        google_id: userIdFromJWT,
      }, { onConflict: 'id' })
      if (userError) {
        console.log('[INIT] User upsert error:', userError.message)
      }
    } else {
      // Production: ensure user exists in app_users
      const { data: existingUser, error: userError } = await supabase
        .from('app_users')
        .select('id')
        .eq('id', userId)
        .single()

      if (userError || !existingUser) {
        // First login: create user with approved: false
        const { error: createError } = await supabase.from('app_users').insert({
          id: userId,
          approved: false,
          email: req.userEmail || `${userIdFromJWT}@example.com`,
          google_id: userIdFromJWT,
        })
        if (createError) {
          console.error('[INIT] Failed to create user:', createError.message)
        }
      }
    }

    // Create session
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        mode,
        active_clones: [],
        metadata: { thread_id: `session_${Date.now()}` },
      })
      .select()
      .single()

    if (error) {
      console.error('[INIT] Session creation error:', error)
      throw error
    }

    console.log(`[INIT] Created session ${session.id} for user ${userId}`)
    res.json(session)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Chat init error:', errorMsg, error)
    res.status(500).json({ error: 'Failed to initialize chat', details: errorMsg })
  }
})
```

**Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit backend/src/routes/chat.ts`

Expected: No errors.

**Step 3: Commit**

```bash
git add backend/src/routes/chat.ts
git commit -m "refactor: update chat init route to use Supabase JWT userId"
```

---

## Task 5: Update Backend Routes - Chat Message

**Files:**
- Modify: `backend/src/routes/chat.ts:110-150` (POST /chat/message userId extraction)

**Step 1: Update POST /chat/message to use JWT userId**

Find the line:
```typescript
const userHeader = req.userId!
const userId = userHeaderToUUID(userHeader)
```

Replace with:
```typescript
// User ID comes from JWT via requireAuth middleware
const userIdFromJWT = req.userId!
const userId = userHeaderToUUID(userIdFromJWT)
```

Rest of the function stays the same (routing logic, message handling, etc.)

**Step 2: Verify syntax**

Run: `npx tsc --noEmit backend/src/routes/chat.ts`

Expected: No errors.

**Step 3: Commit**

```bash
git add backend/src/routes/chat.ts
git commit -m "refactor: use JWT userId in chat message route"
```

---

## Task 6: Update Backend User Profile Endpoint

**Files:**
- Modify: `backend/src/index.ts:33-55` (GET /user/profile)

**Step 1: Update the endpoint to use JWT userId**

Replace the GET /user/profile handler:

```typescript
app.get('/user/profile', async (req: AuthRequest, res: Response) => {
  try {
    // User ID comes from Authorization header (verified by middleware if needed)
    const userIdFromJWT = req.headers['x-user-id'] as string

    // For now, using header fallback - in full migration this would come from JWT
    if (!userIdFromJWT) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const userId = userHeaderToUUID(userIdFromJWT)

    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    res.json(user)
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})
```

**Note:** This endpoint currently uses header for backward compatibility. Will be fully updated in Task 10.

**Step 2: Commit**

```bash
git add backend/src/index.ts
git commit -m "refactor: update profile endpoint for JWT compatibility"
```

---

## Task 7: Update Frontend Auth Service

**Files:**
- Create: `frontend/src/services/auth.ts` (rewrite)

**Step 1: Rewrite entire auth service using Supabase SDK**

```typescript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Scopes handled automatically: openid, email, profile
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
    if (error || !data.user) return null
    return data.user
  } catch (error) {
    console.error('Failed to get current user:', error)
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

export function onAuthStateChange(callback: (user: any) => void) {
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
```

**Step 2: Verify imports work**

Run: `npx tsc --noEmit frontend/src/services/auth.ts`

Expected: No errors.

**Step 3: Commit**

```bash
git add frontend/src/services/auth.ts
git commit -m "refactor: rewrite auth service using Supabase SDK"
```

---

## Task 8: Create Auth Callback Page

**Files:**
- Create: `frontend/src/pages/AuthCallback.tsx`

**Step 1: Create callback handler page**

```typescript
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/auth'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL (Supabase stores it automatically)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (session?.user) {
          console.log('[AUTH_CALLBACK] User authenticated:', session.user.email)
          // Redirect to chat
          navigate('/chat')
        } else {
          console.log('[AUTH_CALLBACK] No session found')
          navigate('/waitlist')
        }
      } catch (error) {
        console.error('[AUTH_CALLBACK] Error:', error)
        navigate('/waitlist')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-gray-50)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Authenticating...</h2>
        <p>Please wait while we complete your sign-in.</p>
      </div>
    </div>
  )
}
```

**Step 2: Verify file created**

Run: `ls -la frontend/src/pages/AuthCallback.tsx`

Expected: File exists.

**Step 3: Commit**

```bash
git add frontend/src/pages/AuthCallback.tsx
git commit -m "feat: add auth callback page for OAuth redirect"
```

---

## Task 9: Update Frontend Routes

**Files:**
- Modify: `frontend/src/App.tsx` (or main routing file)

**Step 1: Add AuthCallback route**

Add this route to your Routes:

```typescript
<Route path="/auth/callback" element={<AuthCallback />} />
```

Make sure it's before the protected routes.

**Step 2: Update waitlist/signup to use new auth**

Update the Waitlist component to use the new sign-in:

```typescript
import { signInWithGoogle } from '../services/auth'

export function Waitlist() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
      // Supabase handles redirect automatically
    } catch (error) {
      console.error('Sign-in failed:', error)
      // Show error to user
    }
  }

  return (
    <div>
      <button onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/Waitlist.tsx
git commit -m "refactor: update routes and waitlist to use Supabase auth"
```

---

## Task 10: Update Frontend Network Calls

**Files:**
- Modify: All files that call `getAuthHeaders()` or set x-user-id

**Step 1: Find all network calls**

Run: `grep -r "getAuthHeaders\|x-user-id" frontend/src --include="*.ts" --include="*.tsx"`

Expected: Find all network calls in components.

**Step 2: Update fetch calls to use Authorization header**

Old pattern:
```typescript
const headers = getAuthHeaders()
fetch('/chat/message', {
  headers: { ...headers, 'Content-Type': 'application/json' },
})
```

New pattern:
```typescript
const headers = await getAuthHeaders()
fetch('/chat/message', {
  headers: {
    ...headers,
    'Content-Type': 'application/json'
  },
})
```

The `getAuthHeaders()` now returns `{ Authorization: 'Bearer {token}' }` instead of `{ 'x-user-id': '...' }`.

**Step 3: Update all network service files**

Files likely to need updates:
- `frontend/src/services/chat.ts` (if exists)
- `frontend/src/components/GodMode.tsx` (message sending)
- `frontend/src/components/ConversationMode.tsx` (message sending)
- Any other fetch calls

**Step 4: Commit**

```bash
git add frontend/src/services/*.ts frontend/src/components/*.tsx
git commit -m "refactor: update all network calls to use JWT Authorization header"
```

---

## Task 11: Test End-to-End Flow

**Step 1: Start backend**

```bash
DEV=true npm run dev --workspace=backend
```

Expected: Backend running on port 3001, logs showing configuration.

**Step 2: Start frontend**

```bash
npm run dev --workspace=frontend
```

Expected: Frontend running on port 3000.

**Step 3: Test sign-in flow**

1. Navigate to `http://localhost:3000/waitlist`
2. Click "Sign in with Google"
3. Complete Google authentication
4. Should redirect to `/auth/callback`
5. Should then redirect to `/chat`
6. Check browser localStorage for `supabase.auth.token`

**Step 4: Test chat initialization**

1. Open browser DevTools Network tab
2. Send a message in chat
3. Verify request includes: `Authorization: Bearer {token}` header
4. Verify response includes user session

**Step 5: Verify approval workflow**

1. New user signs in → app_users entry created with `approved: false`
2. Should see "Pending approval" message
3. Manually set `approved: true` in Supabase Dashboard
4. Refresh page → chat should become accessible

**Step 6: Commit test results**

```bash
git add -A
git commit -m "test: verify end-to-end auth flow and approval workflow"
```

---

## Task 12: Clean Up Old Auth Code

**Files:**
- Delete: Any old custom OAuth handlers
- Delete: Old auth routes that are no longer needed
- Clean: Remove x-user-id references from comments

**Step 1: Remove old auth routes**

If there's an old `/auth/google` endpoint or similar custom OAuth, delete it from `backend/src/routes/auth.ts`.

**Step 2: Clean up comments**

Search for references to "x-user-id" or "custom token" in comments and remove outdated documentation.

**Step 3: Verify tests still pass**

Run: `npm run test` (if tests exist)

Expected: All tests pass with new auth system.

**Step 4: Commit cleanup**

```bash
git add -A
git commit -m "refactor: remove old custom auth code"
```

---

## Task 13: Update Documentation

**Files:**
- Modify: `CLAUDE.md` - Update auth section
- Modify: `docs/FEATURES.md` - Update auth flow description

**Step 1: Update CLAUDE.md**

Update the "Important Patterns" section to document:
- JWT verification process
- Authorization header format
- Supabase session management
- Where approval check happens

**Step 2: Update FEATURES.md**

Update authentication flow description to reflect Supabase Auth with JWT.

**Step 3: Commit**

```bash
git add CLAUDE.md docs/FEATURES.md
git commit -m "docs: update authentication documentation"
```

---

## Task 14: Production Deployment Checklist

**Step 1: Set Supabase project settings**

- Go to Supabase Dashboard → Auth → Providers
- Add Google OAuth credentials (Client ID + Secret)
- Configure Authorized Origins with production domain
- Configure Redirect URIs with production callback URL

**Step 2: Set environment variables in production**

Ensure these are set in your deployment:
- `SUPABASE_URL` (production Supabase URL)
- `SUPABASE_ANON_KEY` (production anon key)
- `SUPABASE_JWT_SECRET` (production JWT secret)
- Frontend: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`

**Step 3: Test OAuth flow in production**

1. Sign in with Google in production
2. Verify JWT is valid
3. Verify approval workflow works
4. Monitor auth logs

**Step 4: Document deployment**

Add notes to deployment docs about Supabase Auth setup.

**Step 5: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: add Supabase Auth production setup guide"
```

---

## Summary

**Total Tasks:** 14 (2-5 minutes each)

**Commits:** ~13 atomic commits

**Key Changes:**
- Backend: JWT verification + approval check
- Frontend: Supabase SDK + OAuth flow
- Network: Authorization header instead of x-user-id
- Database: No schema changes, just approval check logic

**Testing:** End-to-end flow verification, approval workflow, JWT validation

---

## Next Steps After Implementation

1. Monitor JWT token expiration/refresh in production
2. Add logging for auth failures
3. Consider adding email verification for added security
4. Plan MFA implementation if needed
5. Set up analytics for auth funnel (signups, approvals, etc.)
