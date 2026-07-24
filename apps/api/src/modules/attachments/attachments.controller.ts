import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AttachmentsService } from './attachments.service'
import {
  AttachmentUploadUrlDto,
  CreateAttachmentDto,
} from './dto/attachment.dto'

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  /** Learner/staff: list a lesson's downloadable resources. */
  @Get('lessons/:lessonId/attachments')
  list(@Param('lessonId') lessonId: string) {
    return this.attachments.list(lessonId)
  }

  /** Learner/staff: mint a fresh download URL for one attachment. */
  @Get('attachments/:attachmentId/download')
  download(
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachments.getDownloadUrl(attachmentId, user.sub, user.role)
  }

  /** Staff: step 1 — presigned direct-to-storage upload URL. */
  @Post('lessons/:lessonId/attachments/upload-url')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  getUploadUrl(
    @Param('lessonId') lessonId: string,
    @Body() dto: AttachmentUploadUrlDto,
  ) {
    return this.attachments.getUploadUrl(lessonId, dto.filename, dto.contentType)
  }

  /** Staff: step 2 — register the uploaded object. */
  @Post('lessons/:lessonId/attachments')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  create(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.attachments.create(lessonId, dto)
  }

  /** Staff: remove an attachment. */
  @Delete('attachments/:attachmentId')
  @UseGuards(RolesGuard)
  @Roles('INSTRUCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')
  remove(@Param('attachmentId') attachmentId: string) {
    return this.attachments.remove(attachmentId)
  }
}
