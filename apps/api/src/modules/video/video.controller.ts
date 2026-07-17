import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ProcessVideoDto } from './dto/process-video.dto'
import { VideoService } from './video.service'

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
    return this.video.getStreamUrl(lessonId, user.sub)
  }

  @Post(':lessonId/process')
  processVideo(
    @Param('lessonId') lessonId: string,
    @Body() dto: ProcessVideoDto,
  ) {
    return this.video.processUploadedVideo(lessonId, dto.s3Key)
  }
}
