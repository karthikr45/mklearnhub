import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    const [
      totalOrganizations,
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeOrganizations,
    ] = await this.prisma.$transaction([
      this.prisma.organization.count(),
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.enrollment.count(),
      this.prisma.organization.count({ where: { isActive: true } }),
    ])

    const byPlanRaw = await this.prisma.organization.groupBy({
      by: ['plan'],
      _count: true,
      orderBy: { plan: 'asc' },
    })
    const byPlan = byPlanRaw.map((row) => ({
      plan: row.plan,
      count: typeof row._count === 'number' ? row._count : 0,
    }))

    return {
      totalOrganizations,
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeOrganizations,
      byPlan,
    }
  }

  async listOrganizations(page = 1, pageSize = 20, q?: string) {
    const where: Prisma.OrganizationWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, courses: true } } },
      }),
      this.prisma.organization.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async getOrganization(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, courses: true, spaces: true } },
        users: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })
    if (!org) throw new NotFoundException('Organization not found')
    return org
  }

  async listUsers(page = 1, pageSize = 20, q?: string) {
    const where: Prisma.UserWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          organization: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ])
    return { items, total, page, pageSize }
  }
}
