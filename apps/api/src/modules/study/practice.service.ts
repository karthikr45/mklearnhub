import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { AssessmentQuestion, Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { StartPracticeDto, SubmitAttemptDto } from './dto/practice.dto'

/** Public shape of a question while an attempt is in progress (no answers). */
function sanitize(q: AssessmentQuestion) {
  return {
    id: q.id,
    type: q.type,
    difficulty: q.difficulty,
    text: q.text,
    options: q.options,
    marks: q.marks,
  }
}

/** Deterministic-enough shuffle for question selection (Node runtime). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Grade one response against a question's stored correct answer. */
function isResponseCorrect(q: AssessmentQuestion, response: unknown): boolean {
  const correct = q.correctAnswer as unknown
  if (response === undefined || response === null) return false
  switch (q.type) {
    case 'MCQ':
    case 'ASSERTION_REASON':
      return String(response) === String(correct)
    case 'TRUE_FALSE':
      return Boolean(response) === Boolean(correct)
    case 'MSQ': {
      const a = Array.isArray(response) ? response.map(String).sort() : []
      const b = Array.isArray(correct) ? correct.map(String).sort() : []
      return a.length > 0 && a.length === b.length && a.every((v, i) => v === b[i])
    }
    case 'NUMERIC': {
      const val = Number(response)
      if (Number.isNaN(val)) return false
      if (correct && typeof correct === 'object' && 'value' in correct) {
        const { value, tolerance } = correct as { value: number; tolerance?: number }
        return Math.abs(val - value) <= (tolerance ?? 0.001)
      }
      return Math.abs(val - Number(correct)) <= 0.001
    }
    default:
      return false
  }
}

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  private orgFilter(orgId: string | null): Prisma.AssessmentQuestionWhereInput {
    return orgId
      ? { OR: [{ organizationId: orgId }, { organizationId: null }] }
      : { organizationId: null }
  }

  /** Start a dynamic practice set from the question bank. */
  async startPractice(userId: string, orgId: string | null, dto: StartPracticeDto) {
    const where: Prisma.AssessmentQuestionWhereInput = {
      ...this.orgFilter(orgId),
      ...(dto.subjectId ? { subjectId: dto.subjectId } : {}),
      ...(dto.chapterId ? { chapterId: dto.chapterId } : {}),
      ...(dto.topicId ? { topicId: dto.topicId } : {}),
      ...(dto.examTrack ? { examTrack: dto.examTrack as never } : {}),
      ...(dto.difficulty ? { difficulty: dto.difficulty as never } : {}),
    }
    const pool = await this.prisma.assessmentQuestion.findMany({
      where,
      take: 200,
    })
    if (pool.length === 0) {
      throw new BadRequestException('No questions available for this selection yet')
    }
    const limit = Math.min(dto.limit ?? 10, 50)
    const chosen = shuffle(pool).slice(0, limit)

    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        userId,
        mode: 'PRACTICE',
        status: 'IN_PROGRESS',
        ...(dto.subjectId ? { subjectId: dto.subjectId } : {}),
        ...(dto.chapterId ? { chapterId: dto.chapterId } : {}),
        ...(dto.topicId ? { topicId: dto.topicId } : {}),
        ...(dto.examTrack ? { examTrack: dto.examTrack as never } : {}),
        totalCount: chosen.length,
        maxScore: chosen.reduce((sum, q) => sum + q.marks, 0),
        responses: {
          create: chosen.map((q) => ({ questionId: q.id })),
        },
      },
    })
    return {
      attemptId: attempt.id,
      questions: chosen.map(sanitize),
    }
  }

  /** Start a fixed assessment (chapter test / mock / previous-year). */
  async startAssessment(userId: string, orgId: string | null, assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        isPublished: true,
        ...(orgId
          ? { OR: [{ organizationId: orgId }, { organizationId: null }] }
          : { organizationId: null }),
      },
      include: {
        items: { orderBy: { order: 'asc' }, include: { question: true } },
      },
    })
    if (!assessment) throw new NotFoundException('Assessment not found')
    const questions = assessment.items.map((i) => i.question)
    if (questions.length === 0) {
      throw new BadRequestException('This assessment has no questions yet')
    }
    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        userId,
        assessmentId: assessment.id,
        mode: assessment.type === 'MOCK_TEST' ? 'MOCK' : 'TEST',
        status: 'IN_PROGRESS',
        ...(assessment.subjectId ? { subjectId: assessment.subjectId } : {}),
        ...(assessment.examTrack ? { examTrack: assessment.examTrack } : {}),
        totalCount: questions.length,
        maxScore: questions.reduce((sum, q) => sum + q.marks, 0),
        responses: { create: questions.map((q) => ({ questionId: q.id })) },
      },
    })
    return {
      attemptId: attempt.id,
      title: assessment.title,
      durationMins: assessment.durationMins,
      negativeMarking: assessment.negativeMarking,
      questions: questions.map(sanitize),
    }
  }

  /** Grade a submitted attempt and return full results + analytics. */
  async submit(userId: string, attemptId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
        responses: { include: { question: { include: { topic: true } } } },
      },
    })
    if (!attempt) throw new NotFoundException('Attempt not found')
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt')
    if (attempt.status === 'SUBMITTED') {
      throw new BadRequestException('This attempt was already submitted')
    }

    const negative = attempt.assessment?.negativeMarking ?? false
    const answerMap = new Map(dto.responses.map((r) => [r.questionId, r.response]))
    const topicStats = new Map<string, { name: string; correct: number; total: number }>()

    let score = 0
    let correctCount = 0

    for (const resp of attempt.responses) {
      const q = resp.question
      const given = answerMap.get(q.id)
      const answered = given !== undefined && given !== null && given !== ''
      const correct = answered && isResponseCorrect(q, given)
      let marks = 0
      if (correct) {
        marks = q.marks
        correctCount++
      } else if (answered && negative) {
        marks = -q.negativeMarks
      }
      score += marks

      const key = q.topicId ?? 'untagged'
      const stat = topicStats.get(key) ?? {
        name: q.topic?.name ?? 'General',
        correct: 0,
        total: 0,
      }
      stat.total++
      if (correct) stat.correct++
      topicStats.set(key, stat)

      await this.prisma.attemptResponse.update({
        where: { id: resp.id },
        data: {
          response: (given ?? null) as Prisma.InputJsonValue,
          isCorrect: correct,
          marksAwarded: marks,
        },
      })
    }

    const analytics = {
      byTopic: [...topicStats.entries()].map(([topicId, s]) => ({
        topicId,
        topic: s.name,
        correct: s.correct,
        total: s.total,
        accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0,
      })),
    }
    const durationSecs = Math.max(
      0,
      Math.round((Date.now() - attempt.startedAt.getTime()) / 1000),
    )

    await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        score,
        correctCount,
        durationSecs,
        analytics,
      },
    })

    return this.results(userId, attemptId)
  }

  /** Full results view: per-question correctness + answers + analytics. */
  async results(userId: string, attemptId: string) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: {
          include: { question: { include: { topic: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!attempt) throw new NotFoundException('Attempt not found')
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt')

    return {
      id: attempt.id,
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      correctCount: attempt.correctCount,
      totalCount: attempt.totalCount,
      durationSecs: attempt.durationSecs,
      analytics: attempt.analytics,
      questions: attempt.responses.map((r) => ({
        id: r.question.id,
        text: r.question.text,
        type: r.question.type,
        options: r.question.options,
        topic: r.question.topic?.name ?? null,
        yourAnswer: r.response,
        correctAnswer:
          attempt.status === 'SUBMITTED' ? r.question.correctAnswer : undefined,
        explanation:
          attempt.status === 'SUBMITTED' ? r.question.explanation : undefined,
        isCorrect: r.isCorrect,
        marksAwarded: r.marksAwarded,
      })),
    }
  }

  /** A student's recent attempts. */
  async history(userId: string) {
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { userId, status: 'SUBMITTED' },
      orderBy: { submittedAt: 'desc' },
      take: 50,
      include: {
        assessment: { select: { title: true } },
      },
    })
    // Practice attempts have no fixed assessment — label them by subject.
    const subjectIds = [...new Set(attempts.map((a) => a.subjectId).filter(Boolean))]
    const subjects = subjectIds.length
      ? await this.prisma.subject.findMany({
          where: { id: { in: subjectIds as string[] } },
          select: { id: true, name: true },
        })
      : []
    const subjectName = new Map(subjects.map((s) => [s.id, s.name]))
    return attempts.map((a) => ({
      id: a.id,
      title:
        a.assessment?.title ??
        (a.subjectId ? `${subjectName.get(a.subjectId) ?? 'Subject'} practice` : 'Practice'),
      mode: a.mode,
      score: a.score,
      maxScore: a.maxScore,
      correctCount: a.correctCount,
      totalCount: a.totalCount,
      submittedAt: a.submittedAt,
    }))
  }

  /** Published fixed assessments available to the student. */
  async listAssessments(orgId: string | null, examTrack?: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: {
        isPublished: true,
        ...(orgId
          ? { OR: [{ organizationId: orgId }, { organizationId: null }] }
          : { organizationId: null }),
        ...(examTrack ? { examTrack: examTrack as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { name: true } },
        _count: { select: { items: true } },
      },
    })
    return assessments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      examTrack: a.examTrack,
      subject: a.subject?.name ?? null,
      durationMins: a.durationMins,
      questionCount: a._count.items,
    }))
  }
}
