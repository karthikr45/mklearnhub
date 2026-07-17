import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import type { Job } from 'bullmq'

import {
  INSTANCE_PROVISION_QUEUE,
  InstanceProvisionJob,
} from './instance-provision.queue'

/**
 * Provisions a dedicated instance. The heavy lifting lives in
 * infra/scripts/provision-instance.ts (run out-of-process) — this worker
 * shells out to it in production. Kept as a logging stub so the queue module
 * type-checks without importing the infra script into the app bundle.
 */
@Processor(INSTANCE_PROVISION_QUEUE)
export class InstanceProvisionProcessor extends WorkerHost {
  private readonly logger = new Logger(InstanceProvisionProcessor.name)

  async process(job: Job<InstanceProvisionJob>): Promise<void> {
    this.logger.log(
      `Provisioning instance for org ${job.data.organizationId} (${job.data.subdomain})`,
    )
    // TODO: invoke infra/scripts/provision-instance.ts via child_process.
  }
}
