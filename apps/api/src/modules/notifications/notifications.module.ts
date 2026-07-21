import { Module } from '@nestjs/common'

import { PushModule } from '../push/push.module'
import { NotificationsController } from './notifications.controller'
import { NotificationsGateway } from './notifications.gateway'
import { NotificationsService } from './notifications.service'

@Module({
  imports: [PushModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
