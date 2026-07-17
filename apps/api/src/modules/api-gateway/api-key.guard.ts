import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Organization } from '@learnhub/db'

import { ApiKeyService, ApiKeyWithOrg } from './api-key.service'
import { RateLimitService } from './rate-limit.service'

interface GuardedRequest {
  headers: Record<string, string | string[] | undefined>
  ip?: string
  organization?: Organization
  apiKey?: ApiKeyWithOrg
}

interface GuardedReply {
  header(name: string, value: string | number): unknown
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ApiKeyService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp()
    const req = http.getRequest<GuardedRequest>()
    const reply = http.getResponse<GuardedReply>()

    const rawKey = this.extractKey(req)
    if (!rawKey) throw new UnauthorizedException('Missing API key')

    const apiKey = await this.apiKeys.validateApiKey(rawKey)
    if (!apiKey) throw new UnauthorizedException('Invalid API key')

    // IP allowlist enforcement.
    if (apiKey.allowedIps.length > 0) {
      const ip = req.ip ?? ''
      if (!apiKey.allowedIps.includes(ip)) {
        throw new ForbiddenException('IP address not allowed')
      }
    }

    // Rate limit — fails open when Redis is absent.
    const result = await this.rateLimit.checkRateLimit(
      apiKey.id,
      apiKey.rateLimit,
      3600,
    )
    if (!result.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
      )
      reply.header('Retry-After', retryAfter)
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    req.organization = apiKey.organization
    req.apiKey = apiKey

    // Keep the guard lean: record last-used only. Full per-request usage
    // logging is handled inline by the public-api layer.
    this.apiKeys.trackUsage(apiKey.id, 'guard', 'AUTH', 200, 0)

    return true
  }

  private extractKey(req: GuardedRequest): string | null {
    const auth = req.headers['authorization']
    const authHeader = Array.isArray(auth) ? auth[0] : auth
    if (authHeader && authHeader.startsWith('Bearer lh_')) {
      return authHeader.slice('Bearer '.length)
    }
    const apiKeyHeader = req.headers['x-api-key']
    const value = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader
    return value ?? null
  }
}
