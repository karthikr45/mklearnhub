import { BadRequestException, Injectable } from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { BrandingAssetDto, SaveBrandingDto } from './dto/save-branding.dto'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

const ASSET_FIELD: Record<BrandingAssetDto['type'], string> = {
  logo: 'logoUrl',
  logoDark: 'logoDarkUrl',
  favicon: 'faviconUrl',
  loginBg: 'loginBgUrl',
}

@Injectable()
export class BrandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Neutral defaults returned when an org has no BrandingConfig yet. */
  private defaultBranding(organizationId: string | null) {
    return {
      organizationId,
      appName: 'LearnHub',
      primaryColor: '#6366F1',
      secondaryColor: '#0EA5E9',
      accentColor: '#F59E0B',
      fontFamily: 'Inter',
      hideLearnhubBranding: false,
    }
  }

  async saveBrandingConfig(orgId: string, dto: SaveBrandingDto) {
    for (const color of [
      dto.primaryColor,
      dto.secondaryColor,
      dto.accentColor,
    ]) {
      if (color && !HEX_COLOR.test(color)) {
        throw new BadRequestException(`Invalid hex colour: ${color}`)
      }
    }

    const data: Prisma.BrandingConfigUncheckedCreateInput = {
      organizationId: orgId,
      ...(dto.appName !== undefined ? { appName: dto.appName } : {}),
      ...(dto.primaryColor ? { primaryColor: dto.primaryColor } : {}),
      ...(dto.secondaryColor ? { secondaryColor: dto.secondaryColor } : {}),
      ...(dto.accentColor ? { accentColor: dto.accentColor } : {}),
      ...(dto.fontFamily ? { fontFamily: dto.fontFamily } : {}),
      ...(dto.customCss !== undefined ? { customCss: dto.customCss } : {}),
      ...(dto.footerText !== undefined ? { footerText: dto.footerText } : {}),
      ...(dto.supportEmail !== undefined
        ? { supportEmail: dto.supportEmail }
        : {}),
      ...(dto.hideLearnhubBranding !== undefined
        ? { hideLearnhubBranding: dto.hideLearnhubBranding }
        : {}),
      // A new custom domain starts unverified; a DNS-verification job would
      // move sslCertStatus from 'pending' -> 'active' (see verifyCustomDomain).
      ...(dto.customDomain !== undefined
        ? { customDomain: dto.customDomain, sslCertStatus: 'pending' }
        : {}),
    }

    const { organizationId: _omit, ...update } = data
    void _omit

    const config = await this.prisma.brandingConfig.upsert({
      where: { organizationId: orgId },
      create: data,
      update,
    })

    await this.audit.log({
      action: 'branding.updated',
      resource: 'BrandingConfig',
      organizationId: orgId,
      resourceId: config.id,
      newValues: { ...dto },
    })
    return config
  }

  async getBranding(orgId: string) {
    const config = await this.prisma.brandingConfig.findUnique({
      where: { organizationId: orgId },
    })
    return config ?? this.defaultBranding(orgId)
  }

  /** Public: resolves branding for a request's host (custom domain or subdomain). */
  async getBrandingForDomain(domain: string) {
    const byDomain = await this.prisma.brandingConfig.findFirst({
      where: { customDomain: domain },
    })
    if (byDomain) return byDomain

    // Fall back to treating the label as an org slug (e.g. acme.learnhub.app).
    const org = await this.prisma.organization.findFirst({
      where: { slug: domain },
    })
    if (org) {
      const branding = await this.prisma.brandingConfig.findUnique({
        where: { organizationId: org.id },
      })
      return branding ?? this.defaultBranding(org.id)
    }
    return this.defaultBranding(null)
  }

  async verifyCustomDomain(orgId: string) {
    // Production: look up the BrandingConfig.customDomain, confirm the DNS CNAME
    // points at our ingress, then register a Cloudflare custom hostname and poll
    // its SSL status. Locally we short-circuit to 'active'.
    await this.prisma.brandingConfig.updateMany({
      where: { organizationId: orgId },
      data: { sslCertStatus: 'active' },
    })
    await this.audit.log({
      action: 'branding.domain_verified',
      resource: 'BrandingConfig',
      organizationId: orgId,
    })
    return { verified: true }
  }

  async uploadBrandingAsset(orgId: string, dto: BrandingAssetDto) {
    const field = ASSET_FIELD[dto.type]
    if (!field) throw new BadRequestException(`Unknown asset type: ${dto.type}`)

    // Production: resize/optimise the upload with sharp and push it to S3,
    // storing the resulting CDN URL. Locally we persist the provided URL as-is.
    const patch: Record<string, string> = { [field]: dto.url }
    await this.prisma.brandingConfig.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        ...patch,
      } as Prisma.BrandingConfigUncheckedCreateInput,
      update: patch as Prisma.BrandingConfigUncheckedUpdateInput,
    })
    return { url: dto.url }
  }
}
