import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import type { ApiKey, Organization, Prisma } from '@learnhub/db'
import bcrypt from 'bcryptjs'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreateApiKeyDto } from './dto/create-api-key.dto'

const BCRYPT_ROUNDS = 10

export type ApiKeyWithOrg = ApiKey & { organization: Organization }

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger('ApiKey')

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Build a raw key `lh_{prefix}_{secret}` and its bcrypt hash. */
  private async generateKey(): Promise<{
    rawKey: string
    keyPrefix: string
    keyHash: string
  }> {
    const keyPrefix = randomBytes(4).toString('hex')
    const secret = randomBytes(24).toString('hex')
    const rawKey = `lh_${keyPrefix}_${secret}`
    const keyHash = await bcrypt.hash(rawKey, BCRYPT_ROUNDS)
    return { rawKey, keyPrefix, keyHash }
  }

  async createApiKey(
    orgId: string,
    createdById: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const { rawKey, keyPrefix, keyHash } = await this.generateKey()

    const data: Prisma.ApiKeyCreateInput = {
      name: dto.name,
      keyHash,
      keyPrefix,
      scopes: dto.scopes ?? [],
      allowedIps: dto.allowedIps ?? [],
      createdById,
      organization: { connect: { id: orgId } },
      ...(dto.rateLimit != null ? { rateLimit: dto.rateLimit } : {}),
      ...(dto.expiresAt ? { expiresAt: new Date(dto.expiresAt) } : {}),
    }

    const apiKey = await this.prisma.apiKey.create({ data })

    await this.audit.log({
      action: 'apikey.created',
      resource: 'ApiKey',
      resourceId: apiKey.id,
      organizationId: orgId,
      userId: createdById,
      newValues: { name: apiKey.name, keyPrefix: apiKey.keyPrefix },
    })

    // Raw key is returned exactly once; only the bcrypt hash is persisted.
    return { apiKey, rawKey }
  }

  async validateApiKey(rawKey: string): Promise<ApiKeyWithOrg | null> {
    const parts = rawKey.split('_')
    if (parts.length !== 3 || parts[0] !== 'lh') return null
    const keyPrefix = parts[1]
    if (!keyPrefix) return null

    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPrefix, isActive: true },
      include: { organization: true },
    })

    for (const candidate of candidates) {
      const matches = await bcrypt.compare(rawKey, candidate.keyHash)
      if (!matches) continue
      if (candidate.expiresAt && candidate.expiresAt.getTime() < Date.now()) {
        return null
      }
      return candidate
    }
    return null
  }

  async rotateApiKey(
    keyId: string,
    orgId: string,
  ): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id: keyId, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('API key not found')

    const { rawKey, keyPrefix, keyHash } = await this.generateKey()
    const apiKey = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { keyHash, keyPrefix },
    })

    await this.audit.log({
      action: 'apikey.rotated',
      resource: 'ApiKey',
      resourceId: keyId,
      organizationId: orgId,
    })

    return { apiKey, rawKey }
  }

  async revokeApiKey(keyId: string, orgId: string): Promise<{ success: true }> {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id: keyId, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('API key not found')

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    })

    await this.audit.log({
      action: 'apikey.revoked',
      resource: 'ApiKey',
      resourceId: keyId,
      organizationId: orgId,
    })

    return { success: true }
  }

  async listApiKeys(orgId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        allowedIps: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Fire-and-forget usage tracking. Never awaited by the request path and
   * never throws into the caller.
   */
  trackUsage(
    keyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
  ): void {
    void (async () => {
      try {
        await this.prisma.$transaction([
          this.prisma.apiKeyUsage.create({
            data: { apiKeyId: keyId, endpoint, method, statusCode, duration },
          }),
          this.prisma.apiKey.update({
            where: { id: keyId },
            data: { lastUsedAt: new Date() },
          }),
        ])
      } catch (err) {
        this.logger.warn(`Failed to track usage for key ${keyId}: ${String(err)}`)
      }
    })()
  }

  async getUsageStats(keyId: string, orgId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, organizationId: orgId },
    })
    if (!key) throw new NotFoundException('API key not found')

    const now = Date.now()
    const since = (ms: number) => new Date(now - ms)
    const DAY = 24 * 60 * 60 * 1000

    const [last24h, last7d, last30d, total, errors, topEndpoints] =
      await this.prisma.$transaction([
        this.prisma.apiKeyUsage.count({
          where: { apiKeyId: keyId, createdAt: { gte: since(DAY) } },
        }),
        this.prisma.apiKeyUsage.count({
          where: { apiKeyId: keyId, createdAt: { gte: since(7 * DAY) } },
        }),
        this.prisma.apiKeyUsage.count({
          where: { apiKeyId: keyId, createdAt: { gte: since(30 * DAY) } },
        }),
        this.prisma.apiKeyUsage.count({ where: { apiKeyId: keyId } }),
        this.prisma.apiKeyUsage.count({
          where: { apiKeyId: keyId, statusCode: { gte: 400 } },
        }),
        this.prisma.apiKeyUsage.groupBy({
          by: ['endpoint'],
          where: { apiKeyId: keyId },
          _count: { endpoint: true },
          orderBy: { _count: { endpoint: 'desc' } },
          take: 5,
        }),
      ])

    return {
      keyId,
      requests: { last24h, last7d, last30d, total },
      errorRate: total > 0 ? errors / total : 0,
      topEndpoints: topEndpoints.map((e) => ({
        endpoint: e.endpoint,
        count:
          (e._count as { endpoint?: number } | undefined)?.endpoint ?? 0,
      })),
    }
  }
}
