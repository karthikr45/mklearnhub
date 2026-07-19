import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { FastifyRequest } from 'fastify'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { BillingService } from './billing.service'
import { CheckoutDto } from './dto/checkout.dto'
import { CreateCheckoutDto } from './dto/create-checkout.dto'
import { VerifyDto } from './dto/verify.dto'

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('User has no organization')
    return user.orgId
  }

  // ─── Razorpay / plan catalog ───────────────────────────────

  @Get('plans')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getPlans(@CurrentUser() user: JwtPayload) {
    return this.billing.getPlans(this.orgId(user))
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN')
  checkout(@Body() dto: CheckoutDto, @CurrentUser() user: JwtPayload) {
    return this.billing.checkout(this.orgId(user), dto.plan)
  }

  @Post('verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN')
  verify(@Body() dto: VerifyDto, @CurrentUser() user: JwtPayload) {
    return this.billing.verifyAndActivate(this.orgId(user), dto.plan, {
      razorpay_order_id: dto.razorpay_order_id,
      razorpay_payment_id: dto.razorpay_payment_id,
      razorpay_signature: dto.razorpay_signature,
    })
  }

  @Post('razorpay/webhook')
  handleRazorpayWebhook(
    @Req() req: FastifyRequest,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // Fastify has already parsed the JSON body; re-serialize for HMAC.
    const raw = JSON.stringify(req.body ?? {})
    return this.billing.handleRazorpayWebhook(raw, signature ?? '')
  }

  @Post('cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORG_ADMIN')
  cancel(@CurrentUser() user: JwtPayload) {
    return this.billing.cancel(this.orgId(user))
  }

  @Get('subscription')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getSubscription(@CurrentUser() user: JwtPayload) {
    return this.billing.getSubscription(this.orgId(user))
  }

  // ─── Stripe (existing, kept alongside) ─────────────────────

  @Post('stripe/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createStripeCheckout(
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

  @Post('stripe/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancelStripe(@CurrentUser() user: JwtPayload) {
    return this.billing.cancelSubscription(this.orgId(user))
  }
}
