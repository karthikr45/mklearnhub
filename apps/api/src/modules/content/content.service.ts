import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { StorageService } from '../storage/storage.service'
import {
  CompleteUploadDto,
  CreateContentDto,
  CreateMappingDto,
  RequestUploadDto,
} from './dto/content.dto'
import { canSelfHost, type ContentSourceTypeStr } from './license-gate'

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /** Maps the DTO's rights fields onto ContentAsset columns (safe defaults). */
  private licenseData(dto: {
    sourceType: string
    copyrightOwner?: string
    licenseType?: string
    sourceName?: string
    sourceUrl?: string
    licenseUrl?: string
    commercialUseAllowed?: boolean
    redistributionAllowed?: boolean
    selfHostingAllowed?: boolean
    modificationAllowed?: boolean
    attributionRequired?: boolean
    attributionText?: string
    licenseVerified?: boolean
  }): Prisma.ContentAssetCreateInput {
    return {
      title: '', // overwritten by caller
      contentType: 'RICH_TEXT', // overwritten by caller
      sourceType: dto.sourceType as never,
      ...(dto.copyrightOwner ? { copyrightOwner: dto.copyrightOwner } : {}),
      ...(dto.licenseType ? { licenseType: dto.licenseType as never } : {}),
      ...(dto.sourceName ? { sourceName: dto.sourceName } : {}),
      ...(dto.sourceUrl ? { sourceUrl: dto.sourceUrl } : {}),
      ...(dto.licenseUrl ? { licenseUrl: dto.licenseUrl } : {}),
      commercialUseAllowed: dto.commercialUseAllowed ?? false,
      redistributionAllowed: dto.redistributionAllowed ?? false,
      selfHostingAllowed: dto.selfHostingAllowed ?? false,
      modificationAllowed: dto.modificationAllowed ?? false,
      attributionRequired: dto.attributionRequired ?? false,
      ...(dto.attributionText ? { attributionText: dto.attributionText } : {}),
      licenseVerified: dto.licenseVerified ?? false,
    }
  }

  /**
   * Step 1 of an upload: enforce the license gate, create a DRAFT asset, and
   * return a presigned URL the browser PUTs the file to directly (bytes never
   * touch the API server). Refused when the file may not be self-hosted.
   */
  async requestUpload(userId: string, dto: RequestUploadDto) {
    const gate = canSelfHost({
      sourceType: dto.sourceType as ContentSourceTypeStr,
      selfHostingAllowed: dto.selfHostingAllowed ?? false,
      commercialUseAllowed: dto.commercialUseAllowed ?? false,
      licenseVerified: dto.licenseVerified ?? false,
    })
    if (!gate.allowed) {
      throw new ForbiddenException(
        `Upload blocked: ${gate.reason} Store it as an official external reference instead.`,
      )
    }
    if (!this.storage.isConfigured()) {
      throw new BadRequestException(
        'Object storage is not configured. Set STORAGE_* env vars first.',
      )
    }

    const base = this.licenseData(dto)
    const asset = await this.prisma.contentAsset.create({
      data: {
        ...base,
        title: dto.title,
        ...(dto.description ? { description: dto.description } : {}),
        contentType: dto.contentType as never,
        mimeType: dto.mimeType,
        storageProvider: this.storage.providerName(),
        storageBucket: this.storage.bucketName(),
        status: 'DRAFT',
      },
    })

    const key = this.storage.keyFor(dto.contentType, asset.id, dto.filename)
    await this.prisma.contentAsset.update({
      where: { id: asset.id },
      data: { storageKey: key },
    })
    const { url } = await this.storage.getPresignedUploadUrl(key, dto.mimeType)

    await this.audit.log({
      userId,
      action: 'content.upload_requested',
      resource: 'ContentAsset',
      resourceId: asset.id,
      newValues: { title: dto.title, sourceType: dto.sourceType },
    })
    return { assetId: asset.id, uploadUrl: url, storageKey: key, method: 'PUT' }
  }

  /** Step 2: after the browser uploads, confirm the object and record size. */
  async completeUpload(userId: string, id: string, dto: CompleteUploadDto) {
    const asset = await this.prisma.contentAsset.findUnique({ where: { id } })
    if (!asset || !asset.storageKey) throw new NotFoundException('Asset not found')

    // Confirm the object really landed in storage; read its true size.
    const meta = await this.storage.getMetadata(asset.storageKey)
    if (!meta) {
      throw new BadRequestException('File not found in storage — upload may have failed.')
    }

    const updated = await this.prisma.contentAsset.update({
      where: { id },
      data: {
        fileSize: BigInt(meta.size || dto.fileSize || 0),
        ...(dto.checksum ? { checksum: dto.checksum } : {}),
        ...(dto.mimeType ?? meta.contentType
          ? { mimeType: dto.mimeType ?? meta.contentType }
          : {}),
        status: 'UNDER_REVIEW',
      },
    })
    await this.audit.log({
      userId,
      action: 'content.uploaded',
      resource: 'ContentAsset',
      resourceId: id,
    })
    return this.serialize(updated)
  }

  /** Create a non-file asset: inline body (rich text/MCQ) or external reference. */
  async createContent(userId: string, dto: CreateContentDto) {
    // External references are never stored; inline bodies are ours. Neither
    // uploads a third-party file, so the gate only forbids mislabelled cases.
    if (dto.sourceType === 'OFFICIAL_EXTERNAL' && !dto.sourceUrl) {
      throw new BadRequestException('An official external resource needs a sourceUrl.')
    }
    const base = this.licenseData(dto)
    const asset = await this.prisma.contentAsset.create({
      data: {
        ...base,
        title: dto.title,
        ...(dto.description ? { description: dto.description } : {}),
        contentType: dto.contentType as never,
        ...(dto.body ? { body: dto.body as Prisma.InputJsonValue } : {}),
        status: 'DRAFT',
      },
    })
    await this.audit.log({
      userId,
      action: 'content.created',
      resource: 'ContentAsset',
      resourceId: asset.id,
      newValues: { title: dto.title, sourceType: dto.sourceType },
    })
    return this.serialize(asset)
  }

  async list(query: { status?: string; contentType?: string; take?: number; skip?: number }) {
    const where: Prisma.ContentAssetWhereInput = {
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.contentType ? { contentType: query.contentType as never } : {}),
    }
    const take = Math.min(query.take ?? 25, 100)
    const skip = query.skip ?? 0
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contentAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.contentAsset.count({ where }),
    ])
    return { items: items.map((a) => this.serialize(a)), total, take, skip }
  }

  async get(id: string) {
    const asset = await this.prisma.contentAsset.findUnique({
      where: { id },
      include: { mappings: true, source: true },
    })
    if (!asset) throw new NotFoundException('Asset not found')
    const deliveryUrl = asset.storageKey
      ? await this.storage.deliveryUrl(asset.storageKey, asset.status === 'PUBLISHED')
      : asset.sourceUrl ?? null
    return { ...this.serialize(asset), deliveryUrl, mappings: asset.mappings }
  }

  async addMapping(userId: string, id: string, dto: CreateMappingDto) {
    const asset = await this.prisma.contentAsset.findUnique({ where: { id } })
    if (!asset) throw new NotFoundException('Asset not found')
    const mapping = await this.prisma.curriculumContentMapping.create({
      data: {
        assetId: id,
        nodeType: dto.nodeType as never,
        nodeId: dto.nodeId,
        section: dto.section as never,
        role: dto.role,
      },
    })
    await this.audit.log({
      userId,
      action: 'content.mapped',
      resource: 'ContentAsset',
      resourceId: id,
      newValues: { nodeType: dto.nodeType, nodeId: dto.nodeId },
    })
    return mapping
  }

  /** Workflow transitions with the publish guard: only cleared assets publish. */
  async transition(
    userId: string,
    id: string,
    to: 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED',
  ) {
    const asset = await this.prisma.contentAsset.findUnique({ where: { id } })
    if (!asset) throw new NotFoundException('Asset not found')

    if (to === 'PUBLISHED') {
      // Never publish a third-party file we may not host.
      const gate = canSelfHost({
        sourceType: asset.sourceType as ContentSourceTypeStr,
        selfHostingAllowed: asset.selfHostingAllowed,
        commercialUseAllowed: asset.commercialUseAllowed,
        licenseVerified: asset.licenseVerified,
      })
      const isExternalRef = asset.sourceType === 'OFFICIAL_EXTERNAL' && !asset.storageKey
      if (asset.storageKey && !gate.allowed) {
        throw new ForbiddenException(`Cannot publish: ${gate.reason}`)
      }
      if (!isExternalRef && asset.status !== 'APPROVED') {
        throw new BadRequestException('Content must be APPROVED before publishing.')
      }
    }

    const data: Prisma.ContentAssetUpdateInput = { status: to }
    if (to === 'APPROVED') {
      data.approvedById = userId
      data.approvalDate = new Date()
    }
    if (to === 'UNDER_REVIEW') {
      data.reviewedById = userId
      data.reviewDate = new Date()
    }
    const updated = await this.prisma.contentAsset.update({ where: { id }, data })
    await this.audit.log({
      userId,
      action: `content.${to.toLowerCase()}`,
      resource: 'ContentAsset',
      resourceId: id,
    })
    return this.serialize(updated)
  }

  /** BigInt fileSize is not JSON-serialisable — expose it as a number. */
  private serialize<T extends { fileSize?: bigint | null }>(asset: T) {
    return {
      ...asset,
      fileSize: asset.fileSize != null ? Number(asset.fileSize) : null,
    }
  }
}
