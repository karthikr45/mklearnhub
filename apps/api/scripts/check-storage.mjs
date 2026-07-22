/**
 * Storage connectivity check — proves the configured object-storage provider
 * (R2 / S3 / B2 / Wasabi / Spaces / MinIO) works, WITHOUT touching the database.
 *
 * It uploads a tiny text object, reads its metadata, generates a signed URL,
 * then deletes it. Nothing else is written anywhere.
 *
 * Run (Node 20+ loads the .env for you):
 *   node --env-file=apps/api/.env apps/api/scripts/check-storage.mjs
 *
 * Uses STORAGE_* config, falling back to legacy AWS_* names — the same
 * resolution the app uses.
 */
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const env = process.env
const cfg = (k, ...fallbacks) => env[k] ?? fallbacks.map((f) => env[f]).find(Boolean)

const provider = (cfg('STORAGE_PROVIDER') ?? 's3').toLowerCase()
const region = cfg('STORAGE_REGION', 'AWS_REGION') ?? 'auto'
const accessKeyId = cfg('STORAGE_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID')
const secretAccessKey = cfg('STORAGE_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY')
const bucket = cfg('STORAGE_BUCKET', 'AWS_BUCKET_NAME')
const endpoint = cfg('STORAGE_ENDPOINT')
const forcePathStyle = cfg('STORAGE_FORCE_PATH_STYLE') === 'true'

console.log(`\n▶ Storage check — provider=${provider}`)
console.log(`  endpoint = ${endpoint ?? '(AWS default)'}`)
console.log(`  region   = ${region}`)
console.log(`  bucket   = ${bucket ?? '(missing!)'}`)

if (!accessKeyId || !secretAccessKey || !bucket) {
  console.error(
    '\n❌ Missing config. Set STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY and STORAGE_BUCKET in apps/api/.env\n',
  )
  process.exit(1)
}

const client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
  ...(endpoint ? { endpoint } : {}),
  ...(endpoint || forcePathStyle ? { forcePathStyle } : {}),
})

const key = `content/_healthcheck/${Date.now()}.txt`
const body = 'LearnHub storage health check — safe to delete.'

try {
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'text/plain' }),
  )
  console.log(`\n✅ Upload OK      → ${key}`)

  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  console.log(`✅ Read metadata  → ${head.ContentLength} bytes, ${head.ContentType}`)

  const url = await getSignedUrl(
    client,
    new (await import('@aws-sdk/client-s3')).GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 300 },
  )
  console.log(`✅ Signed URL     → ${url.slice(0, 90)}…`)

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  console.log(`✅ Delete OK      → cleaned up`)

  console.log('\n🎉 Storage is correctly configured. Your database was not touched.\n')
} catch (err) {
  console.error('\n❌ Storage check failed:')
  console.error(`   ${err.name}: ${err.message}`)
  if (String(err.message).match(/hostname|ENOTFOUND|SignatureDoesNotMatch|resolve/i)) {
    console.error('   Tip: for R2, double-check STORAGE_ENDPOINT and try STORAGE_FORCE_PATH_STYLE=true.')
  }
  process.exit(1)
}
