/**
 * Certificate generation queue.
 *
 * Declaration only — no BullMQ connection at import time. Wired to a Worker
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const CERTIFICATE_QUEUE = 'certificate'

export interface CertificateJob {
  enrollmentId: string
  userId: string
  courseId: string
}
