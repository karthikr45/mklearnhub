# LearnHub Monorepo

## Project overview

LearnHub is a full-stack SaaS platform: knowledge base + LMS + school
management, with an enterprise layer (SSO, HRMS sync, SCORM/xAPI, audit,
API gateway, white-label branding, compliance). Turborepo + pnpm workspaces.

## Architecture

- apps/web         → Next.js 15 (App Router) — main web app (port 3000)
- apps/api         → NestJS on Fastify — REST + WebSocket API (port 3001)
- apps/admin       → Next.js 15 — super-admin dashboard (port 3002)
- apps/mobile      → Expo (React Native) — excluded from default install
- packages/db      → Prisma schema + migrations (PostgreSQL)
- packages/ui      → shared component library (shadcn-style)
- packages/config  → ESLint, TypeScript, Tailwind presets
- packages/types   → shared TS types + Zod schemas
- packages/utils   → shared helpers (date/string/file/crypto/csv-templates)
- packages/email   → React Email templates (Resend)
- packages/ai      → Anthropic Claude SDK wrapper
- packages/compliance → encryption, PII scrubbing, security headers, password
  policy, rate-limit presets, ISO 27001 checklist

## Package manager

pnpm only (never npm/yarn). pnpm workspaces + Turborepo. `packageManager` is
pinned to pnpm@10.33.0.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test`
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` / `pnpm db:studio` / `pnpm db:seed`

## Runtime packages are BUILT to dist

`db`, `types`, `utils`, `ai`, `email`, `compliance` compile to `dist/` (via
`tsc -p tsconfig.build.json`) and their package.json `exports`/`main` point at
`dist`. This is required so the **compiled NestJS API can run under Node**
(it can't load raw `.ts`). After changing any of these packages, rebuild them
(`pnpm --filter @learnhub/<pkg> build`) before running the API from `dist`.
`ui` stays source-only (Next transpiles it via `transpilePackages`).

## Boots with PostgreSQL only

The API is designed to boot with **only Postgres**. Redis (BullMQ + rate
limiting), Elasticsearch, S3, Stripe, Resend, Anthropic, Google/SAML are all
optional and degrade gracefully:
- Queue work runs **inline** unless `ENABLE_QUEUES=true` + `REDIS_URL` set.
- Rate limiting **fails open** when `REDIS_URL` is unset.
- S3/Stripe/AI clients are constructed **lazily** inside methods, never in
  constructors — importing a module must never open a network connection.
Keep this invariant when adding modules.

## Code style

- TypeScript strict everywhere; avoid `any` (use `unknown` / real types).
- The API tsconfig extends `@learnhub/config/typescript/nestjs` (CommonJS,
  decorators, `declaration:false`). Shared packages extend `base` (strict,
  `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) — be careful with
  optional properties there; use conditional spreads for optional Prisma fields.
- NestJS: controller → service → Prisma. Named exports only (no default).
- All API input validated with class-validator DTOs (+ @nestjs/swagger).
- Multi-tenant: every tenant-scoped query filters by `organizationId`, derived
  from the authenticated user (`JwtPayload.orgId`), never from client input.
- React: Server Components by default; `'use client'` only when needed.

## Auth

JWT access (15m) + refresh (7d, rotated, stored in `sessions`). `JwtAuthGuard`,
`RolesGuard` + `@Roles(...)`, `@CurrentUser()`. Audit interceptor logs mutations.

## Local dev

1. `pnpm install`
2. Start Postgres (docker compose, or a local cluster) matching
   `packages/db/.env` (`postgresql://learnhub:learnhub_dev@localhost:5432/learnhub_db`)
3. `pnpm db:generate && pnpm db:migrate && pnpm db:seed`
4. Copy `.env.example` files, then `pnpm dev`
5. Seed logins: `admin@learnhub.com` / `Admin@123` (super admin),
   `admin@acmecorp.com` / `Admin@123` (org admin)

## What Claude often gets wrong here

- Do NOT expose raw `.ts` from a package the API imports at runtime — it must
  build to `dist`.
- Do NOT open Redis/S3/SAML connections at module construction — lazy only.
- Do NOT use `export default` for Nest services/controllers.
- Always rebuild the affected `dist` package before booting the API from
  `dist/main.js`.
- Add `organizationId` scoping to every multi-tenant query.
