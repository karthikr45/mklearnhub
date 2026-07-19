import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
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
import { CreatePortalDto } from './dto/create-portal.dto'
import { SavePageDto } from './dto/save-page.dto'
import { UpdatePortalDto } from './dto/update-portal.dto'
import { PortalsService } from './portals.service'

@ApiTags('portals')
@Controller('portals')
export class PortalsController {
  constructor(private readonly portals: PortalsService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  // ─── Public (no auth) ──────────────────────────────
  @Get('public/:id')
  getPublic(@Param('id') id: string) {
    return this.portals.getPublic(id)
  }

  // ─── Authenticated ─────────────────────────────────
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: JwtPayload) {
    return this.portals.list(this.orgId(user))
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  create(@Body() dto: CreatePortalDto, @CurrentUser() user: JwtPayload) {
    return this.portals.create(this.orgId(user), dto)
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.portals.getOne(id, this.orgId(user))
  }

  @Get(':id/data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getData(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.portals.getBuilderData(id, this.orgId(user))
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePortalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.portals.update(id, this.orgId(user), dto)
  }

  @Put(':id/page')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  savePage(
    @Param('id') id: string,
    @Body() dto: SavePageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.portals.savePage(id, this.orgId(user), dto.pageJson)
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.portals.remove(id, this.orgId(user))
  }
}
