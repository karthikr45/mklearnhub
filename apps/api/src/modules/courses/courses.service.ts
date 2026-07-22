import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@learnhub/db'
import { slugify } from '@learnhub/utils'
import { nanoid } from 'nanoid'

import { PrismaService } from '../../prisma/prisma.service'
import { CreateChapterDto } from './dto/create-chapter.dto'
import { CreateCourseDto } from './dto/create-course.dto'
import { CreateLessonDto } from './dto/create-lesson.dto'

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, instructorId: string, dto: CreateCourseDto) {
    const data: Prisma.CourseCreateInput = {
      title: dto.title,
      slug: `${slugify(dto.title)}-${nanoid(6)}`,
      organization: { connect: { id: orgId } },
      instructor: { connect: { id: instructorId } },
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.isFree !== undefined ? { isFree: dto.isFree } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.tags ? { tags: dto.tags } : {}),
    }
    return this.prisma.course.create({ data })
  }

  async list(orgId: string) {
    return this.prisma.course.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Public self-study catalog: every published course owned by the LearnHub
   * platform org. Personalised by the learner's profile — courses whose tags
   * match the learner's board/class/stream/exam targets/interests are flagged
   * `recommended` and sorted first. Works for any user, including a school-less
   * LEARNER with no organization.
   */
  async catalog(userId: string) {
    const [courses, profile] = await Promise.all([
      this.prisma.course.findMany({
        where: { status: 'PUBLISHED', organization: { isPlatform: true } },
        orderBy: { enrollmentCount: 'desc' },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          learnerTrack: true,
          learnerBoard: true,
          learnerClass: true,
          learnerStream: true,
          examTargets: true,
          interests: true,
        },
      }),
    ])

    const wanted = new Set<string>()
    if (profile) {
      const add = (v?: string | null) => {
        if (v) wanted.add(v.toLowerCase())
      }
      add(profile.learnerTrack)
      add(profile.learnerBoard)
      add(profile.learnerStream)
      if (profile.learnerClass) {
        add(profile.learnerClass)
        add(`class ${profile.learnerClass}`)
      }
      for (const t of profile.examTargets) add(t)
      for (const i of profile.interests) add(i)
    }

    const scored = courses.map((c) => {
      const score = c.tags.reduce(
        (n, tag) => (wanted.has(tag.toLowerCase()) ? n + 1 : n),
        0,
      )
      return { course: c, score }
    })
    // Recommended first (by score), then the rest by popularity.
    scored.sort((a, b) => b.score - a.score)
    return scored.map(({ course, score }) => ({ ...course, recommended: score > 0 }))
  }

  async addChapter(courseId: string, dto: CreateChapterDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')
    return this.prisma.chapter.create({
      data: {
        title: dto.title,
        courseId,
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    })
  }

  async addLesson(chapterId: string, dto: CreateLessonDto) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    })
    if (!chapter) throw new NotFoundException('Chapter not found')

    const lesson = await this.prisma.lesson.create({
      data: {
        title: dto.title,
        chapterId,
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.isFreePreview !== undefined
          ? { isFreePreview: dto.isFreePreview }
          : {}),
      },
    })
    // Keep the course-level lesson counter in sync for progress math.
    await this.prisma.course.update({
      where: { id: chapter.courseId },
      data: { totalLessons: { increment: 1 } },
    })
    return lesson
  }

  async publish(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } })
    if (!course) throw new NotFoundException('Course not found')
    return this.prisma.course.update({
      where: { id: courseId },
      data: { status: 'PUBLISHED', isPublic: true, publishedAt: new Date() },
    })
  }

  async enroll(userId: string, courseId: string) {
    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing) return existing

    const enrollment = await this.prisma.enrollment.create({
      data: { userId, courseId },
    })
    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    })
    return enrollment
  }

  async updateProgress(userId: string, lessonId: string, watchedSecs: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: true },
    })
    if (!lesson) throw new NotFoundException('Lesson not found')

    const courseId = lesson.chapter.courseId
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (!enrollment) throw new NotFoundException('Not enrolled in this course')

    const duration = lesson.videoDurationSecs ?? 0
    const isCompleted = duration > 0 && watchedSecs >= duration * 0.9

    await this.prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        userId,
        watchedSecs,
        isCompleted,
        ...(isCompleted ? { completedAt: new Date() } : {}),
      },
      update: {
        watchedSecs,
        isCompleted,
        ...(isCompleted ? { completedAt: new Date() } : {}),
      },
    })

    const [totalLessons, completedLessons] = await this.prisma.$transaction([
      this.prisma.lesson.count({ where: { chapter: { courseId } } }),
      this.prisma.lessonProgress.count({
        where: { enrollmentId: enrollment.id, isCompleted: true },
      }),
    ])
    const progressPct = totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPct,
        lastAccessAt: new Date(),
        ...(progressPct >= 100
          ? { status: 'COMPLETED', completedAt: new Date() }
          : { status: 'IN_PROGRESS' }),
      },
    })
  }

  async completeCourse(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    })
    if (!enrollment) throw new NotFoundException('Enrollment not found')

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'COMPLETED', progressPct: 100, completedAt: new Date() },
    })

    const existingCert = await this.prisma.certificate.findUnique({
      where: { enrollmentId },
    })
    if (!existingCert) {
      await this.prisma.certificate.create({
        data: {
          enrollmentId,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          certificateNo: `CERT-${nanoid(10)}`,
        },
      })
    }
    return updated
  }

  async getCourseWithProgress(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    })
    if (!course) throw new NotFoundException('Course not found')

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { progress: true },
    })
    return {
      ...course,
      progressPct: enrollment?.progressPct ?? 0,
      lessonProgress: enrollment?.progress ?? [],
    }
  }

  async getCourse(courseId: string, orgId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, organizationId: orgId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    })
    if (!course) throw new NotFoundException('Course not found')
    return course
  }

  async getEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: { course: true },
    })
  }

  async getMyCertificates(userId: string) {
    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: { course: { select: { id: true, title: true } } },
    })
    return certificates.map((c) => ({
      id: c.id,
      certificateNo: c.certificateNo,
      issuedAt: c.issuedAt,
      pdfUrl: c.pdfUrl,
      course: c.course,
    }))
  }

  getUploadUrl(key: string) {
    // Real presigning lives in StorageService; this is a stub for wiring.
    return { note: 'configure storage', key }
  }
}
