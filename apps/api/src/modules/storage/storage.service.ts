import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { S3Client } from '@aws-sdk/client-s3'

@Injectable()
export class StorageService {
  private client: S3Client | null = null

  constructor(private readonly config: ConfigService) {}

  private isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('AWS_ACCESS_KEY_ID') &&
        this.config.get<string>('AWS_SECRET_ACCESS_KEY') &&
        this.config.get<string>('AWS_BUCKET_NAME') &&
        this.config.get<string>('AWS_REGION'),
    )
  }

  private bucket(): string {
    return this.config.getOrThrow<string>('AWS_BUCKET_NAME')
  }

  /** Lazily builds the S3 client; only imported/instantiated when configured. */
  private async getClient(): Promise<S3Client> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Storage not configured')
    }
    if (!this.client) {
      const { S3Client: Client } = await import('@aws-sdk/client-s3')
      this.client = new Client({
        region: this.config.getOrThrow<string>('AWS_REGION'),
        credentials: {
          accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.config.getOrThrow<string>(
            'AWS_SECRET_ACCESS_KEY',
          ),
        },
      })
    }
    return this.client
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    maxSize?: number,
  ) {
    const client = await this.getClient()
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    const command = new PutObjectCommand({
      Bucket: this.bucket(),
      Key: key,
      ContentType: contentType,
      ...(maxSize ? { ContentLength: maxSize } : {}),
    })
    const url = await getSignedUrl(client, command, { expiresIn: 900 })
    return { url, key, ...(maxSize ? { maxSize } : {}) }
  }

  async getPresignedDownloadUrl(key: string) {
    const client = await this.getClient()
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
    const command = new GetObjectCommand({ Bucket: this.bucket(), Key: key })
    const url = await getSignedUrl(client, command, { expiresIn: 900 })
    return { url, key }
  }

  async deleteFile(key: string) {
    const client = await this.getClient()
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }),
    )
    return { deleted: true, key }
  }

  async copyFile(sourceKey: string, destKey: string) {
    const client = await this.getClient()
    const { CopyObjectCommand } = await import('@aws-sdk/client-s3')
    await client.send(
      new CopyObjectCommand({
        Bucket: this.bucket(),
        CopySource: `${this.bucket()}/${sourceKey}`,
        Key: destKey,
      }),
    )
    return { copied: true, sourceKey, destKey }
  }
}
