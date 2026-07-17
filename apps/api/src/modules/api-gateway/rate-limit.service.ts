import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import type { Redis } from 'ioredis'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger('RateLimit')
  private client: Redis | null = null

  /**
   * Lazily construct the ioredis client. Only called when REDIS_URL is set,
   * and never from the constructor so the API can boot without Redis.
   */
  private async getClient(): Promise<Redis | null> {
    const url = process.env.REDIS_URL
    if (!url) return null
    if (this.client) return this.client
    const { default: Redis } = await import('ioredis')
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })
    // Prevent unhandled error events from crashing the process.
    this.client.on('error', (err: Error) => {
      this.logger.warn(`Redis error: ${err.message}`)
    })
    return this.client
  }

  async checkRateLimit(
    key: string,
    limit: number,
    windowSecs: number,
  ): Promise<RateLimitResult> {
    // No Redis configured → degrade to allow-all so the API works with
    // PostgreSQL only.
    if (!process.env.REDIS_URL) {
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now() + windowSecs * 1000),
      }
    }

    try {
      const client = await this.getClient()
      if (!client) {
        return {
          allowed: true,
          remaining: limit,
          resetAt: new Date(Date.now() + windowSecs * 1000),
        }
      }

      const windowStart = Math.floor(Date.now() / 1000 / windowSecs)
      const redisKey = `ratelimit:${key}:${windowStart}`
      const count = await client.incr(redisKey)
      if (count === 1) {
        await client.expire(redisKey, windowSecs)
      }

      const resetAt = new Date((windowStart + 1) * windowSecs * 1000)
      const remaining = Math.max(0, limit - count)
      return { allowed: count <= limit, remaining, resetAt }
    } catch (err) {
      // Fail open — availability over strict enforcement.
      this.logger.warn(`Rate limit check failed, allowing: ${String(err)}`)
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now() + windowSecs * 1000),
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
      } catch {
        this.client.disconnect()
      }
      this.client = null
    }
  }
}
