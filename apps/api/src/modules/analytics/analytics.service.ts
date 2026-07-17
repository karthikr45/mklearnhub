import { Injectable, NotFoundException } from '@nestjs/common'
import type { OrgStats } from '@learnhub/types'

import { PrismaService } from '../../prisma/prisma.service'

type ExportFormat = 'csv' | 'json'

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrgDashboard(orgId: string): Promise<OrgStats> {
    const [totalUsers, totalCourses, totalEnrollments, completed, activeLearners] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { organizationId: orgId } }),
        this.prisma.course.count({ where: { organizationId: orgId } }),
        this.prisma.enrollment.count({
          where: { course: { organizationId: orgId } },
        }),
        this.prisma.enrollment.count({
          where: { course: { organizationId: orgId }, status: 'COMPLETED' },
        }),
        this.prisma.user.count({
          where: { organizationId: orgId, enrollments: { some: {} } },
        }),
      ])
    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeLearners,
      completionRate: totalEnrollments
        ? Math.round((completed / totalEnrollments) * 100)
        : 0,
    }
  }

  async getCourseAnalytics(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    })
    if (!course) throw new NotFoundException('Course not found')

    const [enrollmentCount, completionCount, progressAgg, totalLessons] =
      await this.prisma.$transaction([
        this.prisma.enrollment.count({ where: { courseId } }),
        this.prisma.enrollment.count({
          where: { courseId, status: 'COMPLETED' },
        }),
        this.prisma.enrollment.aggregate({
          where: { courseId },
          _avg: { progressPct: true },
        }),
        this.prisma.lesson.count({ where: { chapter: { courseId } } }),
      ])

    return {
      courseId,
      title: course.title,
      enrollmentCount,
      completionCount,
      completionRate: enrollmentCount
        ? Math.round((completionCount / enrollmentCount) * 100)
        : 0,
      avgProgressPct: Math.round(progressAgg._avg.progressPct ?? 0),
      totalLessons,
    }
  }

  async getLearnerReport(userId: string, orgId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    const [enrolledCourses, completedCourses, attempts] =
      await this.prisma.$transaction([
        this.prisma.enrollment.count({
          where: { userId, course: { organizationId: orgId } },
        }),
        this.prisma.enrollment.count({
          where: {
            userId,
            status: 'COMPLETED',
            course: { organizationId: orgId },
          },
        }),
        this.prisma.quizAttempt.findMany({
          where: { userId },
          select: { score: true, maxScore: true },
        }),
      ])

    const avgQuizScore = attempts.length
      ? Math.round(
          (attempts.reduce(
            (sum, a) => sum + (a.maxScore ? a.score / a.maxScore : 0),
            0,
          ) /
            attempts.length) *
            100,
        )
      : 0

    return {
      userId,
      name: user.name,
      enrolledCourses,
      completedCourses,
      avgQuizScore,
    }
  }

  async getSchoolReport(orgId: string) {
    const [batches, students, gradeAgg, attendance] =
      await this.prisma.$transaction([
        this.prisma.batch.count({ where: { organizationId: orgId } }),
        this.prisma.batchStudent.count({
          where: { batch: { organizationId: orgId } },
        }),
        this.prisma.grade.aggregate({
          where: { organizationId: orgId },
          _avg: { score: true, maxScore: true },
        }),
        this.prisma.attendanceRecord.groupBy({
          by: ['status'],
          where: { batch: { organizationId: orgId } },
          _count: true,
          orderBy: { status: 'asc' },
        }),
      ])

    const countOf = (row: { _count: unknown }): number =>
      typeof row._count === 'number' ? row._count : 0
    const attendanceSummary = attendance.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.status] = countOf(row)
        return acc
      },
      {},
    )
    const present = attendanceSummary['PRESENT'] ?? 0
    const totalAttendance = attendance.reduce(
      (sum, row) => sum + countOf(row),
      0,
    )
    const avgScore = Number(gradeAgg._avg.score ?? 0)
    const avgMax = Number(gradeAgg._avg.maxScore ?? 0)

    return {
      totalBatches: batches,
      totalStudents: students,
      avgGradePct: avgMax ? Math.round((avgScore / avgMax) * 100) : 0,
      attendanceRate: totalAttendance
        ? Math.round((present / totalAttendance) * 100)
        : 0,
      attendanceSummary,
    }
  }

  async exportReport(orgId: string, type: string, format: ExportFormat) {
    const rows = await this.buildReportRows(orgId, type)
    if (format === 'csv') {
      return this.toCsv(rows)
    }
    return { type, rows }
  }

  private async buildReportRows(
    orgId: string,
    type: string,
  ): Promise<Record<string, unknown>[]> {
    if (type === 'courses') {
      const courses = await this.prisma.course.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          title: true,
          status: true,
          enrollmentCount: true,
          totalLessons: true,
        },
      })
      return courses
    }
    if (type === 'learners') {
      const users = await this.prisma.user.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, email: true, role: true },
      })
      return users
    }
    // Default: a single-row org summary.
    const dashboard = await this.getOrgDashboard(orgId)
    return [dashboard as unknown as Record<string, unknown>]
  }

  private toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return ''
    const headers = Object.keys(rows[0] as Record<string, unknown>)
    const escape = (value: unknown): string => {
      const str = value === null || value === undefined ? '' : String(value)
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
    }
    const lines = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ]
    return lines.join('\n')
  }
}
