import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AuditService } from './audit.service'
import { AuditQueryDto } from './dto/audit-query.dto'

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN', 'SUPER_ADMIN')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Get('logs')
  query(@Query() filters: AuditQueryDto, @CurrentUser() user: JwtPayload) {
    return this.audit.query(this.orgId(user), filters)
  }

  @Get('logs/export')
  async export(
    @Query() filters: AuditQueryDto,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @CurrentUser() user: JwtPayload,
    @Res() res: FastifyReply,
  ) {
    const body = await this.audit.export(this.orgId(user), filters, format)
    const contentType = format === 'json' ? 'application/json' : 'text/csv'
    void res
      .header('Content-Type', contentType)
      .header('Content-Disposition', `attachment; filename="audit-logs.${format}"`)
      .send(body)
  }

  @Get('logs/:id')
  getLog(@Param('id') id: string) {
    return this.audit.getLog(id)
  }
}
