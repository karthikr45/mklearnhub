import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { ContentService } from './content.service'
import {
  CompleteUploadDto,
  CreateContentDto,
  CreateMappingDto,
  RequestUploadDto,
  UpdateContentDto,
} from './dto/content.dto'

// Content authoring is platform-level; managed by admins. (Content-specific
// roles — CONTENT_ADMIN/EDITOR/SME/REVIEWER — can be promoted to real roles
// later without changing these routes.)
@ApiTags('content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ORG_ADMIN')
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  /** Step 1: license gate + presigned direct-to-storage upload URL. */
  @Post('upload-url')
  requestUpload(@CurrentUser() user: JwtPayload, @Body() dto: RequestUploadDto) {
    return this.content.requestUpload(user.sub, dto)
  }

  /** Step 2: confirm the uploaded object. */
  @Post(':id/complete')
  complete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.content.completeUpload(user.sub, id, dto)
  }

  /** Inline (rich text/MCQ) or external-reference asset — no file upload. */
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateContentDto) {
    return this.content.createContent(user.sub, dto)
  }

  @Get()
  list(
    @Query('status') status?: string,
    @Query('contentType') contentType?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.content.list({
      ...(status ? { status } : {}),
      ...(contentType ? { contentType } : {}),
      ...(take ? { take: Number(take) } : {}),
      ...(skip ? { skip: Number(skip) } : {}),
    })
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.content.get(id)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.content.update(user.sub, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.content.remove(user.sub, id)
  }

  @Post(':id/mappings')
  addMapping(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateMappingDto,
  ) {
    return this.content.addMapping(user.sub, id, dto)
  }

  @Post(':id/review')
  review(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.content.transition(user.sub, id, 'UNDER_REVIEW')
  }
  @Post(':id/approve')
  approve(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.content.transition(user.sub, id, 'APPROVED')
  }
  @Post(':id/publish')
  publish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.content.transition(user.sub, id, 'PUBLISHED')
  }
  @Post(':id/archive')
  archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.content.transition(user.sub, id, 'ARCHIVED')
  }
}
