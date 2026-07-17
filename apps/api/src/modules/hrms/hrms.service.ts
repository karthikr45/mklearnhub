import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import type { JwtPayload } from '@learnhub/types'
import type { HrmsSync, Prisma } from '@learnhub/db'
import { UserRole } from '@learnhub/db'
import { decrypt, encrypt } from '@learnhub/compliance'
import {
  CSV_TEMPLATES,
  hashPassword,
  validateRow,
  type CsvTemplateType,
} from '@learnhub/utils'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { ConfigureHrmsDto, HrmsFieldMapping } from './dto/configure-hrms.dto'

interface StoredMapping extends HrmsFieldMapping {
  defaultRole?: string
  autoDeactivate?: boolean
  syncSchedule?: string
}

interface ImportError {
  row: number
  error: string
}

const BATCH_SIZE = 100

@Injectable()
export class HrmsService {
  private readonly logger = new Logger(HrmsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('No organization context')
    return user.orgId
  }

  /**
   * Encrypt a secret for storage. If ENCRYPTION_KEY is unset (local dev) we
   * fall back to storing the plaintext so the flow still works without the key.
   */
  private encryptSecret(value: string): string {
    try {
      return encrypt(value)
    } catch {
      return value
    }
  }

  private decryptSecret(value: string): string {
    try {
      return decrypt(value)
    } catch {
      // Stored as plaintext (no ENCRYPTION_KEY) or not decryptable.
      return value
    }
  }

  private appUrl(): string {
    return process.env.APP_URL ?? 'https://app.learnhub.com'
  }

  private async findSyncForOrg(orgId: string): Promise<HrmsSync | null> {
    return this.prisma.hrmsSync.findFirst({ where: { organizationId: orgId } })
  }

  async configureHrms(orgId: string, dto: ConfigureHrmsDto) {
    const rawSecret = randomBytes(32).toString('hex')
    const webhookSecret = this.encryptSecret(rawSecret)

    // HrmsSync has no columns for defaultRole/autoDeactivate/syncSchedule, so
    // we persist them inside the fieldMapping JSON blob alongside the map.
    const fieldMapping = {
      ...dto.fieldMapping,
      defaultRole: dto.defaultRole,
      autoDeactivate: dto.autoDeactivate,
      ...(dto.syncSchedule ? { syncSchedule: dto.syncSchedule } : {}),
    } as unknown as Prisma.InputJsonValue

    const existing = await this.findSyncForOrg(orgId)
    const sync = existing
      ? await this.prisma.hrmsSync.update({
          where: { id: existing.id },
          data: { provider: dto.provider, webhookSecret, fieldMapping, isActive: true },
        })
      : await this.prisma.hrmsSync.create({
          data: {
            organizationId: orgId,
            provider: dto.provider,
            webhookSecret,
            fieldMapping,
          },
        })

    await this.audit.log({
      action: 'hrms.configured',
      resource: 'HrmsSync',
      resourceId: sync.id,
      organizationId: orgId,
    })

    return {
      webhookUrl: `${this.appUrl()}/api/v1/hrms/webhook/${orgId}`,
      // The raw secret is returned exactly once so the admin can configure the IdP.
      secret: rawSecret,
    }
  }

  async getHrmsConfig(orgId: string) {
    const sync = await this.findSyncForOrg(orgId)
    if (!sync) return null
    // Never leak the stored webhook secret.
    const { webhookSecret: _secret, ...rest } = sync
    return rest
  }

  async triggerManualSync(orgId: string) {
    const sync = await this.findSyncForOrg(orgId)
    if (!sync) throw new NotFoundException('HRMS is not configured')
    await this.prisma.hrmsSync.update({
      where: { id: sync.id },
      data: { lastSyncAt: new Date() },
    })
    // A real sync pulls the full employee directory from the provider API here.
    return { triggered: true }
  }

  async getSyncLogs(orgId: string, query: { page?: number; limit?: number }) {
    const sync = await this.findSyncForOrg(orgId)
    if (!sync) return { items: [], total: 0, page: 1, limit: 50 }

    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 50, 200)
    const where: Prisma.HrmsSyncLogWhereInput = { hrmsSyncId: sync.id }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.hrmsSyncLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.hrmsSyncLog.count({ where }),
    ])
    return { items, total, page, limit }
  }

  async receiveHrmsWebhook(
    orgId: string,
    payload: Record<string, unknown>,
    signature?: string,
  ) {
    const sync = await this.findSyncForOrg(orgId)
    if (!sync) throw new NotFoundException('HRMS is not configured')

    const secret = this.decryptSecret(sync.webhookSecret)
    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    if (!signature || !this.safeEqual(signature, expected)) {
      throw new UnauthorizedException('Invalid HRMS webhook signature')
    }

    const event =
      typeof payload.event === 'string'
        ? payload.event
        : typeof payload.type === 'string'
          ? payload.type
          : 'unknown'

    const log = await this.prisma.hrmsSyncLog.create({
      data: {
        hrmsSyncId: sync.id,
        event,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    })

    // Process inline for boot-safety (no queue at import time).
    // TODO: dispatch to BullMQ when ENABLE_QUEUES.
    await this.processHrmsEvent(log.id)

    return { received: true }
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  }

  private mapping(sync: HrmsSync): StoredMapping {
    return (sync.fieldMapping ?? {}) as unknown as StoredMapping
  }

  private mapped(
    data: Record<string, unknown>,
    map: StoredMapping,
    key: keyof HrmsFieldMapping,
  ): string | undefined {
    const source = map[key]
    if (source && typeof data[source] === 'string') return data[source] as string
    const direct = data[key]
    return typeof direct === 'string' ? direct : undefined
  }

  async processHrmsEvent(logId: string) {
    const log = await this.prisma.hrmsSyncLog.findUnique({ where: { id: logId } })
    if (!log) return
    const sync = await this.prisma.hrmsSync.findUnique({
      where: { id: log.hrmsSyncId },
    })
    if (!sync) return

    await this.prisma.hrmsSyncLog.update({
      where: { id: log.id },
      data: { status: 'PROCESSING' },
    })

    const map = this.mapping(sync)
    const payload = (log.payload ?? {}) as Record<string, unknown>
    const data = (payload.data ??
      payload.employee ??
      payload) as Record<string, unknown>

    try {
      switch (log.event) {
        case 'employee.created':
          await this.upsertEmployee(sync.organizationId, data, map, true)
          break
        case 'employee.updated':
          await this.upsertEmployee(sync.organizationId, data, map, false)
          break
        case 'employee.terminated':
          await this.terminateEmployee(sync.organizationId, data, map)
          break
        case 'employee.transferred':
          await this.transferEmployee(sync.organizationId, data, map)
          break
        case 'department.created':
          await this.createDepartment(sync.organizationId, data)
          break
        default:
          throw new BadRequestException(`Unsupported HRMS event: ${log.event}`)
      }

      await this.prisma.hrmsSyncLog.update({
        where: { id: log.id },
        data: { status: 'SUCCESS', processedAt: new Date() },
      })
      await this.prisma.hrmsSync.update({
        where: { id: sync.id },
        data: { totalSynced: { increment: 1 } },
      })
    } catch (err) {
      const message = (err as Error).message
      this.logger.error(`HRMS event ${log.event} failed: ${message}`)
      await this.prisma.hrmsSyncLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: message, processedAt: new Date() },
      })
      await this.prisma.hrmsSync.update({
        where: { id: sync.id },
        data: { totalFailed: { increment: 1 } },
      })
    }
  }

  private async resolveBranchId(
    orgId: string,
    branchCode?: string,
  ): Promise<string | undefined> {
    if (!branchCode) return undefined
    const branch = await this.prisma.branch.findFirst({
      where: { organizationId: orgId, name: branchCode },
      select: { id: true },
    })
    return branch?.id
  }

  private async upsertEmployee(
    orgId: string,
    data: Record<string, unknown>,
    map: StoredMapping,
    _isCreate: boolean,
  ) {
    const email = this.mapped(data, map, 'email')
    if (!email) throw new BadRequestException('Employee payload missing email')
    const firstName = this.mapped(data, map, 'firstName') ?? ''
    const lastName = this.mapped(data, map, 'lastName') ?? ''
    const name = `${firstName} ${lastName}`.trim() || email
    const branchId = await this.resolveBranchId(
      orgId,
      this.mapped(data, map, 'branchCode'),
    )
    const role = this.defaultRole(map)

    await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        role,
        organizationId: orgId,
        emailVerified: true,
        ...(branchId ? { branchId } : {}),
      },
      update: {
        name,
        organizationId: orgId,
        ...(branchId ? { branchId } : {}),
      },
    })
  }

  private async terminateEmployee(
    orgId: string,
    data: Record<string, unknown>,
    map: StoredMapping,
  ) {
    const email = this.mapped(data, map, 'email')
    if (!email) throw new BadRequestException('Termination payload missing email')
    if (map.autoDeactivate === false) return

    const user = await this.prisma.user.findFirst({
      where: { email, organizationId: orgId },
      select: { id: true },
    })
    if (!user) return
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    })
    await this.prisma.session.deleteMany({ where: { userId: user.id } })
  }

  private async transferEmployee(
    orgId: string,
    data: Record<string, unknown>,
    map: StoredMapping,
  ) {
    const email = this.mapped(data, map, 'email')
    if (!email) throw new BadRequestException('Transfer payload missing email')
    const branchId = await this.resolveBranchId(
      orgId,
      this.mapped(data, map, 'branchCode'),
    )
    // User has no department column, so only the branch is applied when resolvable.
    if (!branchId) return
    await this.prisma.user.updateMany({
      where: { email, organizationId: orgId },
      data: { branchId },
    })
  }

  private async createDepartment(orgId: string, data: Record<string, unknown>) {
    const name =
      (typeof data.name === 'string' && data.name) ||
      (typeof data.department === 'string' && data.department) ||
      undefined
    if (!name) throw new BadRequestException('Department payload missing name')
    const existing = await this.prisma.branch.findFirst({
      where: { organizationId: orgId, name },
      select: { id: true },
    })
    if (existing) return
    await this.prisma.branch.create({ data: { name, organizationId: orgId } })
  }

  private defaultRole(map: StoredMapping): UserRole {
    if (map.defaultRole && map.defaultRole in UserRole) {
      return map.defaultRole as UserRole
    }
    return UserRole.LEARNER
  }

  // ─── Bulk CSV import ─────────────────────────────────────

  async uploadCsvForImport(
    orgId: string,
    createdById: string,
    input: { type: CsvTemplateType; filename: string; rows: Record<string, string>[] },
  ) {
    if (!CSV_TEMPLATES[input.type]) {
      throw new BadRequestException(`Unknown import type: ${input.type}`)
    }
    const rows = input.rows ?? []
    const job = await this.prisma.bulkImportJob.create({
      data: {
        organizationId: orgId,
        type: input.type,
        filename: input.filename,
        // Production uploads the file to S3; the key is a placeholder locally.
        s3Key: `imports/${orgId}/${Date.now()}-${input.filename}`,
        totalRows: rows.length,
        createdById,
      },
    })

    // Process inline for boot-safety (no queue at import time).
    // TODO: dispatch to BullMQ when ENABLE_QUEUES.
    await this.processCsvImport(job.id, rows)

    return { jobId: job.id }
  }

  async processCsvImport(jobId: string, rows: Record<string, string>[]) {
    const job = await this.prisma.bulkImportJob.findUnique({ where: { id: jobId } })
    if (!job) throw new NotFoundException('Import job not found')

    await this.prisma.bulkImportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    })

    const type = job.type as CsvTemplateType
    const errors: ImportError[] = []
    let processed = 0
    let success = 0
    let failed = 0

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j
        const row = batch[j]
        try {
          const check = validateRow(type, row)
          if (!check.valid) {
            throw new BadRequestException(check.errors.join('; '))
          }
          await this.importRow(job.organizationId, type, row)
          success++
        } catch (err) {
          failed++
          errors.push({ row: rowIndex + 1, error: (err as Error).message })
        }
        processed++
      }

      // Persist progress after each batch.
      await this.prisma.bulkImportJob.update({
        where: { id: jobId },
        data: { processedRows: processed },
      })
    }

    const status = failed === 0 ? 'COMPLETED' : 'PARTIALLY_COMPLETED'
    const updated = await this.prisma.bulkImportJob.update({
      where: { id: jobId },
      data: {
        processedRows: processed,
        successRows: success,
        failedRows: failed,
        errors: errors as unknown as Prisma.InputJsonValue,
        status,
        completedAt: new Date(),
      },
    })
    return updated
  }

  private async importRow(
    orgId: string,
    type: CsvTemplateType,
    row: Record<string, string>,
  ) {
    switch (type) {
      case 'USERS':
        return this.importUserRow(orgId, row)
      case 'ENROLLMENTS':
        return this.importEnrollmentRow(orgId, row)
      case 'GRADES':
        return this.importGradeRow(orgId, row)
      case 'ATTENDANCE':
        return this.importAttendanceRow(orgId, row)
      default:
        throw new BadRequestException(`Unsupported import type: ${type}`)
    }
  }

  private async importUserRow(orgId: string, row: Record<string, string>) {
    const name = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || row.email
    const branchId = await this.resolveBranchId(orgId, row.branchCode)
    const role = row.role && row.role in UserRole ? (row.role as UserRole) : UserRole.LEARNER
    const passwordHash = row.password ? await hashPassword(row.password) : undefined

    await this.prisma.user.upsert({
      where: { email: row.email },
      create: {
        email: row.email,
        name,
        role,
        organizationId: orgId,
        ...(branchId ? { branchId } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      update: {
        name,
        organizationId: orgId,
        ...(branchId ? { branchId } : {}),
      },
    })
  }

  private async importEnrollmentRow(orgId: string, row: Record<string, string>) {
    const user = await this.prisma.user.findFirst({
      where: { email: row.userEmail, organizationId: orgId },
      select: { id: true },
    })
    if (!user) throw new BadRequestException(`User not found: ${row.userEmail}`)
    const course = await this.prisma.course.findFirst({
      where: { slug: row.courseSlug, organizationId: orgId },
      select: { id: true },
    })
    if (!course) throw new BadRequestException(`Course not found: ${row.courseSlug}`)

    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      create: {
        userId: user.id,
        courseId: course.id,
        ...(row.enrolledAt ? { enrolledAt: new Date(row.enrolledAt) } : {}),
        ...(row.expiresAt ? { expiresAt: new Date(row.expiresAt) } : {}),
      },
      update: {
        ...(row.expiresAt ? { expiresAt: new Date(row.expiresAt) } : {}),
      },
    })
  }

  private async importGradeRow(orgId: string, row: Record<string, string>) {
    const user = await this.prisma.user.findFirst({
      where: { email: row.userEmail, organizationId: orgId },
      select: { id: true },
    })
    if (!user) throw new BadRequestException(`User not found: ${row.userEmail}`)

    // Grade has no unique constraint, so upsert manually by user+subject+term.
    const existing = await this.prisma.grade.findFirst({
      where: {
        userId: user.id,
        organizationId: orgId,
        subject: row.subject,
        ...(row.term ? { term: row.term } : {}),
      },
      select: { id: true },
    })
    const data = {
      score: row.score,
      maxScore: row.maxScore,
      ...(row.term ? { term: row.term } : {}),
    }
    if (existing) {
      await this.prisma.grade.update({ where: { id: existing.id }, data })
    } else {
      await this.prisma.grade.create({
        data: {
          userId: user.id,
          organizationId: orgId,
          subject: row.subject,
          score: row.score,
          maxScore: row.maxScore,
          ...(row.term ? { term: row.term } : {}),
        },
      })
    }
  }

  private async importAttendanceRow(orgId: string, row: Record<string, string>) {
    const user = await this.prisma.user.findFirst({
      where: { email: row.userEmail, organizationId: orgId },
      select: { id: true },
    })
    if (!user) throw new BadRequestException(`User not found: ${row.userEmail}`)
    const batch = await this.prisma.batch.findFirst({
      where: { organizationId: orgId, name: row.batchName },
      select: { id: true },
    })
    if (!batch) throw new BadRequestException(`Batch not found: ${row.batchName}`)

    const date = new Date(row.date)
    const status = row.status.toUpperCase() as
      | 'PRESENT'
      | 'ABSENT'
      | 'LATE'
      | 'EXCUSED'

    await this.prisma.attendanceRecord.upsert({
      where: {
        batchId_userId_date: { batchId: batch.id, userId: user.id, date },
      },
      create: { batchId: batch.id, userId: user.id, date, status },
      update: { status },
    })
  }

  async getImportJobStatus(jobId: string) {
    const job = await this.prisma.bulkImportJob.findUnique({ where: { id: jobId } })
    if (!job) throw new NotFoundException('Import job not found')
    const progressPct =
      job.totalRows > 0
        ? Math.round((job.processedRows / job.totalRows) * 100)
        : 0
    return { ...job, progressPct }
  }
}
