/**
 * Video processing queue.
 *
 * These are lightweight declarations only — no BullMQ connection is opened at
 * import time. When ENABLE_QUEUES=true and REDIS_URL is set, a Queue/Worker is
 * constructed elsewhere (dynamically importing `bullmq`) using this name and
 * the payload interface below.
 */
export const VIDEO_PROCESSING_QUEUE = 'video-processing'

export interface VideoProcessingJob {
  lessonId: string
  s3Key: string
  organizationId: string
}
