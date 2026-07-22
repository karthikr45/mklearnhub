import { createWriteStream, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { FastifyRequest } from 'fastify'
import type { JwtPayload } from '@learnhub/types'

import { UPLOAD_DIR } from '../../config/uploads'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { ProcessVideoDto } from './dto/process-video.dto'
import { SetVideoUrlDto } from './dto/set-video-url.dto'
import { AttachKeyDto, VideoUploadUrlDto } from './dto/upload-url.dto'
import { VideoService } from './video.service'

interface MultipartFile {
  filename: string
  mimetype: string
  file: NodeJS.ReadableStream
}
type MultipartRequest = FastifyRequest & {
  file?: () => Promise<MultipartFile | undefined>
}

@ApiTags('video')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('video')
export class VideoController {
  constructor(private readonly video: VideoService) {}

  @Get(':lessonId/stream')
  getStreamUrl(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.video.getStreamUrl(lessonId, user.sub, user.role)
  }

  // Preferred upload path: presigned direct-to-object-storage (R2/S3/…).
  @Post('lessons/:lessonId/upload-url')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  getUploadUrl(
    @Param('lessonId') lessonId: string,
    @Body() dto: VideoUploadUrlDto,
  ) {
    return this.video.getUploadUrl(lessonId, dto.filename, dto.contentType)
  }

  @Post('lessons/:lessonId/attach-key')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  attachKey(@Param('lessonId') lessonId: string, @Body() dto: AttachKeyDto) {
    return this.video.attachUploadedKey(lessonId, dto.key)
  }

  // Attach a video by URL (mp4 / HLS .m3u8 / YouTube).
  @Post('lessons/:lessonId/url')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  setUrl(@Param('lessonId') lessonId: string, @Body() dto: SetVideoUrlDto) {
    return this.video.setVideoUrl(lessonId, dto.videoUrl)
  }

  // Upload a video file (multipart). Stored locally and served at /uploads;
  // transcoded to HLS when FFmpeg is available.
  @Post('lessons/:lessonId/upload')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  async upload(@Param('lessonId') lessonId: string, @Req() req: MultipartRequest) {
    if (typeof req.file !== 'function') {
      throw new BadRequestException('File uploads are not enabled')
    }
    const data = await req.file()
    if (!data) throw new BadRequestException('No file uploaded')

    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'video.mp4'
    const dir = join(UPLOAD_DIR, 'videos', lessonId)
    mkdirSync(dir, { recursive: true })
    const abs = join(dir, safe)
    await pipeline(data.file, createWriteStream(abs))

    return this.video.attachUploadedFile(
      lessonId,
      `/uploads/videos/${lessonId}/${safe}`,
      abs,
    )
  }

  @Post(':lessonId/process')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  processVideo(
    @Param('lessonId') lessonId: string,
    @Body() dto: ProcessVideoDto,
  ) {
    return this.video.processUploadedVideo(lessonId, dto.s3Key)
  }
}
