import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiSecurity, ApiTags } from '@nestjs/swagger'
import { randomUUID } from 'node:crypto'
import type { Prisma, UserRole } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { ApiKeyGuard } from '../api-gateway/api-key.guard'

interface PublicRequest {
  organization?: { id: string }
}

interface Envelope<T> {
  data: T
  meta?: { page: number; limit: number; total: number }
  requestId: string
}

interface CreateUserBody {
  email: string
  name: string
  role?: UserRole
}

interface UpdateUserBody {
  name?: string
  role?: UserRole
  isActive?: boolean
}

interface EnrollBody {
  userId: string
  courseId: string
}

interface XapiBody {
  statementId?: string
  actorEmail: string
  verb: string
  objectId: string
  objectType?: string
  result?: Prisma.InputJsonValue
  context?: Prisma.InputJsonValue
  timestamp?: string
}

/** Read the guard-attached organization id or reject. */
function requireOrg(req: PublicRequest): string {
  if (!req.organization?.id) {
    throw new ForbiddenException('No organization context')
  }
  return req.organization.id
}

function envelope<T>(
  data: T,
  meta?: { page: number; limit: number; total: number },
): Envelope<T> {
  return {
    data,
    ...(meta ? { meta } : {}),
    requestId: randomUUID(),
  }
}

@ApiTags('public-api')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1')
export class PublicApiController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Users ──────────────────────────────────────────────

  @Get('users')
  async listUsers(
    @Req() req: PublicRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = requireOrg(req)
    const p = Number(page) || 1
    const l = Math.min(Number(limit) || 20, 100)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where: { organizationId: orgId } }),
    ])
    return envelope(items, { page: p, limit: l, total })
  }

  @Post('users')
  async createUser(@Req() req: PublicRequest, @Body() body: CreateUserBody) {
    const orgId = requireOrg(req)
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        organizationId: orgId,
        ...(body.role ? { role: body.role } : {}),
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    return envelope(user)
  }

  @Get('users/:id')
  async getUser(@Req() req: PublicRequest, @Param('id') id: string) {
    const orgId = requireOrg(req)
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId: orgId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
    if (!user) throw new ForbiddenException('User not found')
    return envelope(user)
  }

  @Put('users/:id')
  async updateUser(
    @Req() req: PublicRequest,
    @Param('id') id: string,
    @Body() body: UpdateUserBody,
  ) {
    const orgId = requireOrg(req)
    const data: Prisma.UserUpdateManyMutationInput = {
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.role != null ? { role: body.role } : {}),
      ...(body.isActive != null ? { isActive: body.isActive } : {}),
    }
    await this.prisma.user.updateMany({
      where: { id, organizationId: orgId },
      data,
    })
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })
    if (!user) throw new ForbiddenException('User not found')
    return envelope(user)
  }

  @Post('users/bulk')
  async bulkUsers(
    @Req() req: PublicRequest,
    @Body() body: CreateUserBody[],
  ) {
    const orgId = requireOrg(req)
    const rows = Array.isArray(body) ? body : []
    const results = await Promise.all(
      rows.map((row) =>
        this.prisma.user.upsert({
          where: { email: row.email },
          create: {
            email: row.email,
            name: row.name,
            organizationId: orgId,
            ...(row.role ? { role: row.role } : {}),
          },
          update: {
            name: row.name,
            organizationId: orgId,
            ...(row.role ? { role: row.role } : {}),
          },
          select: { id: true, email: true, name: true, role: true },
        }),
      ),
    )
    return envelope(results)
  }

  // ─── Courses ────────────────────────────────────────────

  @Get('courses')
  async listCourses(@Req() req: PublicRequest) {
    const orgId = requireOrg(req)
    const courses = await this.prisma.course.findMany({
      where: { organizationId: orgId, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        level: true,
        durationMins: true,
        totalLessons: true,
        enrollmentCount: true,
        publishedAt: true,
      },
    })
    return envelope(courses)
  }

  // ─── Enrollments ────────────────────────────────────────

  @Post('enrollments')
  async enroll(@Req() req: PublicRequest, @Body() body: EnrollBody) {
    const orgId = requireOrg(req)
    // Ensure both the user and course belong to the caller's organization.
    const course = await this.prisma.course.findFirst({
      where: { id: body.courseId, organizationId: orgId },
      select: { id: true },
    })
    const user = await this.prisma.user.findFirst({
      where: { id: body.userId, organizationId: orgId },
      select: { id: true },
    })
    if (!course || !user) {
      throw new ForbiddenException('User or course not found in organization')
    }
    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: body.userId, courseId: body.courseId } },
      create: { userId: body.userId, courseId: body.courseId },
      update: {},
    })
    return envelope(enrollment)
  }

  @Get('enrollments/:userId')
  async getEnrollments(
    @Req() req: PublicRequest,
    @Param('userId') userId: string,
  ) {
    const orgId = requireOrg(req)
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, course: { organizationId: orgId } },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        progress: {
          select: { lessonId: true, isCompleted: true, watchedSecs: true },
        },
      },
    })
    return envelope(enrollments)
  }

  // ─── Analytics ──────────────────────────────────────────

  @Get('analytics/summary')
  async analyticsSummary(@Req() req: PublicRequest) {
    const orgId = requireOrg(req)
    const [users, courses, enrollments, completions] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { organizationId: orgId } }),
        this.prisma.course.count({ where: { organizationId: orgId } }),
        this.prisma.enrollment.count({
          where: { course: { organizationId: orgId } },
        }),
        this.prisma.enrollment.count({
          where: { course: { organizationId: orgId }, status: 'COMPLETED' },
        }),
      ])
    return envelope({ users, courses, enrollments, completions })
  }

  // ─── SCORM / xAPI ───────────────────────────────────────

  @Post('scorm/statements')
  async scormStatement(@Req() req: PublicRequest, @Body() body: XapiBody) {
    const orgId = requireOrg(req)
    // Inline to avoid coupling to the SCORM module.
    const statement = await this.prisma.xapiStatement.create({
      data: {
        statementId: body.statementId ?? randomUUID(),
        organizationId: orgId,
        actorEmail: body.actorEmail,
        verb: body.verb,
        objectId: body.objectId,
        objectType: body.objectType ?? 'Activity',
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        rawStatement: (body as unknown) as Prisma.InputJsonValue,
        ...(body.result ? { result: body.result } : {}),
        ...(body.context ? { context: body.context } : {}),
      },
    })
    return envelope(statement)
  }

  // ─── Certificates ───────────────────────────────────────

  @Get('certificates/:userId')
  async getCertificates(
    @Req() req: PublicRequest,
    @Param('userId') userId: string,
  ) {
    const orgId = requireOrg(req)
    const certificates = await this.prisma.certificate.findMany({
      where: { userId, course: { organizationId: orgId } },
      orderBy: { issuedAt: 'desc' },
      include: { course: { select: { id: true, title: true } } },
    })
    return envelope(certificates)
  }
}
