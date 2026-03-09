# Authentication System

## Overview

Capybara AI uses **Supabase Auth** with **Google OAuth 2.0** for user authentication. This document describes the complete authentication architecture, flows, and implementation details.

## Architecture

### Components

1. **Frontend (Client)**
   - Supabase SDK manages session and tokens
   - Google One-Tap sign-in UI
   - Automatic token refresh
   - Session stored in localStorage

2. **Backend (Server)**
   - JWT verification middleware using `jose` library
   - Approval status check middleware
   - Protected endpoints require both valid JWT + approved status
   - Supabase public key used to verify tokens

3. **Supabase**
   - User management and OAuth provider
   - JWT signing and verification
   - Session storage in `auth.users` table
   - Google OAuth configuration

4. **Database**
   - `auth.users` - Managed by Supabase (user_id, email, metadata)
   - `app_users` - Approval workflow (user_id, approved, created_at)

## Sign-In Flow

```
┌─────────────────┐
│ User at /waitlist
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Google One-Tap loads     │
│ (VITE_GOOGLE_CLIENT_ID)  │
└────────┬─────────────────┘
         │ User selects account
         ▼
┌────────────────────────────────────┐
│ signInWithIdToken({provider:       │
│   'google', token})                │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Supabase creates user in     │
│ auth.users table + JWT token │
└────────┬─────────────────────┘
         │ Session stored
         ▼
┌──────────────────────────┐
│ Redirect to /auth/callback
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Verify session + create      │
│ app_users entry (approved:   │
│ false or true in DEV)        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Redirect to /chat        │
│ Session ready            │
└──────────────────────────┘
```

## Protected Routes

All protected endpoints require:
1. Valid JWT in `Authorization: Bearer {token}` header
2. User approval status (`app_users.approved = true`)

### Backend Implementation

```typescript
// middleware/auth.ts
app.use(requireAuth, checkApproval)

// Returns:
// - 401 Unauthorized: Missing or invalid JWT
// - 403 Forbidden: User not approved
// - req.userId: User ID available to route handlers
```

## Development vs Production

### Development (`DEV=true`)

```bash
DEV=true npm run dev --workspace=backend
```

Features:
- Auto-creates users in `app_users` table with `approved: true`
- Allows passwordless testing
- Skip nonce check for OAuth (optional)
- Uses real database for persistence
- Suitable for E2E testing

### Production

- Manual admin approval required via Supabase Dashboard
- Full JWT verification with signature check
- Strict OAuth nonce checking
- Supabase OAuth configuration via Dashboard

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `401 Unauthorized` | Missing or invalid JWT | Re-authenticate or refresh token |
| `403 Forbidden` | User not approved | Wait for admin approval |
| `400 Bad Request` | Invalid request format | Check request body and headers |
| `500 Internal Server Error` | Server error | Check backend logs |

## Configuration

### Environment Variables

**Backend (`.env`)**
```
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase
DEV=true  # Optional: enable development mode
```

**Frontend (`.env`)**
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Supabase Configuration

**`supabase/config.toml`**
```toml
[auth.external.google]
enabled = true
client_id = "your-google-client-id"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false  # true only in DEV
```

### Google Cloud Console Setup

1. Create OAuth 2.0 credentials (Web application type)
2. Authorized JavaScript Origins:
   - Local: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Authorized Redirect URIs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

## Implementation Details

### Frontend Files

**`frontend/src/services/auth.ts`**
- Wraps Supabase SDK
- `signInWithGoogle()` - Initiates OAuth flow
- `getAuthHeaders()` - Returns Authorization header with JWT
- `getUser()` - Get current user info
- `signOut()` - Sign out and clear session

**`frontend/src/pages/Auth.tsx`**
- Handles `/auth/callback` route
- Verifies Supabase session
- Redirects to `/chat` on success
- Handles OAuth errors

**Usage in components:**
```typescript
// Get auth headers for API calls
const headers = await getAuthHeaders()
fetch('/api/data', { headers })

// Check current user
const user = await getUser()
if (!user) navigate('/waitlist')
```

### Backend Files

**`backend/src/middleware/auth.ts`**
- `requireAuth` middleware
- Verifies JWT signature using Supabase public key
- Extracts `user_id` from JWT claims
- Sets `req.userId` for route handlers
- Returns 401 if invalid

**`backend/src/utils/jwt.ts`**
- `verifyJWT()` - Verify token signature
- `extractUserId()` - Extract user ID from token
- Uses `jose` library for cryptographic verification

**`backend/src/routes/auth.ts`**
- `POST /auth/profile` - Get current user profile
- Checks `app_users.approved` status
- Creates `app_users` entry on first login
- Returns 403 if not approved

**Usage in routes:**
```typescript
app.post('/api/chat/message', requireAuth, checkApproval, (req, res) => {
  const userId = req.userId  // Available after requireAuth
  // Protected route logic
})
```

## Approval Workflow

### First Login

```typescript
// In auth.ts route handler
const userId = req.userId  // From JWT
const user = await db.query(
  'SELECT * FROM app_users WHERE user_id = $1',
  [userId]
)

if (!user) {
  // Create new user with approval pending
  await db.query(
    'INSERT INTO app_users (user_id, approved) VALUES ($1, false)',
    [userId]
  )
}

if (!user?.approved && !DEV_MODE) {
  return res.status(403).json({ error: 'Pending admin approval' })
}
```

### Admin Approval

Admins use Supabase Dashboard:
1. Navigate to `app_users` table
2. Find user by `user_id`
3. Set `approved = true`
4. User can now access protected endpoints

### Development Mode Auto-Approval

```typescript
if (DEV_MODE && !user) {
  await db.query(
    'INSERT INTO app_users (user_id, approved) VALUES ($1, true)',
    [userId]
  )
}
```

## Testing

### Manual Testing

1. **Start development servers:**
   ```bash
   DEV=true npm run dev
   ```

2. **Sign in:**
   - Navigate to `http://localhost:3000/waitlist`
   - Click "Sign in with Google"
   - Complete OAuth flow

3. **Verify session:**
   - Open DevTools console
   - Check localStorage for `supabase.auth.token`
   - Verify Authorization header in network requests

4. **Test protected route:**
   ```bash
   curl -H "Authorization: Bearer {token}" http://localhost:3001/api/chat/init
   ```

### Automated Testing

Use cURL with token from development session:
```bash
# Get user (public endpoint)
curl http://localhost:3000/auth/user

# Get current user (protected)
TOKEN=$(curl -s http://localhost:3001/auth/session | jq -r '.session.access_token')
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/user

# Test chat (protected)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "god"}' \
  http://localhost:3001/api/chat/init
```

## Security Considerations

### JWT Verification

- Always verify JWT signature using Supabase public key
- Never trust claims without verification
- Check token expiration (Supabase SDK handles auto-refresh)

### CORS Configuration

Frontend and backend must have matching CORS configuration:
```typescript
// backend/src/index.ts
app.use(cors({
  origin: 'http://localhost:3000',  // Frontend origin
  credentials: true,
}))
```

### Database Permissions

Use Supabase Row Level Security (RLS) to:
- Restrict access to user's own data
- Prevent direct API access to `auth.users`
- Validate approval status at database level

### Environment Secrets

- `SUPABASE_JWT_SECRET` - Keep secure, never commit
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` - Keep secure
- Use `.env` and `.env.local` for secrets
- Add to `.gitignore` to prevent accidental commits

## Troubleshooting

### "Invalid JWT" Error

**Cause:** Token expired or invalid signature

**Solution:**
- Frontend: Supabase SDK should auto-refresh; if not, re-authenticate
- Backend: Check that `SUPABASE_JWT_SECRET` matches Supabase config

### "User not approved" (403)

**Cause:** User exists but `app_users.approved = false`

**Solution:**
- In development: Enable `DEV=true` mode
- In production: Admin approves user in Supabase Dashboard

### "Missing Authorization header" (401)

**Cause:** Frontend didn't include JWT

**Solution:**
- Frontend: Call `getAuthHeaders()` before fetch
- Verify `VITE_SUPABASE_ANON_KEY` is set
- Check that user is signed in: `const user = await getUser()`

### Google OAuth Fails

**Cause:** Misconfigured Google credentials or redirect URI

**Solution:**
- Check `VITE_GOOGLE_CLIENT_ID` matches Google Cloud Console
- Verify redirect URI in Google Cloud Console matches app
- Check `supabase/config.toml` has correct client_id
- Verify `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` in `.env`

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- Project files: `backend/src/middleware/auth.ts`, `frontend/src/services/auth.ts`
