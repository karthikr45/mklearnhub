/**
 * Analytics aggregation queue.
 *
 * Declaration only — no BullMQ connection at import time. Wired to a Worker
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const ANALYTICS_QUEUE = 'analytics'

export interface AnalyticsJob {
  organizationId: string
  event: string
  payload?: Record<string, unknown>
}
