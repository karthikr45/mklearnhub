# Verification Checklist (run before every commit)

The rule: **build passing ≠ working.** `typecheck` and `build` cannot catch a
404, a broken re-seed, or a fresh-clone that won't start. Run the real thing.

```bash
pnpm verify   # scripts/verify.sh — the automated gate below
```

`pnpm verify` must print `verify: N passed, 0 failed` before code is committed.

## What it checks, and which past bug each check prevents

| # | Check | Bug it would have caught |
| - | ----- | ------------------------ |
| 1 | `pnpm -r typecheck` (all workspaces) | type errors |
| 2 | `pnpm --filter "./packages/*" build` | fresh clone missing `dist/` → `Cannot find module @learnhub/types` |
| 3 | No `app/(dashboard)` route group; `app/dashboard` exists | `/dashboard` 404 after login (route-group strips the segment) |
| 4 | `pnpm db:seed` run **twice** | non-idempotent seed → FK violation on re-run |
| 5 | `apps/api` builds **and boots**, `/health` + `login` respond | API that compiles but won't run under Node |
| 6 | `web` + `admin` build; `/dashboard` route present in output | pages that don't compile / routing regressions |

## Manual pass for UI changes (what automation can't see)

Before committing a UI change, actually click it:

- [ ] Log in (`admin@acmecorp.com` / `Admin@123`) → land on `/dashboard` (not 404)
- [ ] Exercise the specific flow you changed, end to end, against the running API
- [ ] Check the browser console for errors (ignore extension-caused hydration noise)
- [ ] If it's a new page, confirm its link in the sidebar/nav actually resolves

## Commit discipline

- Commit in **coherent, verified units** — never a partial snapshot mid-change.
- Run `pnpm verify` green **before** `git commit`.
- One logical change per commit with a message that says what and why.
- Push only after the local gate passes.
