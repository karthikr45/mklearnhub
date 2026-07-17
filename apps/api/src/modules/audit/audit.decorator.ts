import { SetMetadata } from '@nestjs/common'

export const AUDIT_KEY = 'audit'

export interface AuditMeta {
  action: string
  resource: string
}

/**
 * Marks a handler for explicit audit logging by the AuditInterceptor.
 * Usage: @Audit('course.publish', 'Course')
 */
export const Audit = (action: string, resource: string) =>
  SetMetadata(AUDIT_KEY, { action, resource } satisfies AuditMeta)
