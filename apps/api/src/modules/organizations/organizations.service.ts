import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@learnhub/db'
import { slugify } from '@learnhub/utils'
import { nanoid } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { CreateOrgDto } from './dto/create-org.dto'
import { InviteUserDto } from './dto/invite-user.dto'
import { UpdateOrgDto } from './dto/update-org.dto'

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrgDto, userId: string) {
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: `${slugify(dto.name)}-${nanoid(6)}`,
        ...(dto.type ? { type: dto.type } : {}),
      },
    })
    await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: org.id, role: 'ORG_ADMIN', onboarded: true },
    })
    return org
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { _count: { select: { users: true, courses: true } } },
    })
    if (!org) throw new NotFoundException('Organization not found')
    return org
  }

  async update(id: string, dto: UpdateOrgDto) {
    await this.findById(id)
    const data: Prisma.OrganizationUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
      ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
      ...(dto.board !== undefined ? { board: dto.board as never } : {}),
      ...(dto.state !== undefined ? { state: dto.state as never } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.listedInDirectory !== undefined
        ? { listedInDirectory: dto.listedInDirectory }
        : {}),
    }
    return this.prisma.organization.update({ where: { id }, data })
  }

  async updateSettings(id: string, settings: Prisma.InputJsonValue) {
    await this.findById(id)
    return this.prisma.organization.update({ where: { id }, data: { settings } })
  }

  async inviteUser(orgId: string, dto: InviteUserDto, invitedById: string) {
    const invite = await this.prisma.invite.create({
      data: {
        email: dto.email,
        role: dto.role,
        organizationId: orgId,
        invitedById,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    // Email delivery is handled by the email queue in production.
    return { inviteId: invite.id, token: invite.token }
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { token } })
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new ForbiddenException('Invalid or expired invite')
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { organizationId: invite.organizationId, role: invite.role },
      }),
      this.prisma.invite.update({
        where: { token },
        data: { acceptedAt: new Date() },
      }),
    ])
    return { success: true }
  }

  async getInviteByToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: { organization: { select: { name: true, slug: true } } },
    })
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return { valid: false as const }
    }
    return {
      valid: true as const,
      email: invite.email,
      role: invite.role,
      organizationName: invite.organization.name,
    }
  }

  async getMembers(orgId: string, page = 1, pageSize = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { organizationId: orgId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where: { organizationId: orgId } }),
    ])
    return { items, total, page, pageSize }
  }

  async removeMember(orgId: string, userId: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, organizationId: orgId },
      data: { organizationId: null, isActive: false },
    })
    return { success: true }
  }

  async getStats(orgId: string) {
    const [users, courses, enrollments, completed] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { organizationId: orgId } }),
      this.prisma.course.count({ where: { organizationId: orgId } }),
      this.prisma.enrollment.count({ where: { course: { organizationId: orgId } } }),
      this.prisma.enrollment.count({
        where: { course: { organizationId: orgId }, status: 'COMPLETED' },
      }),
    ])
    return {
      totalUsers: users,
      totalCourses: courses,
      totalEnrollments: enrollments,
      completionRate: enrollments ? Math.round((completed / enrollments) * 100) : 0,
    }
  }
}
