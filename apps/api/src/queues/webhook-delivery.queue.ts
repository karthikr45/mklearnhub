/**
 * webhook-delivery queue — lightweight declaration only. No BullMQ connection is opened
 * at import time. Registered as a real Worker by EnterpriseQueuesModule only
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const WEBHOOK_DELIVERY_QUEUE = 'webhook-delivery'

export interface WebhookDeliveryJob {
  deliveryId: string
}
