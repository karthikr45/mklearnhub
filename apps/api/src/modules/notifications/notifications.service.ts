import { Injectable } from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { PushService } from '../push/push.service'
import { NotificationsGateway } from './notifications.gateway'

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly push: PushService,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string,
    body?: string,
    data?: Prisma.InputJsonValue,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        ...(body ? { body } : {}),
        ...(data !== undefined ? { data } : {}),
      },
    })
    // Push in real time if the user has an active socket.
    this.gateway.emitToUser(userId, 'notification', notification)
    // And to the browser via Web Push when they're offline (best-effort, and a
    // no-op unless VAPID keys are configured).
    const url =
      data && typeof data === 'object' && 'url' in data
        ? String((data as Record<string, unknown>).url)
        : undefined
    void this.push
      .sendToUser(userId, {
        title,
        ...(body ? { body } : {}),
        ...(url ? { url } : {}),
        tag: type,
      })
      .catch(() => undefined)
    return notification
  }

  async markAsRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    })
    return { success: true }
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    return { success: true }
  }

  async getUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    })
  }
}
