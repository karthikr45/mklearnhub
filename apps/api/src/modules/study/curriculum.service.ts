import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Subjects a student can study: their school's own subjects plus any
   * platform-global curriculum (organizationId null), optionally filtered to
   * one exam track.
   */
  async subjects(orgId: string | null, examTrack?: string) {
    const orgFilter: Prisma.SubjectWhereInput = orgId
      ? { OR: [{ organizationId: orgId }, { organizationId: null }] }
      : { organizationId: null }
    const where: Prisma.SubjectWhereInput = {
      ...orgFilter,
      ...(examTrack ? { examTrack: examTrack as never } : {}),
    }
    const subjects = await this.prisma.subject.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { chapters: true, questions: true } },
      },
    })
    return subjects.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      stream: s.stream,
      examTrack: s.examTrack,
      color: s.color,
      chapterCount: s._count.chapters,
      questionCount: s._count.questions,
    }))
  }

  /** A subject with its chapters, each with topic + question counts. */
  async subject(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { topics: true, questions: true } },
          },
        },
      },
    })
    if (!subject) throw new NotFoundException('Subject not found')
    return {
      id: subject.id,
      name: subject.name,
      grade: subject.grade,
      stream: subject.stream,
      examTrack: subject.examTrack,
      chapters: subject.chapters.map((c) => ({
        id: c.id,
        name: c.name,
        topicCount: c._count.topics,
        questionCount: c._count.questions,
      })),
    }
  }

  /** A chapter with its topics (and per-topic question counts). */
  async chapter(id: string) {
    const chapter = await this.prisma.syllabusChapter.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true } },
        topics: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { questions: true } } },
        },
        _count: { select: { questions: true } },
      },
    })
    if (!chapter) throw new NotFoundException('Chapter not found')
    return {
      id: chapter.id,
      name: chapter.name,
      subject: chapter.subject,
      questionCount: chapter._count.questions,
      topics: chapter.topics.map((t) => ({
        id: t.id,
        name: t.name,
        questionCount: t._count.questions,
      })),
    }
  }

  /** The exam tracks a student's class is preparing for. */
  async myTracks(userId: string) {
    const membership = await this.prisma.batchStudent.findFirst({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      select: {
        batch: {
          select: {
            grade: true,
            examTracks: { select: { examTrack: true } },
          },
        },
      },
    })
    return {
      grade: membership?.batch.grade ?? null,
      tracks: membership?.batch.examTracks.map((t) => t.examTrack) ?? [],
    }
  }
}
