import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateOrgDto } from './dto/create-org.dto'
import { InviteUserDto } from './dto/invite-user.dto'
import { UpdateOrgDto } from './dto/update-org.dto'
import { OrganizationsService } from './organizations.service'

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrgDto, @CurrentUser() user: JwtPayload) {
    return this.orgs.create(dto, user.sub)
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.orgs.findById(id)
  }

  @Patch(':id')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateOrgDto) {
    return this.orgs.update(id, dto)
  }

  @Get(':id/members')
  getMembers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.orgs.getMembers(id, Number(page) || 1, Number(pageSize) || 20)
  }

  @Post(':id/invites')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  invite(
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orgs.inviteUser(id, dto, user.sub)
  }

  @Delete(':id/members/:userId')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.orgs.removeMember(id, userId)
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.orgs.getStats(id)
  }
}
