import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaService } from '../../prisma/prisma.service'

export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface PushPayload {
  title: string
  body?: string
  url?: string
  tag?: string
}

/**
 * Web Push delivery. Entirely optional: without VAPID keys the service reports
 * itself unconfigured and every send is a no-op, so notifications still work
 * in-app over sockets. The `web-push` library is imported lazily so this module
 * never touches the network at construction time.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name)
  private readonly publicKey: string | undefined
  private readonly privateKey: string | undefined
  private readonly subject: string

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.publicKey = this.config.get<string>('VAPID_PUBLIC_KEY')
    this.privateKey = this.config.get<string>('VAPID_PRIVATE_KEY')
    this.subject =
      this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:support@learnhub.com'
  }

  isConfigured(): boolean {
    return Boolean(this.publicKey && this.privateKey)
  }

  getPublicKey(): string | null {
    return this.publicKey ?? null
  }

  async subscribe(userId: string, sub: PushSubscriptionInput) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    })
    return { subscribed: true }
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } })
    return { unsubscribed: true }
  }

  /**
   * Best-effort push to every device a user has registered. Silently no-ops
   * when unconfigured; prunes subscriptions the push service reports as gone.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.isConfigured()) return
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    })
    if (subs.length === 0) return

    let webpush: typeof import('web-push')
    try {
      webpush = await import('web-push')
    } catch {
      this.logger.warn('web-push not installed — skipping push send')
      return
    }
    webpush.setVapidDetails(
      this.subject,
      this.publicKey as string,
      this.privateKey as string,
    )

    const body = JSON.stringify(payload)
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          )
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode
          if (status === 404 || status === 410) {
            // Subscription is dead — remove it.
            await this.prisma.pushSubscription
              .deleteMany({ where: { endpoint: s.endpoint } })
              .catch(() => undefined)
          } else {
            this.logger.warn(`push send failed (${status ?? 'unknown'})`)
          }
        }
      }),
    )
  }
}
