import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SubscribeDto, UnsubscribeDto } from './dto/subscribe.dto'
import { PushService } from './push.service'

@ApiTags('push')
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  /** Public — the browser needs the VAPID public key to subscribe. */
  @Get('public-key')
  getPublicKey() {
    return { publicKey: this.push.getPublicKey(), configured: this.push.isConfigured() }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(@CurrentUser() user: JwtPayload, @Body() dto: SubscribeDto) {
    return this.push.subscribe(user.sub, { endpoint: dto.endpoint, keys: dto.keys })
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('unsubscribe')
  unsubscribe(@Body() dto: UnsubscribeDto) {
    return this.push.unsubscribe(dto.endpoint)
  }
}
