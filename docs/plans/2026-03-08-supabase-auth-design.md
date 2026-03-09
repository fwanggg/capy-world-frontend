# Supabase Auth Migration Design Document

**Date:** 2026-03-08
**Status:** Design Approved
**Implementation Guide:** https://supabase.com/docs/guides/auth, https://supabase.com/docs/guides/auth/social-login/auth-google

---

## Executive Summary

Migrate from custom manual auth (x-user-id headers, custom tokens) to **Supabase Auth with Google OAuth**. Consolidate authentication into Supabase using their native Google OAuth provider while maintaining the existing approval workflow in the database.

**Key Benefits:**
- Secure JWT-based authentication (cryptographically signed)
- Native user information handling (email, name, avatar automatically populated)
- Simplified codebase (remove custom token generation)
- Standard OAuth 2.0 flow
- One-Tap sign-in UX (Option B)

---

## Architecture

### Current System
- Frontend: Custom Google OAuth with localStorage
- Backend: x-user-id header parsing (no signature verification)
- Session: Manual localStorage management
- Approval: Database flag

### New System
- Frontend: Supabase Auth SDK + Google One-Tap
- Backend: JWT verification + approval check
- Session: Supabase Auth SDK manages automatically
- Approval: Keep database flag (`app_users.approved`)

---

## Configuration

### Local Development Setup

**Environment Variables** (`.env`):
```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=<from-google-cloud>
```

**Supabase Config** (`supabase/config.toml`):
```toml
[auth.external.google]
enabled = true
client_id = "<from-google-cloud>"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

**Google Cloud Console:**
1. Create OAuth 2.0 credentials (Web application type)
2. Authorized JavaScript Origins: `http://localhost:3000`
3. Authorized Redirect URIs: `http://localhost:3000/auth/callback`

### Production Setup
- Add Client ID + Secret via Supabase Dashboard
- No environment variables needed (handled by Supabase)

---

## Frontend Implementation

**Sign-In Flow (Option B: Google One-Tap)**

1. Load Google One-Tap UI with `GOOGLE_CLIENT_ID`
2. User clicks button → credential returned
3. Call `supabase.auth.signInWithIdToken({ provider: 'google', token })`
4. Supabase creates session automatically
5. Redirect to `/auth/callback` to verify session
6. Supabase SDK automatically stores session in localStorage

**User Information:**
- Supabase automatically populates: `id`, `email`, `user_metadata` (first_name, last_name, avatar_url)
- Stored in `auth.users` table natively
- Frontend can access via `supabase.auth.getUser()`

**Files to Create/Modify:**
- `frontend/src/services/auth.ts` - Rewrite for Supabase SDK
- `frontend/src/pages/Auth.tsx` - New callback page
- `frontend/src/hooks/useAuth.ts` - Custom hook (optional)
- `.env` - Add Supabase keys and Google Client ID

---

## Backend Implementation

**JWT Verification:**
- Extract JWT from `Authorization: Bearer {token}` header
- Verify signature using Supabase public key
- Extract `user_id` from JWT claims (matches `auth.users.id`)

**Approval Workflow:**
1. User signs in via Google
2. On first login: Create entry in `app_users` with `approved: false`
3. Protected endpoints check both:
   - Valid JWT signature (Supabase handles)
   - `app_users.approved = true` (database check)
4. If not approved: Return 403 "Pending approval"

**Files to Modify:**
- `backend/src/middleware/auth.ts` - JWT verification instead of header parsing
- `backend/src/routes/auth.ts` - Remove custom OAuth, let Supabase handle
- `backend/src/routes/chat.ts` - Update auth checks
- `backend/src/routes/clones.ts` - Update auth checks
- `backend/src/index.ts` - Update user profile endpoint

**Database Schema:**
- No changes needed to `app_users` table
- Supabase automatically manages `auth.users` table
- Just add approval check on `app_users.approved`

---

## User Flow

**Sign-In:**
```
User clicks "Sign in with Google"
  ↓
Google One-Tap UI loads
  ↓
User taps → credential
  ↓
supabase.auth.signInWithIdToken()
  ↓
Supabase creates user in auth.users
  ↓
Session automatically stored
  ↓
Redirect to /auth/callback
  ↓
Verify session, redirect to /chat
```

**Protected Access:**
```
Frontend sends: Authorization: Bearer {JWT}
  ↓
Backend verifies JWT signature
  ↓
Backend checks app_users.approved
  ↓
If approved → grant access
If not → 403 "Pending approval"
```

---

## Error Handling

| Error | Status | Action |
|-------|--------|--------|
| Invalid JWT | 401 | Frontend refreshes session |
| Expired JWT | 401 | Supabase SDK auto-refreshes |
| User not in app_users | 403 | Create entry on first login |
| User not approved | 403 | Show "pending approval" message |
| Google OAuth failed | N/A | Show error, retry sign-in |

---

## Migration Checklist

- [ ] Add Google OAuth credentials to `supabase/config.toml`
- [ ] Set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` in `.env`
- [ ] Rewrite frontend auth service using Supabase SDK
- [ ] Create `/auth/callback` page
- [ ] Update backend middleware for JWT verification
- [ ] Update all protected routes to check `app_users.approved`
- [ ] Test sign-in flow end-to-end
- [ ] Test approval workflow (pending → approved)
- [ ] Remove old custom auth code
- [ ] Verify localStorage stores correct session

---

## Implementation Order

1. **Setup**: Configure Google OAuth + Supabase
2. **Backend**: JWT verification middleware
3. **Frontend**: Rewrite auth service + One-Tap UI
4. **Integration**: Test end-to-end
5. **Cleanup**: Remove old auth code

---

## References

- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- Current approval workflow in `app_users` table
