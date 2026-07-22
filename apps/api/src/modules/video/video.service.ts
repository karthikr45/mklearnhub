import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'

import { UPLOAD_DIR } from '../../config/uploads'
import { PrismaService } from '../../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'

const STAFF = ['INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN']

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name)
  private ffmpegChecked?: boolean

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** R2/S3 keys are content-addressed paths; local files are absolute paths. */
  private isObjectKey(key?: string | null): boolean {
    return Boolean(key && !key.startsWith('/'))
  }

  /**
   * Step 1 of an object-storage upload: a presigned PUT URL the browser uploads
   * the file to directly (bytes never touch the API). Works with any configured
   * S3-compatible provider (R2/S3/B2/…).
   */
  async getUploadUrl(lessonId: string, filename: string, contentType: string) {
    await this.lessonOrThrow(lessonId)
    if (!this.storage.isConfigured()) {
      throw new NotFoundException(
        'Object storage is not configured. Set STORAGE_* env vars.',
      )
    }
    const key = this.storage.keyFor('lesson-video', lessonId, filename)
    const { url } = await this.storage.getPresignedUploadUrl(key, contentType)
    return { url, key, method: 'PUT' as const }
  }

  /** Step 2: point the lesson at the uploaded object. */
  async attachUploadedKey(lessonId: string, key: string) {
    await this.lessonOrThrow(lessonId)
    const videoUrl = await this.storage.deliveryUrl(key, true)
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { videoKey: key, videoUrl, hlsUrl: null },
    })
  }

  private async lessonOrThrow(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')
    return lesson
  }

  /** Attach a video to a lesson by URL (mp4, HLS .m3u8, or a YouTube link). */
  async setVideoUrl(lessonId: string, videoUrl: string) {
    await this.lessonOrThrow(lessonId)
    const isHls = videoUrl.includes('.m3u8')
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoUrl,
        ...(isHls ? { hlsUrl: videoUrl } : { hlsUrl: null }),
      },
    })
  }

  /**
   * Called after a file has been streamed to disk. Sets the lesson's videoUrl
   * to the statically-served path (progressive playback works immediately),
   * then — if FFmpeg is available — transcodes to HLS in the background.
   */
  async attachUploadedFile(
    lessonId: string,
    servedPath: string,
    absPath: string,
  ) {
    await this.lessonOrThrow(lessonId)
    const lesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { videoUrl: servedPath, videoKey: absPath },
    })
    // Fire-and-forget HLS transcode; progressive playback already works.
    void this.processUploadedVideo(lessonId, absPath).catch((err) =>
      this.logger.error(`HLS transcode failed for ${lessonId}`, err as Error),
    )
    return lesson
  }

  private async hasFfmpeg(): Promise<boolean> {
    if (this.ffmpegChecked !== undefined) return this.ffmpegChecked
    try {
      const { spawnSync } = await import('node:child_process')
      const res = spawnSync('ffmpeg', ['-version'])
      this.ffmpegChecked = res.status === 0
    } catch {
      this.ffmpegChecked = false
    }
    if (!this.ffmpegChecked) {
      this.logger.warn('FFmpeg not found — skipping HLS transcode (progressive playback still works).')
    }
    return this.ffmpegChecked
  }

  /**
   * Transcode a local file to an HLS playlist. Runs only when FFmpeg is
   * installed; otherwise it is a no-op (the lesson keeps its progressive
   * videoUrl). In production this is dispatched to the video-processing queue
   * and reads/writes S3.
   */
  async processUploadedVideo(lessonId: string, inputAbsPath: string) {
    if (!(await this.hasFfmpeg())) return
    const outDir = join(UPLOAD_DIR, 'hls', lessonId)
    mkdirSync(outDir, { recursive: true })
    const master = join(outDir, 'master.m3u8')

    const ffmpegModule = await import('fluent-ffmpeg')
    const ffmpeg = ffmpegModule.default
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputAbsPath)
        .outputOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 6',
          '-hls_list_size 0',
          '-f hls',
        ])
        .output(master)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run()
    })

    this.logger.log(`HLS ready for lesson ${lessonId}`)
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { hlsUrl: `/uploads/hls/${lessonId}/master.m3u8` },
    })
  }

  async getStreamUrl(lessonId: string, userId: string, role?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: true },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')

    const isStaff = Boolean(role && STAFF.includes(role))
    if (!isStaff && !lesson.isFreePreview) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: lesson.chapter.courseId } },
      })
      if (!enrollment) throw new ForbiddenException('Not enrolled in this course')
    }

    // For object-storage-backed videos, mint a FRESH delivery URL each time
    // (a stored signed URL would expire; a CDN/public base is returned as-is).
    let videoUrl = lesson.videoUrl
    if (this.isObjectKey(lesson.videoKey)) {
      videoUrl = await this.storage.deliveryUrl(lesson.videoKey as string, true)
    }

    return { lessonId, videoUrl, hlsUrl: lesson.hlsUrl }
  }
}
