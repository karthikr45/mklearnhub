import { Injectable } from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'

/** Class/grade options offered during student registration. */
export const GRADE_OPTIONS = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Intermediate 1st Year', 'Intermediate 2nd Year',
]

export const BOARD_OPTIONS = [
  { value: 'TELANGANA_STATE', label: 'Telangana State Board (BSE/BIE TS)' },
  { value: 'ANDHRA_PRADESH_STATE', label: 'Andhra Pradesh State Board (BSE/BIE AP)' },
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'IB', label: 'IB' },
  { value: 'OTHER', label: 'Other' },
]

export const STATE_OPTIONS = [
  { value: 'TELANGANA', label: 'Telangana' },
  { value: 'ANDHRA_PRADESH', label: 'Andhra Pradesh' },
]

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dropdown data for the student registration wizard. */
  meta() {
    return {
      states: STATE_OPTIONS,
      boards: BOARD_OPTIONS,
      grades: GRADE_OPTIONS,
    }
  }

  /** Publicly listed schools, filterable by state / board / name. */
  async schools(params: { state?: string; board?: string; q?: string }) {
    const where: Prisma.OrganizationWhereInput = {
      type: 'SCHOOL',
      listedInDirectory: true,
      ...(params.state ? { state: params.state as never } : {}),
      ...(params.board ? { board: params.board as never } : {}),
      ...(params.q
        ? { name: { contains: params.q, mode: 'insensitive' } }
        : {}),
    }
    const schools = await this.prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        board: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
      take: 50,
    })
    return schools
  }

  /**
   * A school's classes (batches). Deliberately does NOT expose join codes —
   * the student still needs the code from their teacher to actually enrol.
   */
  async schoolClasses(schoolId: string) {
    const school = await this.prisma.organization.findFirst({
      where: { id: schoolId, type: 'SCHOOL', listedInDirectory: true },
      select: { id: true, name: true, city: true, state: true, board: true },
    })
    if (!school) return null
    const batches = await this.prisma.batch.findMany({
      where: { organizationId: schoolId, isActive: true },
      select: {
        id: true,
        name: true,
        grade: true,
        section: true,
        board: true,
        academicYear: { select: { name: true, isCurrent: true } },
      },
      orderBy: { name: 'asc' },
    })
    return { school, classes: batches }
  }

  /**
   * Preview a join code before registering — confirms the student is about to
   * join the right school/class. Returns { valid: false } for a bad code
   * without leaking whether the school exists.
   */
  async lookupJoinCode(code: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { joinCode: code.trim().toUpperCase() },
      select: {
        grade: true,
        section: true,
        name: true,
        board: true,
        organization: { select: { name: true, city: true, state: true } },
        academicYear: { select: { name: true } },
      },
    })
    if (!batch) return { valid: false as const }
    return {
      valid: true as const,
      schoolName: batch.organization.name,
      city: batch.organization.city,
      state: batch.organization.state,
      board: batch.board,
      className: batch.name,
      grade: batch.grade,
      section: batch.section,
      academicYear: batch.academicYear?.name ?? null,
    }
  }
}
