import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { createHmac, randomBytes } from 'node:crypto'
import type { Prisma, Webhook } from '@learnhub/db'
import { WebhookDeliveryStatus } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { RegisterWebhookDto } from './dto/register-webhook.dto'

const MAX_ATTEMPTS = 5
const DELIVERY_TIMEOUT_MS = 10_000

export interface UpdateWebhookInput {
  name?: string
  url?: string
  events?: string[]
  isActive?: boolean
}

export interface DeliveryQuery {
  page?: number
  limit?: number
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger('Webhook')

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async registerWebhook(
    orgId: string,
    dto: RegisterWebhookDto,
  ): Promise<{ webhook: Webhook; secret: string }> {
    const secret = `whsec_${randomBytes(24).toString('hex')}`

    // NOTE: production performs a reachability HEAD check on dto.url here
    // before persisting; skipped for local development.
    const webhook = await this.prisma.webhook.create({
      data: {
        name: dto.name,
        url: dto.url,
        secret,
        events: dto.events,
        organization: { connect: { id: orgId } },
      },
    })

    await this.audit.log({
      action: 'webhook.registered',
      resource: 'Webhook',
      resourceId: webhook.id,
      organizationId: orgId,
      newValues: { name: webhook.name, url: webhook.url, events: webhook.events },
    })

    // Secret is returned exactly once.
    return { webhook, secret }
  }

  async listWebhooks(orgId: string): Promise<Webhook[]> {
    return this.prisma.webhook.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateWebhook(
    id: string,
    orgId: string,
    dto: UpdateWebhookInput,
  ): Promise<Webhook> {
    const existing = await this.prisma.webhook.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('Webhook not found')

    const data: Prisma.WebhookUpdateInput = {
      ...(dto.name != null ? { name: dto.name } : {}),
      ...(dto.url != null ? { url: dto.url } : {}),
      ...(dto.events != null ? { events: dto.events } : {}),
      ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
    }
    return this.prisma.webhook.update({ where: { id }, data })
  }

  async deleteWebhook(id: string, orgId: string): Promise<{ success: true }> {
    const existing = await this.prisma.webhook.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('Webhook not found')

    await this.prisma.$transaction([
      this.prisma.webhookDelivery.deleteMany({ where: { webhookId: id } }),
      this.prisma.webhook.delete({ where: { id } }),
    ])
    return { success: true }
  }

  /**
   * Find active webhooks subscribed to `event` and deliver the payload to each.
   * In production each delivery is enqueued onto BullMQ; here we call
   * deliverWebhook inline (best-effort). // TODO: dispatch to BullMQ
   */
  async trigger(
    orgId: string,
    event: string,
    payload: Prisma.InputJsonValue,
  ): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId: orgId, isActive: true, events: { has: event } },
    })

    for (const webhook of webhooks) {
      try {
        const delivery = await this.prisma.webhookDelivery.create({
          data: {
            webhook: { connect: { id: webhook.id } },
            event,
            payload,
            status: WebhookDeliveryStatus.PENDING,
          },
        })
        // Inline best-effort delivery. // TODO: dispatch to BullMQ
        await this.deliverWebhook(delivery.id)
      } catch (err) {
        this.logger.warn(
          `Failed to enqueue delivery for webhook ${webhook.id}: ${String(err)}`,
        )
      }
    }
  }

  async deliverWebhook(deliveryId: string): Promise<void> {
    try {
      const delivery = await this.prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
        include: { webhook: true },
      })
      if (!delivery) return
      const { webhook } = delivery

      const body = {
        id: delivery.id,
        event: delivery.event,
        createdAt: delivery.createdAt.toISOString(),
        data: delivery.payload,
      }
      const serialized = JSON.stringify(body)
      const signature = createHmac('sha256', webhook.secret)
        .update(serialized)
        .digest('hex')

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

      let statusCode = 0
      let responseText = ''
      let ok = false
      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LearnHub-Signature': `sha256=${signature}`,
            'X-LearnHub-Event': delivery.event,
          },
          body: serialized,
          signal: controller.signal,
        })
        statusCode = res.status
        responseText = (await res.text()).slice(0, 2000)
        ok = res.ok
      } catch (err) {
        // Network failures are expected in local development.
        responseText = String(err).slice(0, 2000)
      } finally {
        clearTimeout(timeout)
      }

      if (ok) {
        await this.prisma.$transaction([
          this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: WebhookDeliveryStatus.DELIVERED,
              statusCode,
              response: responseText,
              attempts: delivery.attempts + 1,
            },
          }),
          this.prisma.webhook.update({
            where: { id: webhook.id },
            data: { lastTriggeredAt: new Date() },
          }),
        ])
        return
      }

      const attempts = delivery.attempts + 1
      if (attempts >= MAX_ATTEMPTS) {
        await this.prisma.$transaction([
          this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: WebhookDeliveryStatus.FAILED,
              statusCode: statusCode || null,
              response: responseText,
              attempts,
            },
          }),
          this.prisma.webhook.update({
            where: { id: webhook.id },
            data: { isActive: false, failureCount: { increment: 1 } },
          }),
        ])
      } else {
        const backoffSecs = Math.pow(2, attempts)
        await this.prisma.$transaction([
          this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: WebhookDeliveryStatus.RETRYING,
              statusCode: statusCode || null,
              response: responseText,
              attempts,
              nextRetryAt: new Date(Date.now() + backoffSecs * 1000),
            },
          }),
          this.prisma.webhook.update({
            where: { id: webhook.id },
            data: { failureCount: { increment: 1 } },
          }),
        ])
      }
    } catch (err) {
      this.logger.warn(
        `Delivery ${deliveryId} failed unexpectedly: ${String(err)}`,
      )
    }
  }

  async testWebhook(id: string, orgId: string): Promise<{ success: true }> {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!webhook) throw new NotFoundException('Webhook not found')

    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhook: { connect: { id: webhook.id } },
        event: 'ping',
        payload: { message: 'This is a test event from LearnHub', test: true },
        status: WebhookDeliveryStatus.PENDING,
      },
    })
    await this.deliverWebhook(delivery.id)
    return { success: true }
  }

  async getDeliveries(webhookId: string, orgId: string, query: DeliveryQuery) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, organizationId: orgId },
    })
    if (!webhook) throw new NotFoundException('Webhook not found')

    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 20, 100)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.webhookDelivery.count({ where: { webhookId } }),
    ])
    return { items, total, page, limit }
  }
}
