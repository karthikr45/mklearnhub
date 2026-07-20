import { Injectable, Logger } from '@nestjs/common'
import {
  moderateResource,
  moderateText,
  type ModerationResult,
  type ResourceInput,
} from '@learnhub/compliance'

import { PrismaService } from '../../prisma/prisma.service'

/**
 * Applies the child-safety screen to every message/resource and records the
 * decision in `moderation_events` so school staff can audit it. Blocking is
 * enforced by the caller (the service throws on BLOCKED); this class is the
 * single choke point where screening + logging happen together.
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name)

  constructor(private readonly prisma: PrismaService) {}

  async screenMessage(params: {
    userId: string
    organizationId: string | null
    body: string
  }): Promise<ModerationResult> {
    const result = moderateText(params.body)
    await this.record({
      userId: params.userId,
      organizationId: params.organizationId,
      targetType: 'MESSAGE',
      result,
      excerpt: params.body.slice(0, 280),
    })
    return result
  }

  async screenResource(params: {
    userId: string
    organizationId: string | null
    resource: ResourceInput
  }): Promise<ModerationResult> {
    const result = moderateResource(params.resource)
    await this.record({
      userId: params.userId,
      organizationId: params.organizationId,
      targetType: 'RESOURCE',
      result,
      excerpt: [params.resource.title, params.resource.url, params.resource.fileName]
        .filter(Boolean)
        .join(' | ')
        .slice(0, 280),
    })
    return result
  }

  private async record(params: {
    userId: string
    organizationId: string | null
    targetType: 'MESSAGE' | 'RESOURCE'
    result: ModerationResult
    excerpt: string
  }) {
    // Only persist non-clean decisions — the audit trail is about flags and
    // blocks, not every approved message.
    if (params.result.status === 'APPROVED') return
    try {
      await this.prisma.moderationEvent.create({
        data: {
          userId: params.userId,
          organizationId: params.organizationId,
          targetType: params.targetType,
          status: params.result.status,
          reasons: params.result.reasons,
          matched: params.result.matched,
          excerpt: params.excerpt,
        },
      })
    } catch (err) {
      // Never let audit logging break the request path.
      this.logger.error(`Failed to record moderation event: ${String(err)}`)
    }
    if (params.result.status === 'BLOCKED') {
      this.logger.warn(
        `Blocked ${params.targetType} from user ${params.userId}: ${params.result.reasons.join(', ')}`,
      )
    }
  }
}
