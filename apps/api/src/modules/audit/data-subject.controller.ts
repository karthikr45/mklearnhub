import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { DataSubjectService } from './data-subject.service'

@ApiTags('privacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('privacy')
export class DataSubjectController {
  constructor(private readonly dsr: DataSubjectService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Post('export-request')
  requestExport(@CurrentUser() user: JwtPayload) {
    return this.dsr.requestDataExport(user.sub, this.orgId(user))
  }

  @Post('delete-request')
  requestDeletion(@CurrentUser() user: JwtPayload) {
    return this.dsr.requestDataDeletion(user.sub, this.orgId(user))
  }

  @Get('requests')
  listMine(@CurrentUser() user: JwtPayload) {
    return this.dsr.listMyRequests(user.sub)
  }

  @Get('admin/requests')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  listAll(@CurrentUser() user: JwtPayload) {
    return this.dsr.listAllRequests(this.orgId(user))
  }

  @Put('admin/requests/:id')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  process(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dsr.processRequest(id, body.action, this.orgId(user))
  }
}
