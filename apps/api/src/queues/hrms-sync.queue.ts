/**
 * hrms-sync queue — lightweight declaration only. No BullMQ connection is opened
 * at import time. Registered as a real Worker by EnterpriseQueuesModule only
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const HRMS_SYNC_QUEUE = 'hrms-sync'

export interface HrmsSyncJob {
  syncLogId?: string
  bulkImportJobId?: string
}
