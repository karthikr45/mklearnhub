# Instance provisioning scripts

Standalone [`tsx`](https://github.com/privatenumber/tsx) scripts that create and
tear down **dedicated** LearnHub instances — an isolated Postgres database,
object-storage bucket and vanity subdomain (`<subdomain>.learnhub.com`) per
enterprise/education customer.

The scripts use only Node built-ins and the global `fetch`, so they run without
`pnpm install` and without importing any workspace package. Every external call
is **guarded**: when a credential is missing the step is logged and skipped,
which makes a local dry-run safe.

## Usage

```bash
# Provision a new instance
pnpm tsx infra/scripts/provision-instance.ts <orgId> <subdomain>
# e.g.
pnpm tsx infra/scripts/provision-instance.ts org_acme acme

# Tear an instance down (destructive steps require an explicit confirmation)
CONFIRM_DESTROY=acme pnpm tsx infra/scripts/deprovision-instance.ts org_acme acme
```

If `tsx` is not installed globally, run it through the workspace dev dependency:
`pnpm dlx tsx infra/scripts/provision-instance.ts ...`.

## Environment variables

| Variable                 | Used by         | Purpose                                                        |
| ------------------------ | --------------- | -------------------------------------------------------------- |
| `NEON_API_KEY`           | provision/deprov| Neon API key. **Missing → DB step is skipped (placeholder).**  |
| `NEON_REGION`            | provision       | Neon region id (default `aws-ap-south-1`).                     |
| `NEON_PROJECT_ID`        | deprovision     | Neon project to delete (from the control-plane record).        |
| `ALLOW_MIGRATE`          | provision       | Set `true` to actually run `prisma migrate deploy`.            |
| `CLOUDFLARE_API_TOKEN`   | provision/deprov| Cloudflare token with DNS edit scope.                          |
| `CLOUDFLARE_ZONE_ID`     | provision/deprov| Zone id for `learnhub.com`.                                    |
| `CLOUDFLARE_RECORD_ID`   | deprovision     | DNS record to delete (from the control-plane record).          |
| `INGRESS_HOSTNAME`       | provision       | CNAME target (default `ingress.learnhub.com`).                 |
| `AWS_REGION` / `S3_ENDPOINT` | provision   | Bucket creation (AWS S3 or Cloudflare R2 endpoint).           |
| `CONFIRM_DESTROY`        | deprovision     | Must equal `<subdomain>` before any destructive call runs.     |

## What each step does

**provision-instance.ts**

1. Create a dedicated Postgres DB via the Neon API.
2. Create a dedicated, versioned, private S3/R2 bucket.
3. `prisma migrate deploy` against the new DB.
4. Seed baseline data (roles, templates, org admin).
5. Mark the `DedicatedInstance` record `ACTIVE` in the control-plane DB.
6. Create a proxied Cloudflare CNAME.
7. Send the welcome email.

**deprovision-instance.ts** reverses it: backup → delete DB → delete bucket →
remove DNS → mark `DEPROVISIONED`.
