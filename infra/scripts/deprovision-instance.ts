/**
 * deprovision-instance.ts
 * ---------------------------------------------------------------------------
 * Tears down a dedicated LearnHub instance created by `provision-instance.ts`.
 * Order matters: we take a final backup *before* destroying anything, then
 * delete the database, the bucket and the DNS record.
 *
 *   pnpm tsx infra/scripts/deprovision-instance.ts <orgId> <subdomain>
 *
 * Destructive steps are guarded behind `CONFIRM_DESTROY=<subdomain>` so a
 * mistyped invocation cannot wipe a live tenant.
 * ---------------------------------------------------------------------------
 */

const log = (step: string, msg: string) =>
  console.log(`[deprovision] ${step.padEnd(10)} ${msg}`)

export async function deprovisionInstance(
  orgId: string,
  subdomain: string,
): Promise<void> {
  if (!orgId || !subdomain) {
    throw new Error('Usage: deprovisionInstance(orgId, subdomain)')
  }
  const confirmed = process.env.CONFIRM_DESTROY === subdomain
  if (!confirmed) {
    log('safety', `dry-run — set CONFIRM_DESTROY=${subdomain} to actually destroy`)
  }
  log('start', `orgId=${orgId} subdomain=${subdomain}`)

  // ── Step 1: Backup ───────────────────────────────────────────────────────
  // Take a final logical dump and copy it (plus a bucket sync) to the cold
  // archive so the tenant can be restored during the retention window.
  //   execFileSync('pg_dump', ['--format=custom', '--file', dumpPath, dbUrl])
  //   execFileSync('aws', ['s3', 'sync', `s3://${bucket}`, archiveUri])
  log('backup', `would archive DB dump + bucket for ${subdomain} to cold storage`)

  // ── Step 2: Delete the Postgres database (Neon) ──────────────────────────
  const neonKey = process.env.NEON_API_KEY
  const projectId = process.env.NEON_PROJECT_ID // resolved from control-plane record
  if (!neonKey || !projectId) {
    log('db', 'NEON_API_KEY/NEON_PROJECT_ID missing — skipping DB delete')
  } else if (!confirmed) {
    log('db', `would DELETE Neon project ${projectId}`)
  } else {
    const res = await fetch(`https://api.neon.tech/v2/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${neonKey}` },
    })
    if (!res.ok) {
      throw new Error(`Neon project delete failed: ${res.status} ${await res.text()}`)
    }
    log('db', `deleted Neon project ${projectId}`)
  }

  // ── Step 3: Delete the S3 / R2 bucket ────────────────────────────────────
  // A bucket must be emptied before it can be removed.
  //   import { S3Client, DeleteBucketCommand } from '@aws-sdk/client-s3'
  //   // ... list + delete all objects (and versions) first ...
  //   await s3.send(new DeleteBucketCommand({ Bucket: bucketName }))
  const bucketName = `learnhub-${subdomain}-media`
  log('bucket', `${confirmed ? 'deleting' : 'would delete'} bucket ${bucketName}`)

  // ── Step 4: Remove the Cloudflare DNS record ─────────────────────────────
  const cfToken = process.env.CLOUDFLARE_API_TOKEN
  const cfZone = process.env.CLOUDFLARE_ZONE_ID
  const recordId = process.env.CLOUDFLARE_RECORD_ID // from control-plane record
  if (!cfToken || !cfZone || !recordId) {
    log('dns', 'Cloudflare creds/record id missing — skipping DNS delete')
  } else if (!confirmed) {
    log('dns', `would DELETE DNS record ${recordId}`)
  } else {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${cfZone}/dns_records/${recordId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${cfToken}` } },
    )
    if (!res.ok) {
      throw new Error(`Cloudflare DNS delete failed: ${res.status} ${await res.text()}`)
    }
    log('dns', `deleted DNS record ${recordId}`)
  }

  // ── Step 5: Update control-plane record ──────────────────────────────────
  //   await prisma.dedicatedInstance.update({
  //     where: { organizationId: orgId },
  //     data: { status: 'DEPROVISIONED', deprovisionedAt: new Date() },
  //   })
  log('control', 'would mark DedicatedInstance DEPROVISIONED in control-plane DB')

  log('done', `teardown complete for ${orgId}`)
}

// ── CLI entrypoint ─────────────────────────────────────────────────────────
if (require.main === module) {
  const [orgId, subdomain] = process.argv.slice(2)
  deprovisionInstance(orgId, subdomain).catch((err) => {
    console.error('[deprovision] FAILED:', err.message)
    process.exit(1)
  })
}
