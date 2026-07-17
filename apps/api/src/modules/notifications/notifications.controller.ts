import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { NotificationsService } from './notifications.service'

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('unread')
  getUnread(@CurrentUser() user: JwtPayload) {
    return this.notifications.getUnread(user.sub)
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notifications.create(
      dto.userId,
      dto.type,
      dto.title,
      dto.body,
      dto.data,
    )
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notifications.markAllRead(user.sub)
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notifications.markAsRead(user.sub, id)
  }
}
