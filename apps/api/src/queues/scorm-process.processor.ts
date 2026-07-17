import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import type { Job } from 'bullmq'

import { ScormService } from '../modules/scorm/scorm.service'
import { SCORM_PROCESS_QUEUE } from './scorm-process.queue'

interface ScormJob {
  packageId: string
}

@Processor(SCORM_PROCESS_QUEUE)
export class ScormProcessProcessor extends WorkerHost {
  private readonly logger = new Logger(ScormProcessProcessor.name)

  constructor(private readonly scorm: ScormService) {
    super()
  }

  async process(job: Job<ScormJob>): Promise<void> {
    this.logger.log(`Processing SCORM package ${job.data.packageId}`)
    await this.scorm.processScormPackage(job.data.packageId)
    this.logger.log(`Processed SCORM package ${job.data.packageId}`)
  }
}
