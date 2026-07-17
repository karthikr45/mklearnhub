import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name)

  constructor(private readonly prisma: PrismaService) {}

  async processUploadedVideo(lessonId: string, s3Key: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')

    this.logger.log(`Queued video processing for lesson ${lessonId} (${s3Key})`)
    // TODO: run FFmpeg to transcode to HLS renditions and upload the playlist.
    // That heavy work belongs on the video-processing BullMQ queue; here we
    // only record the source key so the worker can pick it up.
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { videoKey: s3Key },
    })
  }

  async getStreamUrl(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: true },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId: lesson.chapter.courseId },
      },
    })
    if (!enrollment && !lesson.isFreePreview) {
      throw new ForbiddenException('Not enrolled in this course')
    }

    return {
      lessonId,
      hlsUrl:
        lesson.hlsUrl ??
        `https://cdn.example.com/hls/${lessonId}/index.m3u8`,
    }
  }
}
