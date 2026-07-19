import { Module } from '@nestjs/common'

import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'
import { RazorpayService } from './razorpay.service'

@Module({
  controllers: [BillingController],
  providers: [BillingService, RazorpayService],
  exports: [BillingService],
})
export class BillingModule {}
