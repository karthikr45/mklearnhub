import {
  Body,
  Controller,
  ForbiddenException,
  Get,
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
import { BrandingService } from './branding.service'
import { BrandingAssetDto, SaveBrandingDto } from './dto/save-branding.dto'

@ApiTags('branding')
@Controller('branding')
export class BrandingController {
  constructor(private readonly branding: BrandingService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN')
  saveBrandingConfig(
    @Body() dto: SaveBrandingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.branding.saveBrandingConfig(this.orgId(user), dto)
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getBranding(@CurrentUser() user: JwtPayload) {
    return this.branding.getBranding(this.orgId(user))
  }

  // Public — consumed by the web app's tenant-resolution middleware.
  @Get('by-domain')
  getBrandingForDomain(@Query('domain') domain: string) {
    return this.branding.getBrandingForDomain(domain)
  }

  @Post('verify-domain')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN')
  verifyCustomDomain(@CurrentUser() user: JwtPayload) {
    return this.branding.verifyCustomDomain(this.orgId(user))
  }

  @Post('assets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN')
  uploadBrandingAsset(
    @Body() dto: BrandingAssetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.branding.uploadBrandingAsset(this.orgId(user), dto)
  }
}
