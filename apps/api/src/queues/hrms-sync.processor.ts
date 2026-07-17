import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import type { Job } from 'bullmq'

import { HrmsService } from '../modules/hrms/hrms.service'
import { HRMS_SYNC_QUEUE, HrmsSyncJob } from './hrms-sync.queue'

@Processor(HRMS_SYNC_QUEUE)
export class HrmsSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(HrmsSyncProcessor.name)

  constructor(private readonly hrms: HrmsService) {
    super()
  }

  async process(job: Job<HrmsSyncJob>): Promise<void> {
    if (job.data.syncLogId) {
      this.logger.log(`Processing HRMS event ${job.data.syncLogId}`)
      await this.hrms.processHrmsEvent(job.data.syncLogId)
    }
    // Bulk CSV imports are dispatched with a bulkImportJobId; the rows are
    // loaded from storage in production. Handled inline locally.
  }
}
