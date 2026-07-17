import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { BillingService } from './billing.service'
import { CreateCheckoutDto } from './dto/create-checkout.dto'

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.billing.createCheckoutSession(
      this.orgId(user),
      dto.plan,
      dto.returnUrl,
    )
  }

  @Post('webhook')
  handleWebhook(
    @Body() payload: unknown,
    @Headers('stripe-signature') signature: string,
  ) {
    // Stripe requires the raw payload for signature verification.
    const raw =
      typeof payload === 'string' ? payload : JSON.stringify(payload ?? {})
    return this.billing.handleWebhook(raw, signature ?? '')
  }

  @Post('cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: JwtPayload) {
    return this.billing.cancelSubscription(this.orgId(user))
  }

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getSubscription(@CurrentUser() user: JwtPayload) {
    return this.billing.getSubscription(this.orgId(user))
  }
}
