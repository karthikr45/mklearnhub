import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { XapiStatementDto } from './dto/xapi-statement.dto'
import { ScormService } from './scorm.service'

/**
 * Minimal Learning Record Store (LRS) surface. Mounted on a dedicated
 * controller so the routes live under /xapi/... rather than the scorm prefix.
 */
@ApiTags('xapi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('xapi')
export class XapiController {
  constructor(private readonly scorm: ScormService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Post('statements')
  receiveXapiStatement(
    @CurrentUser() user: JwtPayload,
    @Body() statement: XapiStatementDto,
  ) {
    return this.scorm.receiveXapiStatement(this.orgId(user), statement)
  }

  @Get('statements')
  queryXapiStatements(
    @CurrentUser() user: JwtPayload,
    @Query('agent') agent?: string,
    @Query('verb') verb?: string,
    @Query('activity') activity?: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('limit') limit?: string,
  ) {
    return this.scorm.queryXapiStatements(this.orgId(user), {
      ...(agent ? { agent } : {}),
      ...(verb ? { verb } : {}),
      ...(activity ? { activity } : {}),
      ...(since ? { since } : {}),
      ...(until ? { until } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
    })
  }

  @Get('statements/:id')
  getStatement(@Param('id') id: string) {
    return this.scorm.getStatement(id)
  }
}
