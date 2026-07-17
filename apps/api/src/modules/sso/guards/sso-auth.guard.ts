import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../../../prisma/prisma.service'

interface SsoRequest {
  params?: { orgSlug?: string }
  ssoConfig?: unknown
}

/**
 * Loads the org's SSO configuration from the `orgSlug` route param and attaches
 * it to the request. For local/dev it simply allows the request through once a
 * config is found.
 *
 * Production wires the SAML strategy here: build a per-request
 * `@node-saml/node-saml` SAML instance from the loaded config and verify the
 * signed assertion before allowing the request.
 */
@Injectable()
export class SsoAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SsoRequest>()
    const orgSlug = request.params?.orgSlug
    if (!orgSlug) throw new NotFoundException('Missing organization slug')

    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })
    if (!org) throw new NotFoundException('Organization not found')

    const config = await this.prisma.ssoConfiguration.findUnique({
      where: { organizationId: org.id },
    })
    if (!config || !config.isActive) {
      throw new NotFoundException('SSO is not active for this organization')
    }

    request.ssoConfig = config
    return true
  }
}
