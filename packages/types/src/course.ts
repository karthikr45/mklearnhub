import { z } from 'zod'

import { CourseStatus, EnrollmentStatus, LessonType } from './enums'

export interface Lesson {
  id: string
  title: string
  description?: string | null
  chapterId: string
  type: LessonType
  videoUrl?: string | null
  hlsUrl?: string | null
  videoDurationSecs?: number | null
  order: number
  isFreePreview: boolean
  isPublished: boolean
}

export interface Chapter {
  id: string
  title: string
  description?: string | null
  courseId: string
  order: number
  lessons: Lesson[]
}

export interface Course {
  id: string
  title: string
  slug: string
  description?: string | null
  thumbnailUrl?: string | null
  organizationId: string
  instructorId: string
  status: CourseStatus
  isPublic: boolean
  isFree: boolean
  price?: number | null
  currency: string
  tags: string[]
  level: string
  totalLessons: number
  enrollmentCount: number
  rating?: number | null
  createdAt: Date
  updatedAt: Date
}

export interface LessonProgress {
  lessonId: string
  isCompleted: boolean
  watchedSecs: number
}

export interface CourseWithProgress extends Course {
  chapters: Chapter[]
  progressPct: number
  lessonProgress: LessonProgress[]
}

export interface EnrollmentWithCourse {
  id: string
  status: EnrollmentStatus
  progressPct: number
  enrolledAt: Date
  course: Course
}

export const createCourseSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  isFree: z.boolean().default(true),
  price: z.number().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
})
export type CreateCourseDto = z.infer<typeof createCourseSchema>

export const updateCourseSchema = createCourseSchema.partial()
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>

export const publishCourseSchema = z.object({
  publish: z.boolean().default(true),
})
export type PublishCourseDto = z.infer<typeof publishCourseSchema>

export const createChapterSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().default(0),
})
export type CreateChapterDto = z.infer<typeof createChapterSchema>

export const createLessonSchema = z.object({
  title: z.string().min(1),
  type: z.nativeEnum(LessonType).default(LessonType.VIDEO),
  order: z.number().int().default(0),
  isFreePreview: z.boolean().default(false),
})
export type CreateLessonDto = z.infer<typeof createLessonSchema>
