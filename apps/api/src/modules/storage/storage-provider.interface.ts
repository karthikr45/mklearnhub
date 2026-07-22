/**
 * Provider-agnostic storage contract. Business/domain code depends only on this
 * interface — never on a concrete provider (S3, R2, B2, Wasabi, Spaces, MinIO,
 * Azure, GCS). The active provider is chosen by configuration (STORAGE_PROVIDER)
 * and swapped without touching curriculum/content code.
 *
 * Canonical file identity is NEVER a provider URL. It is
 * `{ provider, bucket, key, checksum, version }`; delivery URLs are generated
 * on demand. This is what makes R2 → S3 → B2 migration safe.
 */

export interface ObjectMetadata {
  key: string
  size: number
  contentType?: string
  etag?: string
  lastModified?: Date
}

export interface SignedUrlOptions {
  /** Seconds until the signed URL expires (default 900). */
  expiresIn?: number
  contentType?: string
  /** Max upload size in bytes (upload URLs only). */
  maxSize?: number
}

export interface ListedObject {
  key: string
  size: number
  lastModified?: Date
}

export interface PutOptions {
  contentType?: string
  /** Cache-Control header — long immutable caching for content-addressed keys. */
  cacheControl?: string
}

export interface StorageProvider {
  /** Stable provider id, e.g. "s3", "r2", "b2", "azure". */
  readonly name: string
  /** True when credentials/bucket are present; false → degrade gracefully. */
  isConfigured(): boolean

  uploadBuffer(key: string, body: Buffer, opts?: PutOptions): Promise<ObjectMetadata>
  uploadStream(
    key: string,
    body: NodeJS.ReadableStream,
    opts?: PutOptions & { contentLength?: number },
  ): Promise<ObjectMetadata>
  deleteFile(key: string): Promise<void>
  copyFile(sourceKey: string, destKey: string): Promise<void>
  moveFile(sourceKey: string, destKey: string): Promise<void>

  getMetadata(key: string): Promise<ObjectMetadata | null>
  fileExists(key: string): Promise<boolean>
  listObjects(prefix: string, limit?: number): Promise<ListedObject[]>

  generateSignedUploadUrl(key: string, opts?: SignedUrlOptions): Promise<string>
  generateSignedDownloadUrl(key: string, opts?: SignedUrlOptions): Promise<string>

  /**
   * Public/CDN URL for an object served publicly (uses STORAGE_PUBLIC_BASE_URL
   * when set). Returns null when no public base is configured — callers then
   * fall back to a private signed URL.
   */
  getPublicOrCdnUrl(key: string): string | null
}

/** SHA-256 hex checksum of a buffer — for dedup and integrity. Provider-neutral. */
export async function checksumOf(body: Buffer): Promise<string> {
  const { createHash } = await import('node:crypto')
  return createHash('sha256').update(body).digest('hex')
}

/** Asset-centric, immutable storage key: content/{type}/{assetId}/{filename}. */
export function assetKey(type: string, assetId: string, filename: string): string {
  const safeType = type.toLowerCase().replace(/[^a-z0-9-]/g, '')
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `content/${safeType}/${assetId}/${safeName}`
}
