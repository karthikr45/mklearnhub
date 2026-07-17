# LearnHub — on-premise installation (Docker Compose)

Run the entire LearnHub platform on a single host: the three apps (api, web,
admin) plus Postgres, Redis, Elasticsearch and MinIO (S3-compatible storage).
Suited to air-gapped / self-hosted enterprise deployments.

## Prerequisites

- Docker Engine **24+** and the Docker Compose plugin (`docker compose version`).
- At least **4 vCPU / 8 GB RAM** (Elasticsearch alone reserves ~1 GB).
- ~20 GB free disk for volumes.
- Ports `3000`, `3001`, `3002`, `5432`, `6379`, `9200`, `9000`, `9001` free
  (put a reverse proxy / TLS terminator in front for production).

## Building the web/admin images

`apps/api` ships a production `Dockerfile`. `apps/web` and `apps/admin` do
**not** yet — the compose file references `apps/web/Dockerfile` and
`apps/admin/Dockerfile`. Before your first `up`, either:

1. **Create those Dockerfiles** (multi-stage Next.js `output: 'standalone'`
   builds, mirroring `apps/api/Dockerfile`), or
2. Comment out the `web` and `admin` services and run just the API + backing
   services, or
3. Replace their `build:` blocks with prebuilt `image:` references from your
   registry.

## Install

```bash
cd infra/docker

# 1. Configure
cp .env.example .env
#    Edit .env — set strong POSTGRES_PASSWORD / MINIO_ROOT_PASSWORD / JWT secrets,
#    and an ENCRYPTION_KEY:  openssl rand -hex 32

# 2. Start the stack (detached)
docker compose -f docker-compose.instance.yml up -d

# 3. Wait for health, then check status
docker compose -f docker-compose.instance.yml ps
```

The `minio-init` one-shot job creates the `${S3_BUCKET}` bucket automatically.

### Run database migrations & seed

```bash
# Apply committed migrations to the running Postgres
docker compose -f docker-compose.instance.yml exec api \
  node node_modules/prisma/build/index.js migrate deploy

# (First install only) seed demo/baseline data
docker compose -f docker-compose.instance.yml exec api node dist/seed.js
```

> If your image does not bundle the Prisma CLI, run migrations from a host
> checkout instead: `DATABASE_URL=... pnpm --filter @learnhub/db exec prisma migrate deploy`.

## Access URLs

| Service            | URL                                   |
| ------------------ | ------------------------------------- |
| Web app            | http://localhost:3000                 |
| API                | http://localhost:3001/api/v1          |
| API docs (Swagger) | http://localhost:3001/api/docs        |
| Admin dashboard    | http://localhost:3002                 |
| MinIO console      | http://localhost:9001                 |

Default seed credentials: `admin@learnhub.com` / `Admin@123`.

## Backup & restore

**Postgres**

```bash
# Backup
docker compose -f docker-compose.instance.yml exec -T postgres \
  pg_dump -U learnhub -F c learnhub_db > backup-$(date +%F).dump

# Restore (into an empty DB)
cat backup-2026-07-17.dump | docker compose -f docker-compose.instance.yml exec -T postgres \
  pg_restore -U learnhub -d learnhub_db --clean --if-exists
```

**MinIO objects**

```bash
docker compose -f docker-compose.instance.yml exec minio \
  mc mirror local/learnhub-media /data/backup/learnhub-media
```

Volumes (`pgdata`, `redisdata`, `esdata`, `miniodata`) persist across restarts;
back them up at the filesystem level too if you snapshot the host.

## Troubleshooting

| Symptom                                   | Fix                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `api` unhealthy / restart loop            | `docker compose ... logs api`; usually a bad `DATABASE_URL`.        |
| Elasticsearch exits with code 137         | Raise Docker memory limit or `vm.max_map_count=262144` on the host. |
| Uploads fail with `NoSuchBucket`          | Re-run `minio-init` or create the bucket in the MinIO console.      |
| `pg_isready` never healthy                | Check `POSTGRES_PASSWORD` matches the one in `DATABASE_URL`.        |
| Web can't reach API                       | Set `PUBLIC_API_URL` to a browser-reachable URL, not `http://api`.  |

## Stop / remove

```bash
docker compose -f docker-compose.instance.yml down          # stop, keep data
docker compose -f docker-compose.instance.yml down -v       # stop + delete volumes (DESTRUCTIVE)
```
