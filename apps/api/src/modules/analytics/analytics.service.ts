import { Injectable, NotFoundException } from '@nestjs/common'
import type { OrgStats, OrgTrends } from '@learnhub/types'

import { PrismaService } from '../../prisma/prisma.service'

type ExportFormat = 'csv' | 'json'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Live trends for the org analytics dashboard: KPI stats, a 6-month
   * enrollment/completion time series, and the top courses by enrollment.
   * All queries are scoped to the org's courses.
   */
  async getOrgTrends(orgId: string): Promise<OrgTrends> {
    const stats = await this.getOrgDashboard(orgId)

    // 6-month window, oldest → newest.
    const now = new Date()
    const buckets: { key: string; month: string; enrollments: number; completions: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: MONTH_LABELS[d.getMonth()] ?? '',
        enrollments: 0,
        completions: 0,
      })
    }
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const byKey = new Map(buckets.map((b) => [b.key, b]))

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        course: { organizationId: orgId },
        enrolledAt: { gte: windowStart },
      },
      select: { enrolledAt: true, completedAt: true },
    })
    for (const e of enrollments) {
      const ek = `${e.enrolledAt.getFullYear()}-${e.enrolledAt.getMonth()}`
      const eb = byKey.get(ek)
      if (eb) eb.enrollments += 1
      if (e.completedAt && e.completedAt >= windowStart) {
        const ck = `${e.completedAt.getFullYear()}-${e.completedAt.getMonth()}`
        const cb = byKey.get(ck)
        if (cb) cb.completions += 1
      }
    }

    const grouped = await this.prisma.enrollment.groupBy({
      by: ['courseId'],
      where: { course: { organizationId: orgId } },
      _count: { courseId: true },
      orderBy: { _count: { courseId: 'desc' } },
      take: 6,
    })
    const courseIds = grouped.map((g) => g.courseId)
    const courses = courseIds.length
      ? await this.prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true },
        })
      : []
    const titleById = new Map(courses.map((c) => [c.id, c.title]))
    const completedByCourse = courseIds.length
      ? await this.prisma.enrollment.groupBy({
          by: ['courseId'],
          where: { courseId: { in: courseIds }, status: 'COMPLETED' },
          _count: { courseId: true },
        })
      : []
    const completedMap = new Map(
      completedByCourse.map((c) => [c.courseId, c._count.courseId]),
    )

    const topCourses = grouped.map((g) => {
      const total = g._count.courseId
      const done = completedMap.get(g.courseId) ?? 0
      return {
        title: titleById.get(g.courseId) ?? 'Untitled course',
        enrollments: total,
        completionRate: total ? Math.round((done / total) * 100) : 0,
      }
    })

    return {
      stats,
      enrollmentsByMonth: buckets.map((b) => ({
        month: b.month,
        enrollments: b.enrollments,
        completions: b.completions,
      })),
      topCourses,
    }
  }

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
