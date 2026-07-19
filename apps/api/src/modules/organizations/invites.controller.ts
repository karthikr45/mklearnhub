import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { OrganizationsService } from './organizations.service'

@ApiTags('invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get(':token')
  getInviteByToken(@Param('token') token: string) {
    return this.orgs.getInviteByToken(token)
  }
}
