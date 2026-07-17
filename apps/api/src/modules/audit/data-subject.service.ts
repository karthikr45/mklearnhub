import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from './audit.service'

@Injectable()
export class DataSubjectService {
  private readonly logger = new Logger('DataSubject')

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async requestDataExport(userId: string, orgId: string) {
    const dueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const request = await this.prisma.dataSubjectRequest.create({
      data: { userId, organizationId: orgId, type: 'EXPORT', dueAt },
    })
    await this.audit.log({
      action: 'privacy.export_requested',
      resource: 'DataSubjectRequest',
      resourceId: request.id,
      userId,
      organizationId: orgId,
    })
    // Processed asynchronously by the data-export queue when enabled; locally
    // callers can invoke processDataExport directly.
    return request
  }

  /** Collects all of a user's data into a single JSON object. */
  async collectUserData(userId: string): Promise<Record<string, unknown>> {
    const [user, enrollments, progress, attempts, certificates, notifications, audits] =
      await this.prisma.$transaction([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.enrollment.findMany({ where: { userId } }),
        this.prisma.lessonProgress.findMany({ where: { userId } }),
        this.prisma.quizAttempt.findMany({ where: { userId } }),
        this.prisma.certificate.findMany({ where: { userId } }),
        this.prisma.notification.findMany({ where: { userId } }),
        this.prisma.auditLog.findMany({ where: { userId }, take: 500 }),
      ])
    if (!user) throw new NotFoundException('User not found')
    const { passwordHash: _omit, ...profile } = user
    return {
      profile,
      enrollments,
      progress,
      quizAttempts: attempts,
      certificates,
      notifications,
      auditLogs: audits,
      exportedAt: new Date().toISOString(),
    }
  }

  async processDataExport(requestId: string): Promise<Record<string, unknown>> {
    const request = await this.prisma.dataSubjectRequest.findUnique({
      where: { id: requestId },
    })
    if (!request) throw new NotFoundException('Request not found')
    const data = await this.collectUserData(request.userId)
    // In production the JSON is uploaded to S3 and a presigned URL is emailed.
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        exportUrl: `local://data-export/${requestId}.json`,
        expiresAt,
      },
    })
    return data
  }

  async requestDataDeletion(userId: string, orgId: string) {
    const dueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const request = await this.prisma.dataSubjectRequest.create({
      data: { userId, organizationId: orgId, type: 'DELETE', dueAt },
    })
    await this.audit.log({
      action: 'privacy.deletion_requested',
      resource: 'DataSubjectRequest',
      resourceId: request.id,
      userId,
      organizationId: orgId,
    })
    return request
  }

  async listMyRequests(userId: string) {
    return this.prisma.dataSubjectRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    })
  }

  async listAllRequests(orgId: string) {
    return this.prisma.dataSubjectRequest.findMany({
      where: { organizationId: orgId },
      orderBy: { requestedAt: 'desc' },
    })
  }

  async processRequest(id: string, action: 'approve' | 'reject', orgId: string) {
    const request = await this.prisma.dataSubjectRequest.findUnique({
      where: { id },
    })
    if (!request || request.organizationId !== orgId) {
      throw new ForbiddenException('Request not found')
    }

    if (action === 'reject') {
      return this.prisma.dataSubjectRequest.update({
        where: { id },
        data: { status: 'REJECTED', completedAt: new Date() },
      })
    }

    if (request.type === 'EXPORT') {
      await this.processDataExport(id)
    } else if (request.type === 'DELETE') {
      await this.anonymizeUser(request.userId)
    }
    await this.audit.log({
      action: `privacy.${request.type.toLowerCase()}_approved`,
      resource: 'DataSubjectRequest',
      resourceId: id,
      organizationId: orgId,
    })
    return this.prisma.dataSubjectRequest.findUnique({ where: { id } })
  }

  /** Anonymizes PII while keeping (anonymized) records required for compliance. */
  async anonymizeUser(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.session.deleteMany({ where: { userId } }),
      this.prisma.oAuthAccount.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.com`,
          name: 'Deleted User',
          passwordHash: null,
          avatarUrl: null,
          isActive: false,
        },
      }),
    ])
    this.logger.log(`Anonymized user ${userId}`)
  }
}
