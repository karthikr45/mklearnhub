import { Module } from '@nestjs/common'

import { ApiGatewayModule } from '../api-gateway/api-gateway.module'
import { PublicApiController } from './public-api.controller'

@Module({
  imports: [ApiGatewayModule],
  controllers: [PublicApiController],
})
export class PublicApiModule {}
