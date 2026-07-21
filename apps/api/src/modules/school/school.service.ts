import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { customAlphabet } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { AttendanceEntryDto } from './dto/mark-attendance.dto'
import { CreateBatchDto } from './dto/create-batch.dto'

// Readable code alphabet — no easily-confused characters (0/O, 1/I).
const codeSuffix = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4)
import { RecordGradeDto } from './dto/record-grade.dto'
import { TimetableSlotDto } from './dto/create-timetable.dto'

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A learner/student joins a class by its code, any time after registering.
   * Maps them to the school + batch + academic year (upgrading a LEARNER to
   * STUDENT), unlocking collaboration. The code is the verification gate.
   */
  async joinByCode(userId: string, rawCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })
    if (!user) throw new NotFoundException('User not found')
    if (!['LEARNER', 'STUDENT'].includes(user.role)) {
      throw new ForbiddenException('Only learners and students can join a class')
    }

    const code = rawCode.trim().toUpperCase()
    const batch = await this.prisma.batch.findUnique({
      where: { joinCode: code },
      include: { organization: { select: { id: true, name: true } } },
    })
    if (!batch) throw new BadRequestException('Invalid class join code')

    const already = await this.prisma.batchStudent.findUnique({
      where: { batchId_userId: { batchId: batch.id, userId } },
    })
    if (!already) {
      if (batch.maxStudents) {
        const count = await this.prisma.batchStudent.count({
          where: { batchId: batch.id },
        })
        if (count >= batch.maxStudents) {
          throw new BadRequestException('This class is full')
        }
      }
      await this.prisma.batchStudent.create({
        data: { batchId: batch.id, userId },
      })
    }
    // Upgrade a self-study learner into a school student.
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'STUDENT', organizationId: batch.organizationId },
    })

    return {
      success: true,
      schoolName: batch.organization.name,
      className: batch.name,
    }
  }

  async getStudentOverview(userId: string) {
    const memberships = await this.prisma.batchStudent.findMany({
      where: { userId },
      include: {
        batch: {
          include: {
            timetable: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
            academicYear: true,
            branch: { select: { name: true } },
          },
        },
      },
    })

    const batches = memberships.map((m) => ({
      id: m.batch.id,
      name: m.batch.name,
      timetable: m.batch.timetable,
      academicYear: m.batch.academicYear?.name ?? null,
      branchName: m.batch.branch?.name ?? null,
    }))

    const grades = await this.prisma.grade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const grouped = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    })
    const counts = grouped.reduce<Record<string, number>>((acc, g) => {
      acc[g.status] = g._count._all
      return acc
    }, {})
    const present = counts.PRESENT ?? 0
    const absent = counts.ABSENT ?? 0
    const late = counts.LATE ?? 0
    const excused = counts.EXCUSED ?? 0
    const total = present + absent + late + excused

    return {
      batches,
      grades,
      attendance: {
        present,
        absent,
        late,
        excused,
        total,
        rate: total ? Math.round((present / total) * 100) : 0,
      },
    }
  }

  /** Generate a unique, human-shareable class join code. */
  private async freshJoinCode(grade?: string | null, section?: string | null) {
    const base =
      `${(grade ?? '').replace(/[^0-9A-Za-z]/g, '').slice(-3)}${section ?? ''}`
        .toUpperCase() || 'CLS'
    for (let i = 0; i < 6; i++) {
      const code = `${base}-${codeSuffix()}`
      const clash = await this.prisma.batch.findUnique({ where: { joinCode: code } })
      if (!clash) return code
    }
    // Extremely unlikely fallback
    return `CLS-${codeSuffix()}${codeSuffix()}`
  }

  /**
   * Ensure the org has an academic year to attach the class to (study groups
   * are scoped by it). Reuse the current one, else the newest, else create one.
   */
  private async ensureAcademicYear(orgId: string, given?: string): Promise<string> {
    if (given) return given
    const existing = await this.prisma.academicYear.findFirst({
      where: { organizationId: orgId },
      orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
    })
    if (existing) return existing.id
    const y = new Date().getFullYear()
    const created = await this.prisma.academicYear.create({
      data: {
        name: `${y}-${y + 1}`,
        organizationId: orgId,
        startDate: new Date(`${y}-06-01`),
        endDate: new Date(`${y + 1}-04-30`),
        isCurrent: true,
      },
    })
    return created.id
  }

  async createBatch(orgId: string, dto: CreateBatchDto) {
    const academicYearId = await this.ensureAcademicYear(orgId, dto.academicYearId)
    const joinCode = await this.freshJoinCode(dto.grade, dto.section)
    return this.prisma.batch.create({
      data: {
        name: dto.name,
        organizationId: orgId,
        academicYearId,
        joinCode,
        ...(dto.grade ? { grade: dto.grade } : {}),
        ...(dto.section ? { section: dto.section } : {}),
        ...(dto.branchId ? { branchId: dto.branchId } : {}),
        ...(dto.maxStudents !== undefined ? { maxStudents: dto.maxStudents } : {}),
      },
    })
  }

  /** Rotate a class's join code (e.g. if it leaked). Old code stops working. */
  async regenerateJoinCode(orgId: string, batchId: string) {
    const batch = await this.prisma.batch.findFirst({
      where: { id: batchId, organizationId: orgId },
    })
    if (!batch) throw new NotFoundException('Batch not found')
    const joinCode = await this.freshJoinCode(batch.grade, batch.section)
    await this.prisma.batch.update({ where: { id: batchId }, data: { joinCode } })
    return { joinCode }
  }

  async listBatches(orgId: string) {
    return this.prisma.batch.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { students: true } },
        branch: { select: { name: true } },
      },
    })
  }

  async getBatch(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        students: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        timetable: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        academicYear: true,
      },
    })
    if (!batch) throw new NotFoundException('Batch not found')
    return batch
  }

  async getTimetable(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Batch not found')
    return this.prisma.timetableSlot.findMany({
      where: { batchId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
  }

  async addStudentsToBatch(batchId: string, userIds: string[]) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Batch not found')
    const result = await this.prisma.batchStudent.createMany({
      data: userIds.map((userId) => ({ batchId, userId })),
      skipDuplicates: true,
    })
    return { added: result.count }
  }

  async createTimetable(batchId: string, slots: TimetableSlotDto[]) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Batch not found')
    const result = await this.prisma.timetableSlot.createMany({
      data: slots.map((s) => ({
        batchId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject,
        ...(s.instructorId ? { instructorId: s.instructorId } : {}),
        ...(s.room ? { room: s.room } : {}),
      })),
    })
    return { created: result.count }
  }

  async markAttendance(
    batchId: string,
    date: string,
    records: AttendanceEntryDto[],
  ) {
    const day = new Date(date)
    if (Number.isNaN(day.getTime())) {
      throw new BadRequestException('Invalid date')
    }
    await this.prisma.$transaction(
      records.map((r) =>
        this.prisma.attendanceRecord.upsert({
          where: {
            batchId_userId_date: { batchId, userId: r.userId, date: day },
          },
          create: {
            batchId,
            userId: r.userId,
            date: day,
            status: r.status,
            ...(r.note ? { note: r.note } : {}),
          },
          update: {
            status: r.status,
            ...(r.note ? { note: r.note } : {}),
          },
        }),
      ),
    )
    return { marked: records.length, date: day.toISOString().slice(0, 10) }
  }

  async getAttendanceReport(
    batchId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const records = await this.prisma.attendanceRecord.findMany({
      where: { batchId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    })
    const summary = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {})
    return { batchId, total: records.length, summary, records }
  }

  async recordGrade(userId: string, dto: RecordGradeDto) {
    const student = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!student) throw new NotFoundException('Student not found')
    if (!student.organizationId) {
      throw new BadRequestException('Student is not attached to an organization')
    }
    return this.prisma.grade.create({
      data: {
        userId,
        organizationId: student.organizationId,
        subject: dto.subject,
        score: dto.score,
        maxScore: dto.maxScore,
        ...(dto.academicYearId ? { academicYearId: dto.academicYearId } : {}),
        ...(dto.gradeLabel ? { gradeLabel: dto.gradeLabel } : {}),
        ...(dto.term ? { term: dto.term } : {}),
        ...(dto.remarks ? { remarks: dto.remarks } : {}),
      },
    })
  }

  async getGradeCard(studentId: string, academicYearId?: string) {
    const where: Prisma.GradeWhereInput = {
      userId: studentId,
      ...(academicYearId ? { academicYearId } : {}),
    }
    const grades = await this.prisma.grade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    const totalScore = grades.reduce((sum, g) => sum + Number(g.score), 0)
    const totalMax = grades.reduce((sum, g) => sum + Number(g.maxScore), 0)
    return {
      studentId,
      grades,
      overallPct: totalMax ? Math.round((totalScore / totalMax) * 100) : 0,
    }
  }

  async linkParentStudent(parentId: string, studentId: string) {
    return this.prisma.parentStudentLink.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      create: { parentId, studentId },
      update: {},
    })
  }

  async getChildrenForParent(parentId: string) {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    })
    return links.map((l) => l.student)
  }
}
