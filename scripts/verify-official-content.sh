#!/usr/bin/env bash
#
# Verify the official CBSE Grade 10 content ingestion end-to-end.
# Logs in as an admin, runs the one-click NCERT/CBSE ingest (which verifies
# every chapter URL over the network), and prints the per-book coverage.
#
# Usage:
#   bash scripts/verify-official-content.sh
#   EMAIL=you@example.com PASSWORD='secret' bash scripts/verify-official-content.sh
#   BASE=http://localhost:3001/api/v1 bash scripts/verify-official-content.sh
#
set -euo pipefail

BASE="${BASE:-http://localhost:3001/api/v1}"
EMAIL="${EMAIL:-admin@learnhub.com}"
PASSWORD="${PASSWORD:-Admin@123}"

echo "→ API base: $BASE"
echo "→ Logging in as: $EMAIL"

LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extract accessToken without needing jq/python (portable across macOS/Linux).
TOKEN=$(printf '%s' "$LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | sed 's/.*:"//;s/"$//')

if [ -z "${TOKEN:-}" ]; then
  echo "✗ Could not get an access token. Is the API running at $BASE?"
  echo "  Raw login response:"
  printf '%s\n' "$LOGIN"
  exit 1
fi
echo "✓ Logged in (token length ${#TOKEN})"

echo "→ Running official CBSE Grade 10 ingest (verifies every NCERT URL — ~15-40s)…"
RESP=$(curl -s --max-time 300 -X POST "$BASE/curriculum/official/cbse-grade10" \
  -H "Authorization: Bearer $TOKEN")

echo
echo "===== RESULT ====="
if command -v python3 >/dev/null 2>&1; then
  printf '%s' "$RESP" | python3 -m json.tool
else
  printf '%s\n' "$RESP"
fi

echo
echo "A book with \"published\": 0 is the only red flag — send that line back."
