# Production image for @learnhub/api.
# Build from the repository ROOT so pnpm workspace packages resolve, e.g.:
#   docker build -f apps/api/Dockerfile -t learnhub-api .

# ─── Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack.
RUN corepack enable

# Copy workspace manifests first for better layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages ./packages

# Install all workspace dependencies (dev included for the build).
RUN pnpm install --frozen-lockfile

# Copy the rest of the source and build the API and its deps.
COPY . .
RUN pnpm --filter @learnhub/db run generate \
  && pnpm --filter @learnhub/api run build \
  && pnpm --filter @learnhub/api --prod deploy /app/deploy

# ─── Runner ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as an unprivileged user.
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nodejs

# Pruned production node_modules + built output.
COPY --from=builder --chown=nodejs:nodejs /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
