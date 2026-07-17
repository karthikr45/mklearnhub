import { Injectable, Logger } from '@nestjs/common'
import type { Prisma } from '@learnhub/db'
import { scrub } from '@learnhub/compliance'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditQueryDto } from './dto/audit-query.dto'

export interface AuditParams {
  organizationId?: string | null
  userId?: string | null
  action: string
  resource: string
  resourceId?: string | null
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
  sessionId?: string | null
  status?: 'success' | 'failure'
  errorMessage?: string | null
  duration?: number | null
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit')

  constructor(private readonly prisma: PrismaService) {}

  /** Persist an audit entry. Never throws into the caller's request path. */
  async log(params: AuditParams): Promise<void> {
    const data: Prisma.AuditLogCreateInput = {
      action: params.action,
      resource: params.resource,
      status: params.status ?? 'success',
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.resourceId ? { resourceId: params.resourceId } : {}),
      ...(params.oldValues
        ? { oldValues: scrub(params.oldValues) as Prisma.InputJsonValue }
        : {}),
      ...(params.newValues
        ? { newValues: scrub(params.newValues) as Prisma.InputJsonValue }
        : {}),
      ...(params.ipAddress ? { ipAddress: params.ipAddress } : {}),
      ...(params.userAgent ? { userAgent: params.userAgent } : {}),
      ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      ...(params.errorMessage ? { errorMessage: params.errorMessage } : {}),
      ...(params.duration != null ? { duration: params.duration } : {}),
    }

    try {
      await this.prisma.auditLog.create({ data })
      this.logger.log(
        `${data.status} ${params.action} ${params.resource}${
          params.resourceId ? `#${params.resourceId}` : ''
        }`,
      )
    } catch (err) {
      this.logger.error(
        `Failed to write audit log for ${params.action}`,
        err as Error,
      )
    }
  }

  async query(orgId: string, filters: AuditQueryDto) {
    const page = filters.page ?? 1
    const limit = Math.min(filters.limit ?? 50, 200)
    const where: Prisma.AuditLogWhereInput = {
      organizationId: orgId,
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.resource ? { resource: filters.resource } : {}),
      ...(filters.resourceId ? { resourceId: filters.resourceId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ])
    return { items, total, page, limit }
  }

  async getLog(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id } })
  }

  /** Returns a CSV (or JSON) string of the filtered logs. */
  async export(
    orgId: string,
    filters: AuditQueryDto,
    format: 'csv' | 'json' = 'csv',
  ): Promise<string> {
    const { items } = await this.query(orgId, { ...filters, limit: 200 })
    if (format === 'json') return JSON.stringify(items, null, 2)

    const headers = [
      'createdAt',
      'userId',
      'action',
      'resource',
      'resourceId',
      'status',
      'ipAddress',
      'duration',
    ]
    const rows = items.map((i) =>
      headers
        .map((h) => {
          const value = (i as Record<string, unknown>)[h]
          return value == null ? '' : `"${String(value).replace(/"/g, '""')}"`
        })
        .join(','),
    )
    return [headers.join(','), ...rows].join('\n')
  }
}
