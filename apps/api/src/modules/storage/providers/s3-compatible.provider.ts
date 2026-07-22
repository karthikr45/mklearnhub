import { ServiceUnavailableException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { S3Client } from '@aws-sdk/client-s3'

import type {
  ListedObject,
  ObjectMetadata,
  PutOptions,
  SignedUrlOptions,
  StorageProvider,
} from '../storage-provider.interface'

/**
 * One adapter for every S3-compatible provider — AWS S3, Cloudflare R2,
 * Backblaze B2, Wasabi, DigitalOcean Spaces, MinIO. The differences are all
 * configuration (endpoint, region, path-style), so no per-provider code.
 *
 * Reads STORAGE_* config, falling back to the legacy AWS_* names so existing
 * deployments keep working. The S3 SDK is imported lazily — constructing this
 * class never opens a connection.
 */
export class S3CompatibleStorageProvider implements StorageProvider {
  readonly name: string
  private client: S3Client | null = null

  constructor(private readonly config: ConfigService) {
    this.name = this.cfg('STORAGE_PROVIDER') ?? 's3'
  }

  private cfg(key: string): string | undefined {
    return this.config.get<string>(key)
  }

  private region(): string {
    return this.cfg('STORAGE_REGION') ?? this.cfg('AWS_REGION') ?? 'auto'
  }
  private accessKeyId(): string | undefined {
    return this.cfg('STORAGE_ACCESS_KEY_ID') ?? this.cfg('AWS_ACCESS_KEY_ID')
  }
  private secretAccessKey(): string | undefined {
    return this.cfg('STORAGE_SECRET_ACCESS_KEY') ?? this.cfg('AWS_SECRET_ACCESS_KEY')
  }
  private bucketName(): string | undefined {
    return this.cfg('STORAGE_BUCKET') ?? this.cfg('AWS_BUCKET_NAME')
  }
  private endpoint(): string | undefined {
    return this.cfg('STORAGE_ENDPOINT') // unset for AWS; set for R2/B2/Wasabi/MinIO
  }
  private publicBase(): string | undefined {
    return this.cfg('STORAGE_PUBLIC_BASE_URL')
  }
  private forcePathStyle(): boolean {
    return this.cfg('STORAGE_FORCE_PATH_STYLE') === 'true'
  }

  isConfigured(): boolean {
    return Boolean(this.accessKeyId() && this.secretAccessKey() && this.bucketName())
  }

  private bucket(): string {
    const b = this.bucketName()
    if (!b) throw new ServiceUnavailableException('Storage bucket not configured')
    return b
  }

  private async getClient(): Promise<S3Client> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Storage not configured')
    }
    if (!this.client) {
      const { S3Client: Client } = await import('@aws-sdk/client-s3')
      const endpoint = this.endpoint()
      this.client = new Client({
        region: this.region(),
        credentials: {
          accessKeyId: this.accessKeyId() as string,
          secretAccessKey: this.secretAccessKey() as string,
        },
        ...(endpoint ? { endpoint } : {}),
        ...(endpoint || this.forcePathStyle() ? { forcePathStyle: this.forcePathStyle() } : {}),
      })
    }
    return this.client
  }

  async uploadBuffer(
    key: string,
    body: Buffer,
    opts?: PutOptions,
  ): Promise<ObjectMetadata> {
    const client = await this.getClient()
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: body,
        ...(opts?.contentType ? { ContentType: opts.contentType } : {}),
        ...(opts?.cacheControl ? { CacheControl: opts.cacheControl } : {}),
      }),
    )
    return {
      key,
      size: body.byteLength,
      ...(opts?.contentType ? { contentType: opts.contentType } : {}),
    }
  }

  async uploadStream(
    key: string,
    body: NodeJS.ReadableStream,
    opts?: PutOptions & { contentLength?: number },
  ): Promise<ObjectMetadata> {
    const client = await this.getClient()
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: body as unknown as Buffer,
        ...(opts?.contentType ? { ContentType: opts.contentType } : {}),
        ...(opts?.cacheControl ? { CacheControl: opts.cacheControl } : {}),
        ...(opts?.contentLength ? { ContentLength: opts.contentLength } : {}),
      }),
    )
    return {
      key,
      size: opts?.contentLength ?? 0,
      ...(opts?.contentType ? { contentType: opts.contentType } : {}),
    }
  }

  async deleteFile(key: string): Promise<void> {
    const client = await this.getClient()
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }))
  }

  async copyFile(sourceKey: string, destKey: string): Promise<void> {
    const client = await this.getClient()
    const { CopyObjectCommand } = await import('@aws-sdk/client-s3')
    await client.send(
      new CopyObjectCommand({
        Bucket: this.bucket(),
        CopySource: `${this.bucket()}/${sourceKey}`,
        Key: destKey,
      }),
    )
  }

  async moveFile(sourceKey: string, destKey: string): Promise<void> {
    await this.copyFile(sourceKey, destKey)
    await this.deleteFile(sourceKey)
  }

  async getMetadata(key: string): Promise<ObjectMetadata | null> {
    const client = await this.getClient()
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3')
    try {
      const r = await client.send(
        new HeadObjectCommand({ Bucket: this.bucket(), Key: key }),
      )
      return {
        key,
        size: r.ContentLength ?? 0,
        ...(r.ContentType ? { contentType: r.ContentType } : {}),
        ...(r.ETag ? { etag: r.ETag } : {}),
        ...(r.LastModified ? { lastModified: r.LastModified } : {}),
      }
    } catch {
      return null
    }
  }

  async fileExists(key: string): Promise<boolean> {
    return (await this.getMetadata(key)) !== null
  }

  async listObjects(prefix: string, limit = 1000): Promise<ListedObject[]> {
    const client = await this.getClient()
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
    const r = await client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket(),
        Prefix: prefix,
        MaxKeys: limit,
      }),
    )
    return (r.Contents ?? []).map((o) => ({
      key: o.Key ?? '',
      size: o.Size ?? 0,
      ...(o.LastModified ? { lastModified: o.LastModified } : {}),
    }))
  }

  async generateSignedUploadUrl(
    key: string,
    opts?: SignedUrlOptions,
  ): Promise<string> {
    const client = await this.getClient()
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    const command = new PutObjectCommand({
      Bucket: this.bucket(),
      Key: key,
      ...(opts?.contentType ? { ContentType: opts.contentType } : {}),
      ...(opts?.maxSize ? { ContentLength: opts.maxSize } : {}),
    })
    return getSignedUrl(client, command, { expiresIn: opts?.expiresIn ?? 900 })
  }

  async generateSignedDownloadUrl(
    key: string,
    opts?: SignedUrlOptions,
  ): Promise<string> {
    const client = await this.getClient()
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    const command = new GetObjectCommand({ Bucket: this.bucket(), Key: key })
    return getSignedUrl(client, command, { expiresIn: opts?.expiresIn ?? 900 })
  }

  getPublicOrCdnUrl(key: string): string | null {
    const base = this.publicBase()
    if (!base) return null
    return `${base.replace(/\/$/, '')}/${key}`
  }
}
