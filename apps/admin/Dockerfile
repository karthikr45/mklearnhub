# Multi-stage build for apps/admin (Next.js) in the pnpm monorepo.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/admin ./apps/admin
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "./packages/*" build
RUN pnpm --filter @learnhub/admin build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3002
ENV PORT=3002
CMD ["pnpm", "--filter", "@learnhub/admin", "start"]
