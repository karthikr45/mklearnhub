import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@learnhub/db'
import type { JwtPayload } from '@learnhub/types'
import { nanoid } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { TrackScormDto } from './dto/track-scorm.dto'
import { UploadScormDto } from './dto/upload-scorm.dto'
import { XapiStatementDto } from './dto/xapi-statement.dto'

interface ScoDescriptor {
  id: string
  title: string
  href: string
  masteryScore: number
}

interface XapiQuery {
  agent?: string
  verb?: string
  activity?: string
  since?: string
  until?: string
  limit?: number
}

/** Maps a CMI data-model element to its ScormTracking column. */
type CmiField = { field: string; kind: 'string' | 'decimal' }

@Injectable()
export class ScormService {
  private readonly logger = new Logger('Scorm')

  constructor(private readonly prisma: PrismaService) {}

  // ─── Packages ───────────────────────────────────────────

  async uploadScormPackage(orgId: string, dto: UploadScormDto) {
    const pkg = await this.prisma.scormPackage.create({
      data: {
        organization: { connect: { id: orgId } },
        title: dto.title,
        manifestPath: 'imsmanifest.xml',
        entryPoint: 'index.html',
        // In production the client first uploads the .zip to S3 (presigned PUT)
        // and passes the resulting key; locally we synthesise a placeholder.
        s3Key: dto.s3Key ?? `scorm/${orgId}/${nanoid(10)}.zip`,
        isProcessed: false,
        ...(dto.version ? { version: dto.version } : {}),
      },
    })

    // TODO: dispatch to BullMQ. Processing runs inline here to keep the API
    // boot-safe (no queue/worker required at construction time).
    await this.processScormPackage(pkg.id)
    return { packageId: pkg.id }
  }

  /**
   * Parse the package manifest and populate the SCO list + entry point.
   *
   * Production flow (requires S3 + AWS env, hence not run here):
   *   const { GetObjectCommand } = await import('@aws-sdk/client-s3')
   *   const object = await s3.send(new GetObjectCommand({ Bucket, Key: s3Key }))
   *   const buffer = Buffer.from(await object.Body.transformToByteArray())
   *   const AdmZip = (await import('adm-zip')).default
   *   const zip = new AdmZip(buffer)
   *   const manifestXml = zip.readAsText('imsmanifest.xml')
   *   const xml2js = await import('xml2js')
   *   const manifest = await xml2js.parseStringPromise(manifestXml)
   *   // walk manifest.organizations.organization[].item[] -> identifierref
   *   // resolve manifest.resources.resource[] href for each SCO / the launch file
   * Both adm-zip and xml2js are imported dynamically so they never load at boot.
   */
  async processScormPackage(packageId: string) {
    const scoList: ScoDescriptor[] = [
      { id: 'sco-1', title: 'Module 1', href: 'index.html', masteryScore: 80 },
    ]
    return this.prisma.scormPackage.update({
      where: { id: packageId },
      data: {
        scoList: scoList as unknown as Prisma.InputJsonValue,
        entryPoint: 'index.html',
        isProcessed: true,
        processedAt: new Date(),
      },
    })
  }

  async listPackages(orgId: string) {
    return this.prisma.scormPackage.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getPackage(id: string) {
    const pkg = await this.prisma.scormPackage.findUnique({ where: { id } })
    if (!pkg) throw new NotFoundException('SCORM package not found')
    return pkg
  }

  async deletePackage(id: string) {
    await this.getPackage(id)
    // Remove dependent rows first (no cascade declared on these relations).
    await this.prisma.lessonScorm.deleteMany({ where: { scormPackageId: id } })
    await this.prisma.scormTracking.deleteMany({ where: { scormPackageId: id } })
    await this.prisma.scormPackage.delete({ where: { id } })
    return { deleted: true }
  }

  async getLaunchUrl(packageId: string, user: JwtPayload) {
    const pkg = await this.getPackage(packageId)
    // Get-or-create the tracking row so the RTE has state to read on Initialize.
    await this.prisma.scormTracking.upsert({
      where: {
        userId_scormPackageId_scoId: {
          userId: user.sub,
          scormPackageId: packageId,
          scoId: 'sco-1',
        },
      },
      create: { userId: user.sub, scormPackageId: packageId, scoId: 'sco-1' },
      update: {},
    })

    // Production: return a short-lived signed S3 URL to the extracted content
    // root instead of the local runtime shell.
    return {
      launchUrl: `/api/v1/scorm/packages/${packageId}/runtime`,
      entryPoint: pkg.entryPoint,
      apiConfig: { packageId, scoId: 'sco-1' },
    }
  }

  // ─── SCORM RTE tracking ─────────────────────────────────

  private mapCmiKey(key: string): CmiField | null {
    switch (key) {
      case 'cmi.completion_status':
      case 'cmi.core.lesson_status':
        return { field: 'completionStatus', kind: 'string' }
      case 'cmi.success_status':
        return { field: 'successStatus', kind: 'string' }
      case 'cmi.score.raw':
      case 'cmi.core.score.raw':
        return { field: 'score', kind: 'decimal' }
      case 'cmi.score.max':
      case 'cmi.core.score.max':
        return { field: 'maxScore', kind: 'decimal' }
      case 'cmi.location':
      case 'cmi.core.lesson_location':
        return { field: 'location', kind: 'string' }
      case 'cmi.suspend_data':
        return { field: 'suspendData', kind: 'string' }
      case 'cmi.total_time':
      case 'cmi.core.total_time':
        return { field: 'totalTime', kind: 'string' }
      case 'cmi.session_time':
      case 'cmi.core.session_time':
        return { field: 'sessionTime', kind: 'string' }
      default:
        return null
    }
  }

  /** SCORM 1.2 / 2004 Run-Time Environment endpoint. */
  async track(packageId: string, user: JwtPayload, dto: TrackScormDto) {
    const { scoId, action, key, value } = dto
    const where = {
      userId_scormPackageId_scoId: {
        userId: user.sub,
        scormPackageId: packageId,
        scoId,
      },
    }

    switch (action) {
      case 'Initialize':
      case 'LMSInitialize': {
        await this.prisma.scormTracking.upsert({
          where,
          create: { userId: user.sub, scormPackageId: packageId, scoId },
          update: {},
        })
        return { result: 'true' }
      }

      case 'GetValue':
      case 'LMSGetValue': {
        if (!key) return { value: '' }
        const mapped = this.mapCmiKey(key)
        if (!mapped) return { value: '' }
        const record = await this.prisma.scormTracking.findUnique({ where })
        if (!record) return { value: '' }
        const raw = (record as Record<string, unknown>)[mapped.field]
        return { value: raw == null ? '' : String(raw) }
      }

      case 'SetValue':
      case 'LMSSetValue': {
        if (!key) return { result: 'false' }
        const mapped = this.mapCmiKey(key)
        if (!mapped) return { result: 'false' }
        const fieldValue: string | number | null =
          mapped.kind === 'decimal'
            ? value != null && value !== ''
              ? Number(value)
              : null
            : (value ?? '')
        const patch: Record<string, string | number | null> = {
          [mapped.field]: fieldValue,
        }
        await this.prisma.scormTracking.upsert({
          where,
          create: {
            userId: user.sub,
            scormPackageId: packageId,
            scoId,
            ...patch,
          } as Prisma.ScormTrackingUncheckedCreateInput,
          update: patch as Prisma.ScormTrackingUncheckedUpdateInput,
        })
        return { result: 'true' }
      }

      case 'Commit':
      case 'LMSCommit':
        // No-op: SetValue already persists each element.
        return { result: 'true' }

      case 'Terminate':
      case 'LMSFinish': {
        const record = await this.prisma.scormTracking.findUnique({ where })
        if (record?.completionStatus === 'completed') {
          try {
            await this.markLinkedLessonComplete(packageId, user.sub)
          } catch (err) {
            this.logger.warn(
              `Could not sync lesson progress for package ${packageId}: ${
                (err as Error).message
              }`,
            )
          }
        }
        return { result: 'true' }
      }

      default:
        return { result: 'false' }
    }
  }

  /** Best-effort: mark the lesson that embeds this package complete. */
  private async markLinkedLessonComplete(packageId: string, userId: string) {
    const lessonScorm = await this.prisma.lessonScorm.findFirst({
      where: { scormPackageId: packageId },
      include: { lesson: { include: { chapter: true } } },
    })
    if (!lessonScorm) return

    const courseId = lessonScorm.lesson.chapter.courseId
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (!enrollment) return

    await this.prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: lessonScorm.lessonId,
        },
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId: lessonScorm.lessonId,
        userId,
        isCompleted: true,
        completedAt: new Date(),
      },
      update: { isCompleted: true, completedAt: new Date() },
    })
  }

  // ─── xAPI (LRS) ─────────────────────────────────────────

  async receiveXapiStatement(orgId: string, statement: XapiStatementDto) {
    if (
      !statement?.actor ||
      !statement.verb?.id ||
      !statement.object?.id ||
      (!statement.actor.mbox && !statement.actor.account)
    ) {
      throw new BadRequestException('Invalid xAPI statement shape')
    }

    const actorEmail = statement.actor.mbox
      ? statement.actor.mbox.replace(/^mailto:/, '')
      : statement.actor.account?.name ?? 'unknown'
    const statementId = statement.id ?? nanoid()

    await this.prisma.xapiStatement.create({
      data: {
        statementId,
        organizationId: orgId,
        actorEmail,
        verb: statement.verb.id,
        objectId: statement.object.id,
        objectType: statement.object.objectType ?? 'Activity',
        timestamp: statement.timestamp
          ? new Date(statement.timestamp)
          : new Date(),
        rawStatement: statement as unknown as Prisma.InputJsonValue,
        ...(statement.result
          ? { result: statement.result as Prisma.InputJsonValue }
          : {}),
        ...(statement.context
          ? { context: statement.context as Prisma.InputJsonValue }
          : {}),
      },
    })
    return { statementId }
  }

  async queryXapiStatements(orgId: string, query: XapiQuery) {
    const limit = Math.min(query.limit ?? 50, 200)
    const where: Prisma.XapiStatementWhereInput = {
      organizationId: orgId,
      ...(query.agent ? { actorEmail: query.agent } : {}),
      ...(query.verb ? { verb: query.verb } : {}),
      ...(query.activity ? { objectId: query.activity } : {}),
      ...(query.since || query.until
        ? {
            timestamp: {
              ...(query.since ? { gte: new Date(query.since) } : {}),
              ...(query.until ? { lte: new Date(query.until) } : {}),
            },
          }
        : {}),
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.xapiStatement.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
      }),
      this.prisma.xapiStatement.count({ where }),
    ])
    return { items, total, limit }
  }

  async getStatement(id: string) {
    const statement = await this.prisma.xapiStatement.findUnique({
      where: { statementId: id },
    })
    if (!statement) throw new NotFoundException('xAPI statement not found')
    return statement
  }
}
