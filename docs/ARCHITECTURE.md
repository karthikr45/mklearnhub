# LearnHub Architecture

## Monorepo layout

LearnHub is a Turborepo + pnpm-workspaces monorepo. Apps consume shared
packages via the `@learnhub/*` alias and the `workspace:*` protocol, so a change
to a shared package is picked up everywhere without publishing.

```
apps/
  web     Next.js 15 App Router (customer-facing)
  api     NestJS on Fastify (REST + WebSocket)
  admin   Next.js 15 (super-admin)
  mobile  Expo Router (React Native)  [excluded from default install]
packages/
  db      Prisma schema, generated client, seed
  types   Zod schemas + inferred TS types (shared contracts)
  utils   Pure helpers (date/string/file/validation/crypto)
  ui      shadcn/ui components + custom widgets
  config  tsconfig / eslint / tailwind presets
  email   React Email templates + Resend sender
  ai      Anthropic Claude SDK wrapper
```

## Data flow

```
Browser (apps/web)
  │  axios + TanStack Query  (JWT in Authorization header)
  ▼
apps/api  (NestJS / Fastify)
  │  controller → service → PrismaService
  ▼
PostgreSQL  (packages/db — Prisma)
```

- The web app keeps auth state in a persisted Zustand store; an axios
  interceptor attaches the access token and transparently refreshes it on a
  401 using the refresh token.
- Server state is cached with TanStack Query.
- The API validates every request body with a global `ValidationPipe`
  (class-validator DTOs) and documents endpoints with Swagger at `/api/docs`.

## Auth flow

1. `POST /auth/register` or `/auth/login` → the API verifies credentials
   (bcrypt) and issues a **JWT access token (15 min)** and a
   **refresh token (7 days)**. The refresh token is stored in the `sessions`
   table.
2. Protected routes use a Passport JWT strategy (`JwtAuthGuard`). Role checks
   use `@Roles(...)` + `RolesGuard`.
3. `POST /auth/refresh` rotates the refresh token (old one is replaced).
4. Google OAuth is wired via a Passport strategy that only registers when
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are present.

## Multi-tenancy

Every tenant-scoped row carries an `organizationId`. `JwtPayload` includes the
user's `orgId`; org-scoped controllers derive it from the authenticated user and
pass a guaranteed non-null value to services, which filter all queries by it.
Row-level isolation is enforced in the service layer (never trust a client-
supplied org id).

## Video pipeline (design)

1. Client requests a presigned S3 upload URL (`StorageService`).
2. Client uploads the raw file directly to S3.
3. The API enqueues a `video-processing` job (BullMQ, when Redis is enabled).
4. The worker downloads the file, runs FFmpeg to produce HLS renditions
   (360p/720p/1080p) + a thumbnail, uploads segments + `master.m3u8` back to S3,
   and updates the `Lesson` record (`hlsUrl`, `videoDurationSecs`).
5. Playback validates enrollment before returning the HLS URL.

Locally, video processing is a stub (updates the lesson record) since FFmpeg and
S3 are optional.

## Background jobs

`packages`-light queue definitions live in `apps/api/src/queues`. Queues
(`video-processing`, `email`, `certificate`, `analytics`, `search-index`) run on
BullMQ + Redis and are activated by `ENABLE_QUEUES=true` with a `REDIS_URL`. When
disabled, the corresponding actions run inline or are skipped so the API boots
with only PostgreSQL.

## Search

`SearchService` unifies search across courses and articles. With no
`ELASTICSEARCH_URL`, it uses PostgreSQL `contains` queries; when Elasticsearch is
configured, content is indexed and queried there.

## Environments

Config is validated at boot (`apps/api/src/config/env.ts`, class-validator).
Only `DATABASE_URL` is strictly required; every third-party integration is
optional and degrades gracefully.
