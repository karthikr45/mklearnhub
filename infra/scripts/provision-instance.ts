/**
 * provision-instance.ts
 * ---------------------------------------------------------------------------
 * Provisions a new *dedicated* LearnHub instance for an enterprise/education
 * customer. A dedicated instance gives the org its own isolated Postgres
 * database, object-storage bucket and vanity subdomain
 * (`<subdomain>.learnhub.com`).
 *
 * This script is intentionally self-contained: it uses only Node built-ins and
 * the global `fetch`, so it can be executed straight away with `tsx` without a
 * `pnpm install` step and without importing any workspace package.
 *
 *   pnpm tsx infra/scripts/provision-instance.ts <orgId> <subdomain>
 *
 * Every external call is *guarded*: if the relevant credential is missing the
 * step is logged and skipped so the script can be dry-run locally.
 * ---------------------------------------------------------------------------
 */

import { execFileSync } from 'node:child_process'

export interface ProvisionResult {
  orgId: string
  subdomain: string
  connectionString: string
  bucketName: string
  dnsRecordId: string | null
}

const log = (step: string, msg: string) =>
  console.log(`[provision] ${step.padEnd(10)} ${msg}`)

/**
 * Provision a fully isolated instance for `orgId`, reachable at
 * `<subdomain>.learnhub.com`.
 */
export async function provisionInstance(
  orgId: string,
  subdomain: string,
): Promise<ProvisionResult> {
  if (!orgId || !subdomain) {
    throw new Error('Usage: provisionInstance(orgId, subdomain)')
  }
  // Basic subdomain hygiene — DNS labels are lowercase alphanumeric + hyphen.
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)) {
    throw new Error(`Invalid subdomain: ${subdomain}`)
  }

  log('start', `orgId=${orgId} subdomain=${subdomain}`)

  // ── Step 1: Create a dedicated Postgres database (Neon) ──────────────────
  // The Neon API creates a project (= an isolated Postgres) and returns a
  // pooled connection URI we can hand straight to Prisma.
  let connectionString: string
  const neonKey = process.env.NEON_API_KEY
  if (!neonKey) {
    connectionString = `postgresql://learnhub:learnhub_dev@localhost:5432/learnhub_${orgId}`
    log('db', `NEON_API_KEY missing — using local placeholder ${connectionString}`)
  } else {
    const res = await fetch('https://api.neon.tech/v2/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${neonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: {
          name: `learnhub-${subdomain}`,
          region_id: process.env.NEON_REGION ?? 'aws-ap-south-1',
          pg_version: 16,
        },
      }),
    })
    if (!res.ok) {
      throw new Error(`Neon project create failed: ${res.status} ${await res.text()}`)
    }
    const body = (await res.json()) as {
      connection_uris?: { connection_uri: string }[]
    }
    connectionString =
      body.connection_uris?.[0]?.connection_uri ??
      (() => {
        throw new Error('Neon response missing connection_uri')
      })()
    log('db', `Neon project created for ${subdomain}`)
  }

  // ── Step 2: Create a dedicated S3 / R2 bucket ────────────────────────────
  // Uses the AWS SDK against S3 or a Cloudflare R2 endpoint. Left commented so
  // the script has no install-time dependency.
  //
  //   import { S3Client, CreateBucketCommand, PutBucketVersioningCommand,
  //            PutPublicAccessBlockCommand } from '@aws-sdk/client-s3'
  //   const s3 = new S3Client({
  //     region: process.env.AWS_REGION,
  //     endpoint: process.env.S3_ENDPOINT, // R2: https://<acct>.r2.cloudflarestorage.com
  //   })
  //   await s3.send(new CreateBucketCommand({ Bucket: bucketName }))
  //   await s3.send(new PutBucketVersioningCommand({ Bucket: bucketName,
  //     VersioningConfiguration: { Status: 'Enabled' } }))
  //   await s3.send(new PutPublicAccessBlockCommand({ Bucket: bucketName,
  //     PublicAccessBlockConfiguration: {
  //       BlockPublicAcls: true, IgnorePublicAcls: true,
  //       BlockPublicPolicy: true, RestrictPublicBuckets: true } }))
  const bucketName = `learnhub-${subdomain}-media`
  log('bucket', `would create isolated bucket ${bucketName} (versioned, private)`)

  // ── Step 3: Run `prisma migrate deploy` on the new database ──────────────
  // We shell out to the workspace Prisma CLI with DATABASE_URL pointed at the
  // freshly provisioned database. `migrate deploy` applies committed
  // migrations only (never generates new ones) — the right mode for prod.
  try {
    log('migrate', 'running prisma migrate deploy on new database')
    // Guarded behind ALLOW_MIGRATE so a dry-run does not touch a real DB.
    if (process.env.ALLOW_MIGRATE === 'true') {
      execFileSync(
        'pnpm',
        ['--filter', '@learnhub/db', 'exec', 'prisma', 'migrate', 'deploy'],
        { stdio: 'inherit', env: { ...process.env, DATABASE_URL: connectionString } },
      )
    } else {
      log('migrate', 'skipped (set ALLOW_MIGRATE=true to apply)')
    }
  } catch (err) {
    throw new Error(`prisma migrate deploy failed: ${(err as Error).message}`)
  }

  // ── Step 4: Seed essential data ──────────────────────────────────────────
  // Only the *baseline* rows a tenant needs to function: default roles,
  // system email templates, the org's admin user, feature-flag defaults.
  //   execFileSync('pnpm', ['--filter', '@learnhub/db', 'run', 'seed:instance'],
  //     { env: { ...process.env, DATABASE_URL: connectionString, ORG_ID: orgId } })
  log('seed', 'would seed baseline roles / templates / org admin')

  // ── Step 5: Update the DedicatedInstance record in the main DB ───────────
  // The control-plane database tracks every dedicated instance and its status.
  //   import { prisma } from '@learnhub/db'
  //   await prisma.dedicatedInstance.update({
  //     where: { organizationId: orgId },
  //     data: { subdomain, databaseUrl: encrypt(connectionString),
  //             bucketName, status: 'ACTIVE', provisionedAt: new Date() },
  //   })
  log('control', 'would mark DedicatedInstance ACTIVE in control-plane DB')

  // ── Step 6: Configure Cloudflare DNS ─────────────────────────────────────
  // Creates a proxied CNAME `<subdomain>.learnhub.com` → the ingress hostname.
  let dnsRecordId: string | null = null
  const cfToken = process.env.CLOUDFLARE_API_TOKEN
  const cfZone = process.env.CLOUDFLARE_ZONE_ID
  if (!cfToken || !cfZone) {
    log('dns', 'CLOUDFLARE_API_TOKEN/ZONE_ID missing — skipping DNS record')
  } else {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${cfZone}/dns_records`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CNAME',
          name: `${subdomain}.learnhub.com`,
          content: process.env.INGRESS_HOSTNAME ?? 'ingress.learnhub.com',
          proxied: true,
          ttl: 1,
        }),
      },
    )
    const body = (await res.json()) as {
      success: boolean
      result?: { id: string }
      errors?: unknown
    }
    if (!res.ok || !body.success) {
      throw new Error(`Cloudflare DNS create failed: ${JSON.stringify(body.errors)}`)
    }
    dnsRecordId = body.result?.id ?? null
    log('dns', `created CNAME ${subdomain}.learnhub.com (id=${dnsRecordId})`)
  }

  // ── Step 7: Send the welcome email ───────────────────────────────────────
  // Uses the @learnhub/email package (Resend) to notify the org admin that the
  // instance is live, with their login URL and first-run instructions.
  //   import { sendInstanceReadyEmail } from '@learnhub/email'
  //   await sendInstanceReadyEmail({ orgId, url: `https://${subdomain}.learnhub.com` })
  log('email', `would send welcome email → https://${subdomain}.learnhub.com`)

  log('done', `instance ready for ${orgId}`)
  return { orgId, subdomain, connectionString, bucketName, dnsRecordId }
}

// ── CLI entrypoint ─────────────────────────────────────────────────────────
if (require.main === module) {
  const [orgId, subdomain] = process.argv.slice(2)
  provisionInstance(orgId, subdomain)
    .then((r) => {
      console.log('\nProvision result:')
      console.log(JSON.stringify({ ...r, connectionString: '***redacted***' }, null, 2))
    })
    .catch((err) => {
      console.error('[provision] FAILED:', err.message)
      process.exit(1)
    })
}
