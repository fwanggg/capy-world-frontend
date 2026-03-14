# Production Deployment Checklist

## Single Server Deployment (Recommended)

Express serves both the API and the frontend from one process. One deployment, one port, no `BACKEND_URL`.

**Development:**
```bash
npm run dev
```
Single server on `http://localhost:3000` (or `PORT`). Vite middleware provides HMR.

**Production:**
```bash
NODE_ENV=production npm run start:prod
```
Builds frontend, then starts Express serving API + static `frontend/dist`. Uses `tsx` to run the backend (avoids compiled output). Deploy to Railway, Render, Fly.io, or any Node host. Set `PORT` in platform env; no `BACKEND_URL` needed.

## Pre-Deployment Review

- [ ] All tests passing locally
- [ ] No console errors or warnings
- [ ] Environment variables documented and explained
- [ ] Security review completed (no secrets in code)
- [ ] Performance tested (auth doesn't add latency)

## Environment Configuration

### Supabase Production Setup

1. **Create Production Supabase Project**
   - Go to supabase.com and create new project
   - Note the project URL and anon key
   - Go to Project Settings → API to get credentials

2. **Configure Google OAuth in Production**
   - Go to Google Cloud Console
   - Update OAuth redirect URIs to production domain:
     - `https://yourdomain.com/auth/callback`
   - Get new client ID and secret for production
   - Add to Supabase project:
     - Dashboard → Authentication → Providers → Google
     - Paste production client ID and secret

3. **Get Production JWT Secret**
   - Dashboard → Project Settings → API
   - Copy JWT Secret (long string starting with "eyJ...")
   - This is your SUPABASE_JWT_SECRET

### Backend Environment Variables (.env)

```env
# Supabase Production
SUPABASE_JWT_SECRET=<copy from Supabase dashboard>
SUPABASE_URL=<production supabase URL>
SUPABASE_ANON_KEY=<production anon key>

# Environment
NODE_ENV=production
DEV=false

# Port
PORT=3001
```

### Frontend Environment Variables

**For single-server deployment** (Railway, Render, etc.):

```env
# Supabase Production
VITE_SUPABASE_URL=<production supabase URL>
VITE_SUPABASE_ANON_KEY=<production anon key>

```

### Production Build

```bash
# Build both frontend and backend
npm run build

# Backend dist/
npm start

# Frontend dist/ served by web server
```

## Database Schema Requirements

**Required Tables:** (Created by Supabase automatically)
- `auth.users` - Supabase user table (automatic)
- `app_users` - Custom approval status table

**app_users Schema:**
```sql
CREATE TABLE app_users (
  id UUID PRIMARY KEY,
  approved BOOLEAN DEFAULT false,
  email VARCHAR(255),
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Note:** Create this table in your production Supabase if it doesn't exist.

## Security Checklist

- [ ] SUPABASE_JWT_SECRET only in environment (never in code)
- [ ] Google OAuth secrets only in Supabase dashboard
- [ ] CORS properly configured (no wildcards)
- [ ] HTTPS enforced on all endpoints
- [ ] No sensitive data in error messages
- [ ] Rate limiting configured (optional)
- [ ] Admin endpoints protected (approval checks)

## Testing in Production

Before going live:

1. **Test Sign-In Flow**
   - Navigate to `/waitlist`
   - Sign in with test Google account
   - Verify redirect to `/chat`
   - Check localStorage for session

2. **Test JWT Validation**
   - Send message in chat
   - Verify Authorization header in request
   - Confirm JWT is valid (not expired)

3. **Test Approval Workflow**
   - New user should see "Pending approval"
   - Admin approves in Supabase dashboard
   - User refreshes and can access chat

4. **Test Error Handling**
   - Test with invalid token
   - Test with expired token
   - Test with unapproved user
   - Verify appropriate error messages

5. **Load Testing** (Optional)
   - Test with multiple concurrent users
   - Monitor JWT verification performance
   - Monitor database query performance

## Monitoring & Logging

### What to Monitor

- Authentication failures (401 errors)
- Approval check failures (403 errors)
- JWT verification failures
- Database connection health
- Token refresh rate

### Logging

- All auth failures logged with context
- No sensitive data (tokens, passwords) logged
- Error messages provide enough context for debugging

## Rollback Plan

If issues occur:

1. **Immediate (Minutes)**
   - Check Supabase status
   - Verify environment variables are correct
   - Check JWT secret matches

2. **Short-term (Hours)**
   - Review recent auth failures
   - Check database connectivity
   - Verify Google OAuth settings

3. **Long-term (Fallback)**
   - Revert to previous commit if critical issue
   - Keep old auth system configured as fallback
   - Coordinate with team before rollback

## Post-Deployment

- [ ] Monitor error logs for first 24 hours
- [ ] Verify all users can sign in and access features
- [ ] Check approval workflow is working
- [ ] Document any production-specific issues
- [ ] Set up alert for auth failures (if possible)
- [ ] Schedule regular review of auth logs

## Common Issues & Solutions

### Issue: 401 Unauthorized on every request
**Solution:** Check SUPABASE_JWT_SECRET matches Supabase project

### Issue: Redirect loop at /auth/callback
**Solution:** Verify Google OAuth redirect URI configured correctly

### Issue: Users stuck in "Pending approval"
**Solution:** Check app_users table, ensure `approved = true` is set

### Issue: Token expiration errors
**Solution:** Verify token refresh is working in frontend SDK

## Vercel (Frontend Static Only)

Deploy the frontend as a static SPA to Vercel. The backend must run elsewhere (Railway, Render, etc.).

**Root Directory:** In Vercel Project Settings → Build & Deployment, set **Root Directory** to either:
- **`frontend`** — Uses `frontend/vercel.json`; build outputs to `frontend/dist`
- **Project root** (empty) — Uses root `vercel.json`; build outputs to `frontend/dist`

**Config:** Both `vercel.json` (root) and `frontend/vercel.json` are provided. Use whichever matches your Root Directory.

**Note:** The frontend calls `/api`, `/chat`, `/auth`, etc. Configure these as environment variables or proxy to your backend URL in production.

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Deployment Guide](https://supabase.com/docs/guides/hosting/overview)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- Project Auth Documentation: `docs/AUTH.md`

---

**Last Updated:** 2026-03-08
**Status:** Ready for Production
