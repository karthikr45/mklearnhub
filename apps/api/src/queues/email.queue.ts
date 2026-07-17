/**
 * Email queue.
 *
 * Declaration only — no BullMQ connection at import time. Wired to a Worker
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const EMAIL_QUEUE = 'email'

export interface EmailJob {
  to: string
  subject: string
  template: string
  data?: Record<string, unknown>
}
