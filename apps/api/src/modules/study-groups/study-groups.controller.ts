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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import {
  AddResourceDto,
  CreateStudyGroupDto,
  PostMessageDto,
} from './dto/study-group.dto'
import { StudyGroupsService } from './study-groups.service'

@ApiTags('study-groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('study-groups')
export class StudyGroupsController {
  constructor(private readonly groups: StudyGroupsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.groups.list(user)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStudyGroupDto) {
    return this.groups.create(user, dto)
  }

  // Staff moderation review — declared before :groupId so it isn't shadowed.
  @Get('moderation-log')
  moderationLog(@CurrentUser() user: JwtPayload) {
    return this.groups.moderationLog(user)
  }

  @Get(':groupId')
  detail(@CurrentUser() user: JwtPayload, @Param('groupId') groupId: string) {
    return this.groups.detail(user, groupId)
  }

  @Post(':groupId/join')
  join(@CurrentUser() user: JwtPayload, @Param('groupId') groupId: string) {
    return this.groups.join(user, groupId)
  }

  @Delete(':groupId/leave')
  leave(@CurrentUser() user: JwtPayload, @Param('groupId') groupId: string) {
    return this.groups.leave(user, groupId)
  }

  @Get(':groupId/messages')
  messages(@CurrentUser() user: JwtPayload, @Param('groupId') groupId: string) {
    return this.groups.messages(user, groupId)
  }

  @Post(':groupId/messages')
  postMessage(
    @CurrentUser() user: JwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: PostMessageDto,
  ) {
    return this.groups.postMessage(user, groupId, dto)
  }

  @Get(':groupId/resources')
  resources(@CurrentUser() user: JwtPayload, @Param('groupId') groupId: string) {
    return this.groups.resources(user, groupId)
  }

  @Post(':groupId/resources')
  addResource(
    @CurrentUser() user: JwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: AddResourceDto,
  ) {
    return this.groups.addResource(user, groupId, dto)
  }
}
