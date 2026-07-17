import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { TrackScormDto } from './dto/track-scorm.dto'
import { UploadScormDto } from './dto/upload-scorm.dto'
import { ScormService } from './scorm.service'

@ApiTags('scorm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scorm')
export class ScormController {
  constructor(private readonly scorm: ScormService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  // Production uses @fastify/multipart to stream the .zip; locally we accept a
  // JSON body describing an already-uploaded (or placeholder) package.
  @Post('packages/upload')
  @Roles('ORG_ADMIN')
  uploadScormPackage(
    @Body() dto: UploadScormDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scorm.uploadScormPackage(this.orgId(user), dto)
  }

  @Get('packages')
  listPackages(@CurrentUser() user: JwtPayload) {
    return this.scorm.listPackages(this.orgId(user))
  }

  @Get('packages/:id')
  getPackage(@Param('id') id: string) {
    return this.scorm.getPackage(id)
  }

  @Delete('packages/:id')
  @Roles('ORG_ADMIN')
  deletePackage(@Param('id') id: string) {
    return this.scorm.deletePackage(id)
  }

  @Get('packages/:id/launch')
  getLaunchUrl(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.scorm.getLaunchUrl(id, user)
  }

  @Post('packages/:id/track')
  track(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: TrackScormDto,
  ) {
    return this.scorm.track(id, user, dto)
  }
}
