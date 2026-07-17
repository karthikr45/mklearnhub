/**
 * instance-provision queue — lightweight declaration only. No BullMQ connection is opened
 * at import time. Registered as a real Worker by EnterpriseQueuesModule only
 * when ENABLE_QUEUES=true and REDIS_URL is set.
 */
export const INSTANCE_PROVISION_QUEUE = 'instance-provision'

export interface InstanceProvisionJob {
  organizationId: string
  subdomain: string
}
