import { Module } from '@nestjs/common'

import { ApiGatewayController } from './api-gateway.controller'
import { ApiKeyGuard } from './api-key.guard'
import { ApiKeyService } from './api-key.service'
import { RateLimitService } from './rate-limit.service'
import { WebhookService } from './webhook.service'

@Module({
  controllers: [ApiGatewayController],
  providers: [ApiKeyService, RateLimitService, WebhookService, ApiKeyGuard],
  exports: [ApiKeyService, RateLimitService, WebhookService, ApiKeyGuard],
})
export class ApiGatewayModule {}
