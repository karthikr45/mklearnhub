import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import type { Job } from 'bullmq'

import { WebhookService } from '../modules/api-gateway/webhook.service'
import { WEBHOOK_DELIVERY_QUEUE, WebhookDeliveryJob } from './webhook-delivery.queue'

@Processor(WEBHOOK_DELIVERY_QUEUE)
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name)

  constructor(private readonly webhooks: WebhookService) {
    super()
  }

  async process(job: Job<WebhookDeliveryJob>): Promise<void> {
    this.logger.log(`Delivering webhook ${job.data.deliveryId}`)
    await this.webhooks.deliverWebhook(job.data.deliveryId)
  }
}
