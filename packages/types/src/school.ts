import { z } from 'zod'

export interface AcademicYear {
  id: string
  name: string
  organizationId: string
  startDate: Date
  endDate: Date
  isCurrent: boolean
}

export interface Term {
  id: string
  name: string
  academicYearId: string
  startDate: Date
  endDate: Date
}

export interface Batch {
  id: string
  name: string
  organizationId: string
  branchId?: string | null
  academicYearId?: string | null
  startDate?: Date | null
  endDate?: Date | null
  isActive: boolean
  maxStudents?: number | null
}

export interface TimetableSlot {
  id: string
  batchId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string
  instructorId?: string | null
  room?: string | null
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

export interface Attendance {
  id: string
  batchId: string
  userId: string
  date: Date
  status: AttendanceStatus
  note?: string | null
}

export interface Grade {
  id: string
  userId: string
  organizationId: string
  academicYearId?: string | null
  subject: string
  score: number
  maxScore: number
  gradeLabel?: string | null
  term?: string | null
  remarks?: string | null
}

export interface ParentStudentLink {
  id: string
  parentId: string
  studentId: string
  relation: string
}

export const createBatchSchema = z.object({
  name: z.string().min(1),
  branchId: z.string().optional(),
  academicYearId: z.string().optional(),
  maxStudents: z.number().int().positive().optional(),
})
export type CreateBatchDto = z.infer<typeof createBatchSchema>

export const markAttendanceSchema = z.object({
  date: z.string(),
  records: z.array(
    z.object({
      userId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      note: z.string().optional(),
    }),
  ),
})
export type MarkAttendanceDto = z.infer<typeof markAttendanceSchema>
