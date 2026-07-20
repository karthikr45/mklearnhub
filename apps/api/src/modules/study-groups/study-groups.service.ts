import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { JwtPayload } from '@learnhub/types'

import { PrismaService } from '../../prisma/prisma.service'
import {
  AddResourceDto,
  CreateStudyGroupDto,
  PostMessageDto,
} from './dto/study-group.dto'
import { ModerationService } from './moderation.service'

const STAFF_ROLES = ['ORG_ADMIN', 'INSTRUCTOR', 'SUPER_ADMIN']

interface StudentContext {
  organizationId: string
  academicYearId: string
  gradeLabel: string | null
}

@Injectable()
export class StudyGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
  ) {}

  /**
   * Resolve a student's school + academic year from their batch membership.
   * This is what scopes every group to verified same-school, same-year peers.
   */
  private async studentContext(userId: string): Promise<StudentContext> {
    const membership = await this.prisma.batchStudent.findFirst({
      where: { userId, batch: { academicYearId: { not: null } } },
      orderBy: { joinedAt: 'desc' },
      select: {
        batch: {
          select: {
            organizationId: true,
            academicYearId: true,
            grade: true,
            academicYear: { select: { isCurrent: true } },
          },
        },
      },
    })
    if (!membership?.batch.academicYearId) {
      throw new BadRequestException(
        'You must be enrolled in a class before using study groups',
      )
    }
    return {
      organizationId: membership.batch.organizationId,
      academicYearId: membership.batch.academicYearId,
      gradeLabel: membership.batch.grade,
    }
  }

  private async assertMember(groupId: string, userId: string) {
    const member = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })
    if (!member) throw new ForbiddenException('You are not a member of this group')
    return member
  }

  /** Staff of the group's own school may supervise (read-only). */
  private async assertMemberOrStaff(groupId: string, user: JwtPayload) {
    if (STAFF_ROLES.includes(user.role)) {
      const group = await this.prisma.studyGroup.findUnique({
        where: { id: groupId },
        select: { organizationId: true },
      })
      if (!group) throw new NotFoundException('Group not found')
      if (group.organizationId === user.orgId) return { staff: true as const }
    }
    await this.assertMember(groupId, user.sub)
    return { staff: false as const }
  }

  async create(user: JwtPayload, dto: CreateStudyGroupDto) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can create study groups')
    }
    const ctx = await this.studentContext(user.sub)
    const group = await this.prisma.studyGroup.create({
      data: {
        name: dto.name,
        ...(dto.description ? { description: dto.description } : {}),
        organizationId: ctx.organizationId,
        academicYearId: ctx.academicYearId,
        gradeLabel: ctx.gradeLabel,
        createdById: user.sub,
        members: { create: { userId: user.sub, role: 'OWNER' } },
      },
    })
    return group
  }

  /** Groups the student can see: those in their school + academic year. */
  async list(user: JwtPayload) {
    const ctx = await this.studentContext(user.sub)
    const groups = await this.prisma.studyGroup.findMany({
      where: {
        organizationId: ctx.organizationId,
        academicYearId: ctx.academicYearId,
        isArchived: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true } },
        members: { where: { userId: user.sub }, select: { id: true } },
      },
    })
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      gradeLabel: g.gradeLabel,
      memberCount: g._count.members,
      isMember: g.members.length > 0,
      createdAt: g.createdAt,
    }))
  }

  async join(user: JwtPayload, groupId: string) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can join study groups')
    }
    const ctx = await this.studentContext(user.sub)
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { organizationId: true, academicYearId: true, isArchived: true },
    })
    if (!group || group.isArchived) throw new NotFoundException('Group not found')
    // The core child-safety invariant: same school AND same academic year.
    if (
      group.organizationId !== ctx.organizationId ||
      group.academicYearId !== ctx.academicYearId
    ) {
      throw new ForbiddenException(
        'You can only join study groups in your own school and year',
      )
    }
    await this.prisma.studyGroupMember.upsert({
      where: { groupId_userId: { groupId, userId: user.sub } },
      create: { groupId, userId: user.sub },
      update: {},
    })
    return { success: true }
  }

  async leave(user: JwtPayload, groupId: string) {
    await this.prisma.studyGroupMember.deleteMany({
      where: { groupId, userId: user.sub },
    })
    return { success: true }
  }

  async detail(user: JwtPayload, groupId: string) {
    await this.assertMemberOrStaff(groupId, user)
    const group = await this.prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            role: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    })
    if (!group) throw new NotFoundException('Group not found')
    return group
  }

  async messages(user: JwtPayload, groupId: string) {
    await this.assertMemberOrStaff(groupId, user)
    const rows = await this.prisma.studyGroupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    })
    return rows
  }

  async postMessage(user: JwtPayload, groupId: string, dto: PostMessageDto) {
    await this.assertMember(groupId, user.sub)
    const screen = await this.moderation.screenMessage({
      userId: user.sub,
      organizationId: user.orgId,
      body: dto.body,
    })
    if (screen.status === 'BLOCKED') {
      throw new BadRequestException({
        message:
          'Your message was blocked because it may not be appropriate for a school group.',
        reasons: screen.reasons,
        code: 'CONTENT_BLOCKED',
      })
    }
    return this.prisma.studyGroupMessage.create({
      data: {
        groupId,
        userId: user.sub,
        body: dto.body,
        moderationStatus: screen.status,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    })
  }

  async resources(user: JwtPayload, groupId: string) {
    await this.assertMemberOrStaff(groupId, user)
    return this.prisma.studyGroupResource.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    })
  }

  async addResource(user: JwtPayload, groupId: string, dto: AddResourceDto) {
    await this.assertMember(groupId, user.sub)
    const screen = await this.moderation.screenResource({
      userId: user.sub,
      organizationId: user.orgId,
      resource: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        url: dto.url,
        fileName: dto.fileName,
      },
    })
    if (screen.status === 'BLOCKED') {
      const fileReason = screen.reasons.includes('disallowed-file-type')
      throw new BadRequestException({
        message: fileReason
          ? 'Only study documents (PDF, Word, PowerPoint, Excel, text) can be shared. Images and video are not allowed in school groups.'
          : 'This resource was blocked because it may not be appropriate for a school group.',
        reasons: screen.reasons,
        code: 'CONTENT_BLOCKED',
      })
    }
    return this.prisma.studyGroupResource.create({
      data: {
        groupId,
        userId: user.sub,
        type: dto.type,
        title: dto.title,
        ...(dto.body ? { body: dto.body } : {}),
        ...(dto.url ? { url: dto.url } : {}),
        ...(dto.fileName ? { fileKey: dto.fileName } : {}),
        moderationStatus: screen.status,
      },
    })
  }

  /** School staff: recent moderation events for their organization. */
  async moderationLog(user: JwtPayload) {
    if (!STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException('Staff only')
    }
    return this.prisma.moderationEvent.findMany({
      where: { organizationId: user.orgId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  }
}
