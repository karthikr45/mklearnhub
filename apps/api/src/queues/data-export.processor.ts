import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import type { Job } from 'bullmq'

import { DataSubjectService } from '../modules/audit/data-subject.service'
import { DATA_EXPORT_QUEUE, DataExportJob } from './data-export.queue'

@Processor(DATA_EXPORT_QUEUE)
export class DataExportProcessor extends WorkerHost {
  private readonly logger = new Logger(DataExportProcessor.name)

  constructor(private readonly dsr: DataSubjectService) {
    super()
  }

  async process(job: Job<DataExportJob>): Promise<void> {
    this.logger.log(`Exporting data for request ${job.data.requestId}`)
    await this.dsr.processDataExport(job.data.requestId)
  }
}
