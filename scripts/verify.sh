#!/usr/bin/env bash
#
# Pre-commit verification gate for LearnHub.
# Catches the classes of bug that `typecheck` + `build` alone do NOT:
#   - route-group mistakes that 404 at runtime
#   - non-idempotent seed (FK violations on re-run)
#   - missing package builds on a clean tree
#   - API that typechecks but won't boot
#
# Usage: pnpm verify   (or: bash scripts/verify.sh)
# Requires Postgres reachable at the packages/db/.env DATABASE_URL.
set -uo pipefail
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
step() { echo; echo "▶ $1"; }

API_PID=""
cleanup() { [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null || true; }
trap cleanup EXIT

# 1. Types across the whole workspace ---------------------------------------
step "1/6 typecheck (all workspaces)"
if pnpm -r typecheck >/tmp/lh-verify-tc.log 2>&1; then ok "typecheck clean"
else bad "typecheck failed — see /tmp/lh-verify-tc.log"; fi

# 2. Runtime packages build to dist (fresh-clone safety) --------------------
step "2/6 build shared packages (dist)"
if pnpm --filter "./packages/*" build >/tmp/lh-verify-pkg.log 2>&1; then ok "packages built"
else bad "package build failed — see /tmp/lh-verify-pkg.log"; fi

# 3. Route-group guard: no parenthesized folder whose pages are linked with
#    the stripped prefix (this is exactly the /dashboard 404 bug). ----------
step "3/6 web route sanity"
if [ -d "apps/web/src/app/(dashboard)" ]; then
  bad "apps/web/src/app/(dashboard) is a route group — /dashboard links will 404. Rename to a literal 'dashboard'."
elif [ -d "apps/web/src/app/dashboard" ]; then ok "dashboard is a real route segment"
else bad "apps/web/src/app/dashboard not found"; fi

# 4. Seed is idempotent (run twice — catches FK-order bugs) ------------------
step "4/6 seed idempotency (run twice)"
if pnpm db:seed >/tmp/lh-verify-seed1.log 2>&1 && pnpm db:seed >/tmp/lh-verify-seed2.log 2>&1; then
  ok "seed ran twice cleanly"
else bad "seed failed (is Postgres up?) — see /tmp/lh-verify-seed2.log"; fi

# 5. API builds AND actually boots + answers ---------------------------------
step "5/6 API build + boot smoke test"
if pnpm --filter @learnhub/api build >/tmp/lh-verify-api.log 2>&1; then
  ok "api built"
  ( cd apps/api && node dist/main.js >/tmp/lh-verify-boot.log 2>&1 ) &
  API_PID=$!
  UP=""
  for _ in $(seq 1 20); do
    if curl -sf http://localhost:3001/api/v1/health >/dev/null 2>&1; then UP=1; break; fi
    sleep 1
  done
  if [ -n "$UP" ]; then
    ok "api booted (/health ok)"
    LOGIN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
      -H 'Content-Type: application/json' \
      -d '{"email":"admin@acmecorp.com","password":"Admin@123"}')
    echo "$LOGIN" | grep -q accessToken && ok "login returns a token" || bad "login did not return a token"
  else
    bad "api did not boot — see /tmp/lh-verify-boot.log"
  fi
  cleanup; API_PID=""
else
  bad "api build failed — see /tmp/lh-verify-api.log"
fi

# 6. Web + admin build (Next compiles + generates routes) --------------------
step "6/6 web + admin build"
if pnpm --filter @learnhub/web build >/tmp/lh-verify-web.log 2>&1; then
  # assert the dashboard route made it into the build output
  if find apps/web/.next/server/app/dashboard -name 'page*.js' 2>/dev/null | grep -q .; then
    ok "web built; /dashboard route present"
  else bad "web built but /dashboard route missing from output"; fi
else bad "web build failed — see /tmp/lh-verify-web.log"; fi
if pnpm --filter @learnhub/admin build >/tmp/lh-verify-admin.log 2>&1; then ok "admin built"
else bad "admin build failed — see /tmp/lh-verify-admin.log"; fi

echo
echo "──────────────────────────────────"
echo "  verify: $PASS passed, $FAIL failed"
echo "──────────────────────────────────"
[ "$FAIL" -eq 0 ]
