import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Get('dashboard')
  getOrgDashboard(@CurrentUser() user: JwtPayload) {
    return this.analytics.getOrgDashboard(this.orgId(user))
  }

  @Get('school')
  getSchoolReport(@CurrentUser() user: JwtPayload) {
    return this.analytics.getSchoolReport(this.orgId(user))
  }

  @Get('learners/:userId')
  getLearnerReport(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.analytics.getLearnerReport(userId, this.orgId(user))
  }

  @Get('courses/:courseId')
  getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.analytics.getCourseAnalytics(courseId)
  }

  @Get('export')
  exportReport(
    @Query('type') type: string,
    @Query('format') format: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.analytics.exportReport(
      this.orgId(user),
      type ?? 'summary',
      format === 'csv' ? 'csv' : 'json',
    )
  }
}
