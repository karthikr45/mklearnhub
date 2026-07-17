import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'
import type { CsvTemplateType } from '@learnhub/utils'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { ConfigureHrmsDto } from './dto/configure-hrms.dto'
import { HrmsService } from './hrms.service'

@ApiTags('hrms')
@Controller('hrms')
export class HrmsController {
  constructor(private readonly hrms: HrmsService) {}

  @Post('configure')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  configure(@Body() dto: ConfigureHrmsDto, @CurrentUser() user: JwtPayload) {
    return this.hrms.configureHrms(this.hrms.orgId(user), dto)
  }

  @Get('config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.hrms.getHrmsConfig(this.hrms.orgId(user))
  }

  @Post('sync/manual')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  triggerManualSync(@CurrentUser() user: JwtPayload) {
    return this.hrms.triggerManualSync(this.hrms.orgId(user))
  }

  @Get('sync/logs')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  getSyncLogs(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hrms.getSyncLogs(this.hrms.orgId(user), {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    })
  }

  @Post('import/csv')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  uploadCsv(
    @Body()
    body: {
      type: CsvTemplateType
      filename: string
      rows: Record<string, string>[]
    },
    @CurrentUser() user: JwtPayload,
  ) {
    // Production uses @fastify/multipart to accept the file and streams it to S3;
    // here we accept the parsed rows as JSON for local simplicity.
    return this.hrms.uploadCsvForImport(this.hrms.orgId(user), user.sub, body)
  }

  @Get('import/:jobId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  getImportJob(@Param('jobId') jobId: string) {
    return this.hrms.getImportJobStatus(jobId)
  }

  // ─── Public webhook (HMAC-verified, no JWT) ──────────────

  @Post('webhook/:orgId')
  receiveWebhook(
    @Param('orgId') orgId: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-hrms-signature') signature?: string,
  ) {
    return this.hrms.receiveHrmsWebhook(orgId, body, signature)
  }
}
