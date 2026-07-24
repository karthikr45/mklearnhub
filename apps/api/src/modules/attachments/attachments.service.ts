import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'
import type { CreateAttachmentDto } from './dto/attachment.dto'

const STAFF = ['INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN']

/**
 * Downloadable lesson resources of any document type (PDF/slides/worksheets/
 * images/audio/zip/…). Bytes go straight to object storage via a presigned
 * PUT; the row stores only the key + metadata. Download URLs are minted fresh
 * on read so signed links never go stale.
 */
@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Step 1 (staff): presigned direct-to-storage upload URL. */
  async getUploadUrl(lessonId: string, filename: string, contentType: string) {
    await this.lessonOrThrow(lessonId)
    if (!this.storage.isConfigured()) {
      throw new NotFoundException(
        'Object storage is not configured. Set STORAGE_* env vars.',
      )
    }
    const key = this.storage.keyFor('lesson-file', lessonId, filename)
    const { url } = await this.storage.getPresignedUploadUrl(key, contentType)
    return { url, key, method: 'PUT' as const }
  }

  /** Step 2 (staff): register the uploaded object on the lesson. */
  async create(lessonId: string, dto: CreateAttachmentDto) {
    await this.lessonOrThrow(lessonId)
    const count = await this.prisma.lessonAttachment.count({ where: { lessonId } })
    return this.prisma.lessonAttachment.create({
      data: {
        lessonId,
        title: (dto.title ?? dto.fileName).trim() || dto.fileName,
        fileName: dto.fileName,
        storageKey: dto.storageKey,
        contentType: dto.contentType,
        fileSize: dto.fileSize ?? 0,
        order: count,
      },
    })
  }

  /** List a lesson's attachments (metadata only — no URLs). */
  async list(lessonId: string) {
    await this.lessonOrThrow(lessonId)
    return this.prisma.lessonAttachment.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    })
  }

  /**
   * Mint a fresh download URL for one attachment. Staff always allowed; a
   * learner must be enrolled in the course (or the lesson is a free preview).
   */
  async getDownloadUrl(attachmentId: string, userId: string, role?: string) {
    const att = await this.prisma.lessonAttachment.findUnique({
      where: { id: attachmentId },
      include: { lesson: { include: { chapter: true } } },
    })
    if (!att) throw new NotFoundException('Attachment not found')

    const isStaff = Boolean(role && STAFF.includes(role))
    if (!isStaff && !att.lesson.isFreePreview) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId: att.lesson.chapter.courseId },
        },
      })
      if (!enrollment) throw new ForbiddenException('Not enrolled in this course')
    }

    const url = await this.storage.deliveryUrl(att.storageKey, false)
    return { id: att.id, fileName: att.fileName, contentType: att.contentType, url }
  }

  /** Remove an attachment row and best-effort delete its stored object. */
  async remove(attachmentId: string) {
    const att = await this.prisma.lessonAttachment.findUnique({
      where: { id: attachmentId },
    })
    if (!att) throw new NotFoundException('Attachment not found')
    await this.prisma.lessonAttachment.delete({ where: { id: attachmentId } })
    if (this.storage.isConfigured()) {
      await this.storage
        .deleteFile(att.storageKey)
        .catch(() => undefined /* object may already be gone */)
    }
    return { deleted: true, id: attachmentId }
  }

  private async lessonOrThrow(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson) throw new NotFoundException('Lesson not found')
    return lesson
  }
}
