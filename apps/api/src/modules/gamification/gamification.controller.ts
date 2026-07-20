import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { GamificationService } from './gamification.service'

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly game: GamificationService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.game.me(user.sub)
  }

  @Get('leaderboard')
  leaderboard(@CurrentUser() user: JwtPayload) {
    return this.game.leaderboard(user.orgId, user.sub)
  }
}
