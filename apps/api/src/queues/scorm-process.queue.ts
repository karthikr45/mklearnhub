/**
 * scorm-process queue — lightweight declaration only. No BullMQ connection is opened
 * at import time. Registered as a real Worker by EnterpriseQueuesModule only
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const SCORM_PROCESS_QUEUE = 'scorm-process'

export interface ScormProcessJob {
  packageId: string
}
