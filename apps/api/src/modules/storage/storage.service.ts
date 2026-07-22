import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { S3CompatibleStorageProvider } from './providers/s3-compatible.provider'
import {
  assetKey,
  checksumOf,
  type ListedObject,
  type ObjectMetadata,
  type PutOptions,
  type StorageProvider,
} from './storage-provider.interface'

/**
 * Thin Nest-facing facade over the configured StorageProvider. Business code
 * depends on this service (or the interface) — never on a concrete provider.
 * The provider is chosen by STORAGE_PROVIDER; today every value maps to the
 * S3-compatible adapter (covers S3/R2/B2/Wasabi/Spaces/MinIO). Azure/GCS
 * adapters can be added to the switch without changing any caller.
 */
@Injectable()
export class StorageService {
  private readonly provider: StorageProvider

  constructor(private readonly config: ConfigService) {
    const name = (this.config.get<string>('STORAGE_PROVIDER') ?? 's3').toLowerCase()
    switch (name) {
      // All S3-compatible providers share one adapter (config differs only).
      case 's3':
      case 'r2':
      case 'b2':
      case 'wasabi':
      case 'spaces':
      case 'minio':
      default:
        this.provider = new S3CompatibleStorageProvider(this.config)
        break
    }
  }

  /** Active provider id (e.g. "s3", "r2"). */
  providerName(): string {
    return this.provider.name
  }

  isConfigured(): boolean {
    return this.provider.isConfigured()
  }

  // ── Backward-compatible API (unchanged signatures) ──────────────
  async getPresignedUploadUrl(key: string, contentType: string, maxSize?: number) {
    const url = await this.provider.generateSignedUploadUrl(key, {
      contentType,
      ...(maxSize ? { maxSize } : {}),
    })
    return { url, key, ...(maxSize ? { maxSize } : {}) }
  }

  async getPresignedDownloadUrl(key: string) {
    const url = await this.provider.generateSignedDownloadUrl(key)
    return { url, key }
  }

  async deleteFile(key: string) {
    await this.provider.deleteFile(key)
    return { deleted: true, key }
  }

  async copyFile(sourceKey: string, destKey: string) {
    await this.provider.copyFile(sourceKey, destKey)
    return { copied: true, sourceKey, destKey }
  }

  // ── Extended API for the content system ─────────────────────────
  uploadBuffer(key: string, body: Buffer, opts?: PutOptions): Promise<ObjectMetadata> {
    return this.provider.uploadBuffer(key, body, opts)
  }
  moveFile(sourceKey: string, destKey: string): Promise<void> {
    return this.provider.moveFile(sourceKey, destKey)
  }
  getMetadata(key: string): Promise<ObjectMetadata | null> {
    return this.provider.getMetadata(key)
  }
  fileExists(key: string): Promise<boolean> {
    return this.provider.fileExists(key)
  }
  listObjects(prefix: string, limit?: number): Promise<ListedObject[]> {
    return this.provider.listObjects(prefix, limit)
  }

  /**
   * Delivery URL for a content asset: prefer the public/CDN base for
   * immutable public assets, otherwise a short-lived private signed URL.
   */
  async deliveryUrl(key: string, isPublic: boolean): Promise<string> {
    if (isPublic) {
      const cdn = this.provider.getPublicOrCdnUrl(key)
      if (cdn) return cdn
    }
    return this.provider.generateSignedDownloadUrl(key)
  }

  /** SHA-256 of a buffer — for dedup/integrity (provider-neutral helper). */
  checksum(body: Buffer): Promise<string> {
    return checksumOf(body)
  }

  /** Asset-centric immutable key: content/{type}/{assetId}/{filename}. */
  keyFor(type: string, assetId: string, filename: string): string {
    return assetKey(type, assetId, filename)
  }
}
