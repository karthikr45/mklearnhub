import { ForbiddenException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '../../prisma/prisma.service'

export interface RoomToken {
  configured: boolean
  url?: string
  token?: string
  room?: string
  identity?: string
}

/**
 * LiveKit access-token minting for live study rooms (audio/video). Optional:
 * without LIVEKIT_* env vars the service reports `configured: false` and the UI
 * shows a graceful "not enabled" state. The `livekit-server-sdk` is imported
 * lazily so this module never touches the network at construction time.
 */
@Injectable()
export class RoomsService {
  private readonly url: string | undefined
  private readonly apiKey: string | undefined
  private readonly apiSecret: string | undefined

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.url = this.config.get<string>('LIVEKIT_URL')
    this.apiKey = this.config.get<string>('LIVEKIT_API_KEY')
    this.apiSecret = this.config.get<string>('LIVEKIT_API_SECRET')
  }

  isConfigured(): boolean {
    return Boolean(this.url && this.apiKey && this.apiSecret)
  }

  /**
   * Mint a token for a study-group room. The caller must be a member of the
   * group — this keeps rooms private to their study group (child-safety).
   */
  async getStudyGroupToken(
    userId: string,
    groupId: string,
    displayName: string,
  ): Promise<RoomToken> {
    const membership = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })
    if (!membership) {
      throw new ForbiddenException('You are not a member of this group')
    }

    if (!this.isConfigured()) return { configured: false }

    const { AccessToken } = await import('livekit-server-sdk')
    const room = `study-${groupId}`
    const at = new AccessToken(this.apiKey as string, this.apiSecret as string, {
      identity: userId,
      name: displayName,
      ttl: '1h',
    })
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })
    const token = await at.toJwt()
    return {
      configured: true,
      url: this.url as string,
      token,
      room,
      identity: userId,
    }
  }
}
