# LearnHub

Knowledge base + LMS + school-management platform. Monorepo managed with
**Turborepo** + **pnpm workspaces**.

## Apps & packages

| Path             | Description                                    |
| ---------------- | ---------------------------------------------- |
| `apps/web`       | Next.js 15 (App Router) — main web app         |
| `apps/api`       | NestJS (Fastify) — REST + WebSocket API        |
| `apps/admin`     | Next.js 15 — super-admin dashboard             |
| `apps/mobile`    | Expo (React Native) — iOS + Android            |
| `packages/db`    | Prisma schema + migrations (PostgreSQL)        |
| `packages/ui`    | Shared shadcn/ui component library             |
| `packages/config`| Shared ESLint / TypeScript / Tailwind config   |
| `packages/types` | Shared TypeScript types + Zod schemas          |
| `packages/utils` | Shared utilities (date, string, file, crypto)  |
| `packages/email` | React Email templates (Resend)                 |
| `packages/ai`    | Anthropic Claude SDK wrapper                    |

## Prerequisites

- Node.js >= 20 (tested on 22)
- pnpm >= 9 (`corepack enable` or `npm i -g pnpm`)
- PostgreSQL 16 (via Docker, or a local install)

## Quick start (local)

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres (choose ONE):
#    a) Docker (also starts Redis + Elasticsearch, optional):
docker compose up -d
#    b) …or use an existing local PostgreSQL and create the DB/role:
#       createuser learnhub --pwprompt   # password: learnhub_dev
#       createdb  learnhub_db -O learnhub

# 3. Point the DB package at your database
cp packages/db/.env.example packages/db/.env   # already contains local defaults

# 4. Generate the Prisma client + run migrations + seed
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Configure app env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 6. Run everything (turbo)
pnpm dev
#    …or run apps individually:
pnpm --filter @learnhub/api dev     # http://localhost:3001
pnpm --filter @learnhub/web dev     # http://localhost:3000
```

### URLs

- Web: http://localhost:3000
- API: http://localhost:3001/api/v1
- API docs (Swagger): http://localhost:3001/api/docs
- Admin: http://localhost:3002
- Prisma Studio: `pnpm db:studio` → http://localhost:5555

### Default credentials (seed data)

| Role        | Email                | Password  |
| ----------- | -------------------- | --------- |
| Super Admin | admin@learnhub.com   | Admin@123 |
| Org Admin   | admin@acmecorp.com   | Admin@123 |
| Instructor  | instructor1@acmecorp.com | Admin@123 |
| Student     | student1@sunrise.edu | Admin@123 |

## What runs without extra services

The API **boots with only PostgreSQL**. Redis, Elasticsearch, S3, Stripe,
Resend, Anthropic, and Google OAuth are all **optional** — their features
lazily initialize and return a clear "not configured" response until you set the
corresponding env vars. Search falls back to PostgreSQL `contains` queries when
Elasticsearch is not configured.

## Common commands

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `pnpm dev`         | Start all apps in dev mode           |
| `pnpm build`       | Build all packages and apps          |
| `pnpm lint`        | ESLint across the monorepo           |
| `pnpm typecheck`   | `tsc --noEmit` across the monorepo   |
| `pnpm test`        | Run tests                            |
| `pnpm db:migrate`  | `prisma migrate dev`                 |
| `pnpm db:studio`   | Open Prisma Studio                   |
| `pnpm db:seed`     | Seed demo data                       |

## Mobile app (Expo)

`apps/mobile` is excluded from the default install (React Native pulls a large
native toolchain). To enable it, remove the `!apps/mobile` line from
`pnpm-workspace.yaml`, run `pnpm install`, then `pnpm --filter @learnhub/mobile dev`.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
