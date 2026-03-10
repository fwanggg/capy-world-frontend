#!/bin/bash

# Script to apply the app_log table migration to Supabase
# Usage: ./scripts/apply-migration.sh <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>

if [ $# -lt 2 ]; then
  echo "Usage: $0 <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>"
  echo ""
  echo "Get these values from your Supabase dashboard:"
  echo "  SUPABASE_URL: Settings > API > Project URL"
  echo "  SUPABASE_SERVICE_ROLE_KEY: Settings > API > service_role key"
  echo ""
  echo "Example:"
  echo "  $0 https://your-project.supabase.co eyJhbGc..."
  exit 1
fi

SUPABASE_URL="$1"
SERVICE_ROLE_KEY="$2"

echo "Applying app_log migration to Supabase..."
echo "Project: $SUPABASE_URL"

# Read migration SQL
MIGRATION_SQL=$(cat docs/migrations/003-app-log-table.sql)

# Execute via Supabase REST API (admin endpoint)
curl -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"sql\":$(echo "$MIGRATION_SQL" | jq -R -s .)}" \
  -w "\n"

echo ""
echo "Migration applied successfully!"
echo ""
echo "Verify table was created:"
echo "  SELECT * FROM app_log LIMIT 1;"
