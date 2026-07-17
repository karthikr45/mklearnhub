import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { PrismaService } from '../prisma/prisma.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
    }
  }

  @Get('db')
  async db() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'ok', db: 'up' }
    } catch {
      return { status: 'error', db: 'down' }
    }
  }

  @Get('redis')
  async redis() {
    const url = process.env.REDIS_URL
    if (!url) return { status: 'skipped', redis: 'not-configured' }
    // Lazy import so ioredis is only loaded when needed.
    const { default: Redis } = await import('ioredis')
    const client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 })
    try {
      await client.connect()
      await client.ping()
      return { status: 'ok', redis: 'up' }
    } catch {
      return { status: 'error', redis: 'down' }
    } finally {
      client.disconnect()
    }
  }
}
