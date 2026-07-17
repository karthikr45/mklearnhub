import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { JwtPayload } from '@learnhub/types'
import { catchError, Observable, tap, throwError } from 'rxjs'

import { AUDIT_KEY, AuditMeta } from './audit.decorator'
import { AuditService } from './audit.service'

interface AuditableRequest {
  method: string
  url: string
  user?: JwtPayload
  ip?: string
  headers: Record<string, string | string[] | undefined>
  params?: Record<string, string>
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly audit: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuditableRequest>()
    const meta = this.reflector.get<AuditMeta | undefined>(
      AUDIT_KEY,
      context.getHandler(),
    )

    // Only audit mutations or explicitly-decorated handlers, to avoid
    // flooding the log with every read.
    if (!meta && !MUTATING.has(req.method)) {
      return next.handle()
    }

    const start = Date.now()
    const path = (req.url ?? '').split('?')[0] ?? ''
    const resource = meta?.resource ?? inferResource(path)
    const action = meta?.action ?? `${resource}.${req.method.toLowerCase()}`
    const user = req.user
    const userAgent = req.headers['user-agent']

    const write = (status: 'success' | 'failure', errorMessage?: string) => {
      void this.audit.log({
        action,
        resource,
        organizationId: user?.orgId ?? null,
        userId: user?.sub ?? null,
        sessionId: user?.sessionId ?? null,
        resourceId: req.params?.id ?? null,
        ipAddress: req.ip ?? null,
        userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent ?? null,
        status,
        duration: Date.now() - start,
        ...(errorMessage ? { errorMessage } : {}),
      })
    }

    return next.handle().pipe(
      tap(() => write('success')),
      catchError((err: Error) => {
        write('failure', err.message)
        return throwError(() => err)
      }),
    )
  }
}

function inferResource(path: string): string {
  // /api/v1/courses/:id → "courses"
  const parts = path.split('/').filter(Boolean)
  const idx = parts.findIndex((p) => p === 'v1')
  const seg = idx >= 0 ? parts[idx + 1] : parts[0]
  return seg ?? 'unknown'
}
