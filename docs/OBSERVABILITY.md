# Observability & Logging

## Overview

The Capybara AI project now includes a comprehensive logging system for observability across both development and production environments. All logs are written to the `app_log` table in Supabase with industry-standard schema design.

**Note on User Management:** All users are managed by Supabase Auth (`auth.users` table). The `user_id` field in logs stores UUIDs from this table. There is no separate `app_users` table — all authentication is delegated to Supabase.

## Schema

The `app_log` table captures comprehensive logging data:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Unique identifier for the log entry |
| `timestamp` | TIMESTAMP WITH TIME ZONE | When the event occurred (auto-set, precise to microseconds) |
| `level` | TEXT | Log level: `debug`, `info`, `warn`, `error` |
| `environment` | TEXT | Environment: `dev` or `prod` (auto-detected from NODE_ENV or DEV flag) |
| `event` | TEXT | Event identifier (e.g., `auth.success`, `jwt.verification_failed`) |
| `message` | TEXT | Human-readable message describing what happened |
| `user_id` | UUID | Optional: User UUID from Supabase `auth.users` table if log is related to a specific user |
| `request_id` | TEXT | Optional: Correlation ID for tracing requests across services |
| `source_file` | TEXT | File that generated the log (e.g., `auth.ts`) |
| `source_line` | INT | Line number where the log was emitted |
| `metadata` | JSONB | Additional structured data (error details, parameters, etc.) |
| `duration_ms` | INT | Optional: Operation duration for performance tracking |
| `created_at` | TIMESTAMP WITH TIME ZONE | Auto-set timestamp |

## Logging Service

### Location
`backend/src/services/logging.ts`

### Usage

```typescript
import { log } from '../services/logging'

// Log at different levels
log.info('event.name', 'Human readable message', {
  userId: 'user-uuid',
  metadata: { customField: 'value' }
})

log.error('error.event', 'Error message', {
  sourceFile: 'myfile.ts',
  sourceLine: 42,
  metadata: { errorType: 'ValidationError' }
})

// Full signature with all options
import { logEvent } from '../services/logging'

logEvent('info', 'event.name', 'Message', {
  userId: 'optional-user-id',
  requestId: 'optional-correlation-id',
  sourceFile: 'auth.ts',
  sourceLine: 25,
  metadata: { any: 'structured data' },
  durationMs: 150  // Performance tracking
})
```

### Features

- **Automatic console logging**: All logs appear in console immediately (for dev visibility)
- **Async database writes**: Logs are written to database without blocking requests
- **Environment detection**: Automatically detects `dev` or `prod` from NODE_ENV or DEV flag
- **Error resilience**: If logging itself fails, errors are only logged to console (no infinite loops)

## Current Coverage: Auth Flows

### Authenticated Events

#### `auth.dev_mode` (INFO)
- **When**: DEV mode is enabled and x-user-id header is provided
- **Purpose**: Track development authentication
- **Metadata**: `{ header, convertedUserId }`

#### `auth.header_check` (INFO)
- **When**: Authorization header presence is checked
- **Purpose**: Monitor authentication attempts
- **Metadata**: `{ headerPresent: boolean }`

#### `auth.header_missing` (ERROR)
- **When**: Authorization header is missing or invalid
- **Purpose**: Track failed auth attempts (missing credentials)
- **Metadata**: `{ headerPresent: boolean }`

#### `auth.token_verify` (INFO)
- **When**: JWT token is about to be verified
- **Purpose**: Track token verification flow
- **Metadata**: `{ tokenPreview: string }`

#### `auth.token_invalid` (ERROR)
- **When**: JWT verification returns null/invalid
- **Purpose**: Track failed token verification
- **Metadata**: `{ tokenPreview: string }`

#### `auth.success` (INFO)
- **When**: User is successfully authenticated
- **Purpose**: Track successful logins
- **UserId**: Included in userId field
- **Metadata**: `{ email: string }`

#### `auth.extraction_failed` (ERROR)
- **When**: Exception occurs during authentication
- **Purpose**: Track unexpected auth errors
- **Metadata**: `{ errorType: string }`

### JWT Events

#### `jwt.env_missing` (ERROR)
- **When**: SUPABASE_JWT_SECRET is not set
- **Purpose**: Critical startup failure detection
- **Effect**: Application throws error and stops

#### `jwt.verification_success` (DEBUG)
- **When**: JWT signature verification succeeds
- **Purpose**: Detailed audit trail of token validations
- **Metadata**: `{ sub: string }`

#### `jwt.verification_failed` (ERROR)
- **When**: JWT signature verification fails
- **Purpose**: Security monitoring (invalid tokens)
- **Metadata**: `{ errorType: string, tokenPreview: string }`

#### `jwt.missing_sub_claim` (ERROR)
- **When**: JWT payload lacks required "sub" claim
- **Purpose**: Invalid token structure detection
- **Metadata**: `{ payloadKeys: string[] }`

### Approval Events

#### `approval.localhost_skip` (INFO)
- **When**: Approval check is skipped for localhost
- **Purpose**: Track development skips
- **Metadata**: `{ host: string }`

#### `approval.check_start` (INFO)
- **When**: Approval check begins
- **Purpose**: Monitor approval flow
- **UserId**: Included

#### `approval.user_not_found` (WARN)
- **When**: User not in waitlist table
- **Purpose**: Track new user first-time visits
- **Metadata**: `{ error: string }`

#### `approval.not_approved` (ERROR)
- **When**: User status is not 'approved'
- **Purpose**: Track access denials for unapproved users
- **Metadata**: `{ approvalStatus: string }`

#### `approval.check_failed` (ERROR)
- **When**: Database query for approval fails
- **Purpose**: Detect database/query errors
- **Metadata**: `{ errorType: string }`

#### `approval.success` (INFO)
- **When**: User passes approval check
- **Purpose**: Track successful authorizations
- **UserId**: Included

#### `approval.no_user_id` (ERROR)
- **When**: Approval middleware called without userId
- **Purpose**: Detect middleware ordering issues
- **Effect**: Returns 401 Unauthorized

## Querying Logs

### Via Supabase Dashboard

1. Navigate to your Supabase project
2. Open "SQL Editor"
3. Run queries like:

```sql
-- View recent errors
SELECT timestamp, event, message, user_id, metadata
FROM app_log
WHERE level = 'error'
ORDER BY timestamp DESC
LIMIT 20;

-- View auth events for specific user
SELECT timestamp, event, message, metadata
FROM app_log
WHERE user_id = 'user-uuid'
  AND event LIKE 'auth.%'
ORDER BY timestamp DESC;

-- View all events in production
SELECT timestamp, event, message, source_file, source_line
FROM app_log
WHERE environment = 'prod'
ORDER BY timestamp DESC
LIMIT 50;

-- Count errors by event type
SELECT event, COUNT(*) as count
FROM app_log
WHERE level = 'error'
  AND timestamp > now() - interval '24 hours'
GROUP BY event
ORDER BY count DESC;
```

### Via TypeScript/Backend Code

```typescript
// Get recent errors
const { data: errors } = await supabase
  .from('app_log')
  .select('*')
  .eq('level', 'error')
  .order('timestamp', { ascending: false })
  .limit(20)

// Get auth flow for a user
const { data: authLogs } = await supabase
  .from('app_log')
  .select('*')
  .eq('user_id', userId)
  .ilike('event', 'auth.%')
  .order('timestamp', { ascending: false })
```

## Testing the Logging System

### 1. Start Development Server
```bash
DEV=true npm run dev --workspace=backend
```

### 2. Make Auth Requests
```bash
# Test dev mode
curl -H "x-user-id: test_user" http://localhost:3001/api/chat/init

# Test missing auth header
curl http://localhost:3001/api/chat/init

# With valid JWT (if you have one)
curl -H "Authorization: Bearer eyJhbGc..." http://localhost:3001/api/chat/init
```

### 3. Check Console Output
Look for logs like:
```
[2024-03-10T15:30:45.123Z] [INFO] [auth.dev_mode] DEV MODE: Converting x-user-id header to UUID
[2024-03-10T15:30:45.124Z] [INFO] [auth.success] User authenticated successfully
```

### 4. Query Database
```sql
SELECT * FROM app_log
ORDER BY timestamp DESC
LIMIT 20;
```

## Environment Detection

The logging service automatically detects the environment:

| Configuration | Detection |
|---------------|-----------|
| `NODE_ENV=production` | `prod` |
| `DEV=true` | `dev` |
| `NODE_ENV=staging` or any other | `dev` (fallback) |

This allows the same code to work in both dev and production without changes.

## Best Practices

### What to Log

✅ **Do log:**
- Authentication attempts (success and failure)
- Authorization checks (approval, permissions)
- Critical business operations (session creation, etc.)
- Errors and exceptions (always capture error type/message)
- Performance metrics (duration_ms for slow operations)

❌ **Don't log:**
- Full tokens or passwords (use preview only)
- Sensitive user data (PII) beyond UUID
- Debug information that clutters the log (use DEBUG level sparingly)

### Structuring Logs

**Good event names:**
- `auth.success` (noun.past_tense or noun.state)
- `jwt.verification_failed` (noun.action_past)
- `approval.check_start` (noun.action_present)

**Good metadata:**
```json
{
  "userId": "uuid",
  "errorType": "ValidationError",
  "attemptCount": 3,
  "email": "user@example.com"
}
```

### Performance Considerations

- Logging is **async** — database writes don't block requests
- However, large `metadata` objects or high log volume could impact performance
- Logs older than 30 days should be archived (consider retention policy)

## Migration to Existing Database

Run the migration SQL to add the table:

```sql
-- Copy contents of docs/migrations/003-app-log-table.sql
```

If using Supabase CLI:
```bash
supabase migration new add_app_log_table
# Then copy migration content to the generated file
supabase db push
```

## Future Enhancements

### Potential additions:
1. **Request ID tracing** - Pass request_id through all logs for request correlation
2. **Performance monitoring** - Log duration_ms for all database queries
3. **Analytics** - Create views/dashboards for log analysis
4. **Log retention** - Archive old logs, set up TTL policies
5. **Alerts** - Trigger alerts on error spikes or critical events
6. **Distributed tracing** - Correlation IDs across microservices (if you scale)

## Troubleshooting

### Logs not appearing in database?
1. Check that migration was applied: `SELECT * FROM app_log LIMIT 1`
2. Check console logs (they always work, DB writes might fail)
3. Verify Supabase connection in backend
4. Check permissions on app_log table (should allow insert)

### Performance impact?
- Async writes are non-blocking
- If experiencing slowdown, it's likely not the logging
- Monitor with: `SELECT COUNT(*) FROM app_log`

### Privacy concerns?
- All user_id values are UUIDs (not PII)
- Token previews are first 20 characters (can't reconstruct)
- Configure retention policy to delete old logs if needed
