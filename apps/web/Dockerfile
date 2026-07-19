# Multi-stage build for apps/web (Next.js) in the pnpm monorepo.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @learnhub/db generate
RUN pnpm --filter "./packages/*" build
RUN pnpm --filter @learnhub/web build

FROM base AS runner
ENV NODE_ENV=production
# Ship the built app + installed deps and run `next start`.
COPY --from=builder /app ./
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "--filter", "@learnhub/web", "start"]
