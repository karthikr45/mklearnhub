import { BullModule } from '@nestjs/bullmq'
import { DynamicModule, Module } from '@nestjs/common'

import { ApiGatewayModule } from '../modules/api-gateway/api-gateway.module'
import { HrmsModule } from '../modules/hrms/hrms.module'
import { ScormModule } from '../modules/scorm/scorm.module'
import { DataExportProcessor } from './data-export.processor'
import { DATA_EXPORT_QUEUE } from './data-export.queue'
import { HrmsSyncProcessor } from './hrms-sync.processor'
import { HRMS_SYNC_QUEUE } from './hrms-sync.queue'
import { InstanceProvisionProcessor } from './instance-provision.processor'
import { INSTANCE_PROVISION_QUEUE } from './instance-provision.queue'
import { ScormProcessProcessor } from './scorm-process.processor'
import { SCORM_PROCESS_QUEUE } from './scorm-process.queue'
import { WebhookDeliveryProcessor } from './webhook-delivery.processor'
import { WEBHOOK_DELIVERY_QUEUE } from './webhook-delivery.queue'

const QUEUE_NAMES = [
  SCORM_PROCESS_QUEUE,
  HRMS_SYNC_QUEUE,
  WEBHOOK_DELIVERY_QUEUE,
  DATA_EXPORT_QUEUE,
  INSTANCE_PROVISION_QUEUE,
]

/**
 * Registers BullMQ workers ONLY when ENABLE_QUEUES=true and REDIS_URL is set.
 * When disabled (the local default), this module contributes nothing and no
 * Redis connection is ever opened — the feature services process jobs inline.
 */
@Module({})
export class EnterpriseQueuesModule {
  static register(): DynamicModule {
    const enabled =
      process.env.ENABLE_QUEUES === 'true' && Boolean(process.env.REDIS_URL)

    if (!enabled) {
      return { module: EnterpriseQueuesModule }
    }

    const redisUrl = new URL(process.env.REDIS_URL as string)
    return {
      module: EnterpriseQueuesModule,
      imports: [
        BullModule.forRoot({
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port || 6379),
            ...(redisUrl.password ? { password: redisUrl.password } : {}),
          },
        }),
        ...QUEUE_NAMES.map((name) => BullModule.registerQueue({ name })),
        ScormModule,
        HrmsModule,
        ApiGatewayModule,
      ],
      providers: [
        ScormProcessProcessor,
        HrmsSyncProcessor,
        WebhookDeliveryProcessor,
        DataExportProcessor,
        InstanceProvisionProcessor,
      ],
    }
  }
}
