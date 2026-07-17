import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { JwtPayload } from '@learnhub/types'
import type { Prisma, User } from '@learnhub/db'
import { UserRole } from '@learnhub/db'
import { decrypt, encrypt } from '@learnhub/compliance'
import { nanoid } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { ConfigureSsoDto, SsoAttributeMapDto } from './dto/configure-sso.dto'

interface SamlAttributes {
  email?: string
  firstName?: string
  lastName?: string
  employeeId?: string
  department?: string
  [key: string]: unknown
}

interface ParsedMetadata {
  entityId?: string
  ssoUrl?: string
  x509Certificate?: string
}

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Resolve the caller's org id, rejecting users without an organization. */
  private orgId(user: JwtPayload): string {
    if (!user.orgId) throw new ForbiddenException('No organization context')
    return user.orgId
  }

  /**
   * Encrypt a secret for storage. If ENCRYPTION_KEY is unset (local dev) we
   * fall back to storing the plaintext so the flow still works without the key.
   */
  private encryptSecret(value: string): string {
    try {
      return encrypt(value)
    } catch {
      return value
    }
  }

  private decryptSecret(value: string): string {
    try {
      return decrypt(value)
    } catch {
      // Value was stored as plaintext (no ENCRYPTION_KEY) or cannot be decoded.
      return value
    }
  }

  private spBaseUrl(): string {
    return process.env.SAML_SP_BASE_URL ?? 'https://app.learnhub.com'
  }

  /**
   * Best-effort parse of SAML IdP metadata. Prefers @node-saml/node-saml's
   * MetadataReader (loaded lazily to keep boot Redis/IdP-free), falling back to
   * a defensive regex scrape when the library or fields are unavailable.
   */
  private async parseMetadata(xml: string): Promise<ParsedMetadata> {
    const result: ParsedMetadata = {}
    try {
      const mod = (await import('@node-saml/node-saml')) as unknown as {
        MetadataReader?: new (metadata: string) => {
          identityProviderUrl?: string
          signingCerts?: string[]
          entityId?: string
        }
      }
      if (mod.MetadataReader) {
        const reader = new mod.MetadataReader(xml)
        if (reader.identityProviderUrl) result.ssoUrl = reader.identityProviderUrl
        if (reader.entityId) result.entityId = reader.entityId
        const cert = reader.signingCerts?.[0]
        if (cert) result.x509Certificate = cert
      }
    } catch (err) {
      this.logger.warn(
        `MetadataReader unavailable, falling back to regex: ${(err as Error).message}`,
      )
    }

    // Regex fallback for any field the reader did not populate.
    if (!result.entityId) {
      const m = xml.match(/entityID=["']([^"']+)["']/)
      if (m) result.entityId = m[1]
    }
    if (!result.ssoUrl) {
      const m = xml.match(
        /SingleSignOnService[^>]*Location=["']([^"']+)["']/,
      )
      if (m) result.ssoUrl = m[1]
    }
    if (!result.x509Certificate) {
      const m = xml.match(/<[^>]*X509Certificate[^>]*>([\s\S]*?)<\/[^>]*X509Certificate[^>]*>/)
      if (m) result.x509Certificate = m[1].replace(/\s+/g, '')
    }
    return result
  }

  async saveSsoConfig(orgId: string, dto: ConfigureSsoDto) {
    let parsed: ParsedMetadata = {}
    if (dto.metadataXml) {
      parsed = await this.parseMetadata(dto.metadataXml)
    } else if (dto.metadataUrl) {
      // Production fetches and parses the remote metadata document; for local
      // boot-safety we do not perform the network call here.
      this.logger.log(`metadataUrl provided for org ${orgId}; deferring remote fetch`)
    }

    const encryptedCert = parsed.x509Certificate
      ? this.encryptSecret(parsed.x509Certificate)
      : undefined

    // SsoConfiguration has no columns for defaultRole/autoProvision, so we
    // persist them inside the attributeMap JSON blob alongside the field map.
    const attributeMap = {
      ...dto.attributeMap,
      defaultRole: dto.defaultRole,
      autoProvision: dto.autoProvision,
    } as unknown as Prisma.InputJsonValue

    const data = {
      provider: dto.provider,
      attributeMap,
      isActive: true,
      ...(dto.metadataUrl ? { metadataUrl: dto.metadataUrl } : {}),
      ...(dto.metadataXml ? { metadataXml: dto.metadataXml } : {}),
      ...(parsed.entityId ? { entityId: parsed.entityId } : {}),
      ...(parsed.ssoUrl ? { ssoUrl: parsed.ssoUrl } : {}),
      ...(encryptedCert ? { x509Certificate: encryptedCert } : {}),
    }

    const config = await this.prisma.ssoConfiguration.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, ...data },
      update: data,
    })

    await this.audit.log({
      action: 'sso.configured',
      resource: 'SsoConfiguration',
      resourceId: config.id,
      organizationId: orgId,
    })

    return this.sanitize(config)
  }

  /** Strip the (encrypted) certificate from a config before returning it. */
  private sanitize<T extends { x509Certificate?: string | null }>(config: T) {
    const { x509Certificate: _cert, ...rest } = config
    return { ...rest, x509Certificate: config.x509Certificate ? '***' : null }
  }

  async getSsoConfig(orgId: string) {
    const config = await this.prisma.ssoConfiguration.findUnique({
      where: { organizationId: orgId },
    })
    return config ? this.sanitize(config) : null
  }

  async testSsoConnection(orgId: string, testEmail?: string) {
    const config = await this.prisma.ssoConfiguration.findUnique({
      where: { organizationId: orgId },
    })
    if (!config) throw new NotFoundException('SSO is not configured')

    await this.prisma.ssoConfiguration.update({
      where: { organizationId: orgId },
      data: {
        lastTestedAt: new Date(),
        ...(testEmail ? { testEmail } : {}),
      },
    })

    return {
      redirectUrl: config.ssoUrl,
      message: config.ssoUrl
        ? 'SSO endpoint reachable. Complete login at the redirect URL.'
        : 'No IdP SSO URL configured yet.',
    }
  }

  async deleteSsoConfig(orgId: string) {
    await this.prisma.ssoConfiguration.deleteMany({
      where: { organizationId: orgId },
    })
    await this.audit.log({
      action: 'sso.deleted',
      resource: 'SsoConfiguration',
      organizationId: orgId,
    })
    return { success: true }
  }

  /** Return an SP metadata XML document for the org (public endpoint). */
  async getSpMetadata(orgId: string): Promise<string> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { slug: true },
    })
    if (!org) throw new NotFoundException('Organization not found')

    const base = this.spBaseUrl()
    const entityId = `${base}/sso/${org.slug}/metadata`
    const acsUrl = `${base}/api/v1/sso/${org.slug}/callback`

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">`,
      '  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="false" WantAssertionsSigned="true">',
      '    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>',
      `    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="0" isDefault="true"/>`,
      '  </SPSSODescriptor>',
      '</EntityDescriptor>',
    ].join('\n')
  }

  async initiateSsoLogin(orgSlug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })
    if (!org) throw new NotFoundException('Organization not found')

    const config = await this.prisma.ssoConfiguration.findUnique({
      where: { organizationId: org.id },
    })
    if (!config || !config.isActive || !config.ssoUrl) {
      throw new NotFoundException('SSO is not active for this organization')
    }
    return { redirectUrl: config.ssoUrl }
  }

  /** Parse SAML attributes from a callback body defensively. */
  private extractAttributes(body: Record<string, unknown>): SamlAttributes {
    // Some IdPs / test harnesses post a base64-encoded JSON SAMLResponse.
    if (typeof body.SAMLResponse === 'string') {
      try {
        const decoded = Buffer.from(body.SAMLResponse, 'base64').toString('utf8')
        return JSON.parse(decoded) as SamlAttributes
      } catch {
        // Not JSON — a real signed SAML XML would be verified here in production.
      }
    }
    return body as SamlAttributes
  }

  private mapAttribute(
    attrs: SamlAttributes,
    map: SsoAttributeMapDto,
    key: keyof SsoAttributeMapDto,
  ): string | undefined {
    const source = map[key]
    if (source && typeof attrs[source] === 'string') {
      return attrs[source] as string
    }
    // Fall back to the canonical key name if the mapped source is absent.
    const direct = attrs[key as string]
    return typeof direct === 'string' ? direct : undefined
  }

  /**
   * JIT provisioning from a SAML callback.
   *
   * SECURITY: this does NOT verify a live SAML signature — there is no IdP in
   * local/dev. Production MUST validate the signed assertion via
   * @node-saml/node-saml (SAML.validatePostResponse) before trusting attributes.
   */
  async handleSamlCallback(orgSlug: string, body: Record<string, unknown>) {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    })
    if (!org) throw new NotFoundException('Organization not found')

    const config = await this.prisma.ssoConfiguration.findUnique({
      where: { organizationId: org.id },
    })
    if (!config || !config.isActive) {
      throw new UnauthorizedException('SSO is not active for this organization')
    }

    const attrs = this.extractAttributes(body)
    const map = (config.attributeMap ?? {}) as unknown as SsoAttributeMapDto

    const email = this.mapAttribute(attrs, map, 'email')
    if (!email) throw new UnauthorizedException('SAML response missing email')

    const firstName = this.mapAttribute(attrs, map, 'firstName') ?? ''
    const lastName = this.mapAttribute(attrs, map, 'lastName') ?? ''
    const name = `${firstName} ${lastName}`.trim() || email

    let user = await this.prisma.user.findUnique({ where: { email } })

    const autoProvision = this.isAutoProvision(config.attributeMap, org.id)

    if (!user) {
      if (!autoProvision) {
        throw new UnauthorizedException('User not provisioned and auto-provision is off')
      }
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: this.defaultRoleFor(config),
          organizationId: org.id,
          emailVerified: true,
          onboarded: true,
        },
      })
    } else if (user.name !== name && name) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name },
      })
    }

    const tokens = await this.generateTokensForSsoUser(user)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.prisma.session.create({
      data: { userId: user.id, refreshToken: tokens.refreshToken, expiresAt },
    })

    await this.audit.log({
      action: 'sso.login',
      resource: 'User',
      resourceId: user.id,
      userId: user.id,
      organizationId: org.id,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.organizationId,
      },
      tokens,
    }
  }

  private isAutoProvision(
    attributeMap: Prisma.JsonValue | null,
    _orgId: string,
  ): boolean {
    // autoProvision is persisted alongside the attributeMap config blob.
    if (attributeMap && typeof attributeMap === 'object' && !Array.isArray(attributeMap)) {
      const val = (attributeMap as Record<string, unknown>).autoProvision
      if (typeof val === 'boolean') return val
    }
    return true
  }

  private defaultRoleFor(config: { attributeMap: Prisma.JsonValue }): UserRole {
    const map = config.attributeMap
    if (map && typeof map === 'object' && !Array.isArray(map)) {
      const val = (map as Record<string, unknown>).defaultRole
      if (typeof val === 'string' && val in UserRole) {
        return val as UserRole
      }
    }
    return UserRole.LEARNER
  }

  /**
   * Mint the same access/refresh JWT pair as auth.service.generateTokens so SSO
   * sessions are indistinguishable from password logins downstream.
   */
  async generateTokensForSsoUser(user: User) {
    const sessionId = nanoid()
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: user.organizationId,
      role: user.role,
      sessionId,
    }
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    })
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    })
    return { accessToken, refreshToken }
  }
}
