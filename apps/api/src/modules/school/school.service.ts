import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { AttendanceEntryDto } from './dto/mark-attendance.dto'
import { CreateBatchDto } from './dto/create-batch.dto'
import { RecordGradeDto } from './dto/record-grade.dto'
import { TimetableSlotDto } from './dto/create-timetable.dto'

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}

  async createBatch(orgId: string, dto: CreateBatchDto) {
    return this.prisma.batch.create({
      data: {
        name: dto.name,
        organizationId: orgId,
        ...(dto.branchId ? { branchId: dto.branchId } : {}),
        ...(dto.academicYearId ? { academicYearId: dto.academicYearId } : {}),
        ...(dto.maxStudents !== undefined
          ? { maxStudents: dto.maxStudents }
          : {}),
      },
    })
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
