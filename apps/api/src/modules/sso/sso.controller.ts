import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Param,
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
import { ConfigureSsoDto } from './dto/configure-sso.dto'
import { SsoService } from './sso.service'

@ApiTags('sso')
@Controller('sso')
export class SsoController {
  constructor(private readonly sso: SsoService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) {
      throw new ForbiddenException('No organization context')
    }
    return user.orgId
  }

  @Post('configure')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  configure(@Body() dto: ConfigureSsoDto, @CurrentUser() user: JwtPayload) {
    return this.sso.saveSsoConfig(this.orgId(user), dto)
  }

  @Get('config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  getConfig(@CurrentUser() user: JwtPayload) {
    return this.sso.getSsoConfig(this.orgId(user))
  }

  @Post('test')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  test(
    @Body() body: { testEmail?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sso.testSsoConnection(this.orgId(user), body.testEmail)
  }

  @Delete('config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  deleteConfig(@CurrentUser() user: JwtPayload) {
    return this.sso.deleteSsoConfig(this.orgId(user))
  }

  // ─── Public SSO endpoints (no JWT) ───────────────────────

  @Get('metadata')
  @Header('Content-Type', 'application/xml')
  getSpMetadata(@Query('orgId') orgId: string) {
    // Public so IdPs can fetch SP metadata; the org is identified by query param.
    return this.sso.getSpMetadata(orgId)
  }

  @Get(':orgSlug/login')
  initiateLogin(@Param('orgSlug') orgSlug: string) {
    return this.sso.initiateSsoLogin(orgSlug)
  }

  @Post(':orgSlug/callback')
  handleCallback(
    @Param('orgSlug') orgSlug: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.sso.handleSamlCallback(orgSlug, body)
  }
}
