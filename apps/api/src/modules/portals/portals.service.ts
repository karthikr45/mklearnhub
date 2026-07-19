import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@learnhub/db'
import { slugify } from '@learnhub/utils'
import { nanoid } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { CreatePortalDto } from './dto/create-portal.dto'
import { UpdatePortalDto } from './dto/update-portal.dto'

@Injectable()
export class PortalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, dto: CreatePortalDto) {
    return this.prisma.portal.create({
      data: {
        name: dto.name,
        slug: `${slugify(dto.name)}-${nanoid(6)}`,
        organizationId: orgId,
        ...(dto.type ? { type: dto.type } : {}),
      },
    })
  }

  list(orgId: string) {
    return this.prisma.portal.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getOne(id: string, orgId: string) {
    const portal = await this.prisma.portal.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!portal) throw new NotFoundException('Portal not found')
    return portal
  }

  async update(id: string, orgId: string, dto: UpdatePortalDto) {
    await this.getOne(id, orgId)
    return this.prisma.portal.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
        ...(dto.primaryColor !== undefined
          ? { primaryColor: dto.primaryColor }
          : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      },
    })
  }

  async savePage(id: string, orgId: string, pageJson: Record<string, unknown>) {
    await this.getOne(id, orgId)
    return this.prisma.portal.update({
      where: { id },
      data: { pageJson: pageJson as Prisma.InputJsonValue },
    })
  }

  async remove(id: string, orgId: string) {
    await this.getOne(id, orgId)
    await this.prisma.portal.delete({ where: { id } })
    return { success: true }
  }

  /** Published courses + articles for an org — feeds the data-aware blocks. */
  private async orgContent(orgId: string) {
    const [courses, articles] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where: { organizationId: orgId, status: 'PUBLISHED' },
        orderBy: { enrollmentCount: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnailUrl: true,
          level: true,
          enrollmentCount: true,
        },
      }),
      this.prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          manual: { space: { organizationId: orgId } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          updatedAt: true,
        },
      }),
    ])
    return { courses, articles }
  }

  /** Authenticated preview data for the builder. */
  async getBuilderData(id: string, orgId: string) {
    await this.getOne(id, orgId)
    return this.orgContent(orgId)
  }

  /** Public payload for rendering a portal — only if it is published. */
  async getPublic(id: string) {
    const portal = await this.prisma.portal.findUnique({ where: { id } })
    if (!portal || !portal.isPublic || !portal.isActive) {
      throw new NotFoundException('Portal not found')
    }
    const branding = await this.prisma.brandingConfig.findUnique({
      where: { organizationId: portal.organizationId },
    })
    const { courses, articles } = await this.orgContent(portal.organizationId)
    if (!portal.isPublic) throw new ForbiddenException()
    return {
      portal: {
        id: portal.id,
        name: portal.name,
        slug: portal.slug,
        primaryColor: portal.primaryColor,
        logoUrl: portal.logoUrl,
      },
      pageJson: portal.pageJson,
      branding: branding
        ? {
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            accentColor: branding.accentColor,
            fontFamily: branding.fontFamily,
            appName: branding.appName,
            logoUrl: branding.logoUrl,
          }
        : null,
      courses,
      articles,
    }
  }
}
