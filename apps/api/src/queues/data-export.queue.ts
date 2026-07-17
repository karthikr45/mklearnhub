/**
 * data-export queue — lightweight declaration only. No BullMQ connection is opened
 * at import time. Registered as a real Worker by EnterpriseQueuesModule only
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const DATA_EXPORT_QUEUE = 'data-export'

export interface DataExportJob {
  requestId: string
}
