import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma, Question } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { AddQuestionDto } from './dto/add-question.dto'
import { AnswerDto } from './dto/submit-attempt.dto'
import { CreateAssignmentDto } from './dto/create-assignment.dto'
import { CreateQuizDto } from './dto/create-quiz.dto'
import { SubmitAssignmentDto } from './dto/submit-assignment.dto'

interface QuestionOption {
  id: string
  text: string
  isCorrect?: boolean
}

interface GradeBreakdown {
  questionId: string
  awarded: number
  possible: number
  correct: boolean
}

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseOptions(value: Prisma.JsonValue | null): QuestionOption[] {
    if (!Array.isArray(value)) return []
    return value.filter(
      (o) => typeof o === 'object' && o !== null && !Array.isArray(o),
    ) as unknown as QuestionOption[]
  }

  async createQuiz(orgId: string, dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        organizationId: orgId,
        ...(dto.passingScore !== undefined
          ? { passingScore: dto.passingScore }
          : {}),
        ...(dto.timeLimitMins !== undefined
          ? { timeLimitMins: dto.timeLimitMins }
          : {}),
        ...(dto.maxAttempts !== undefined
          ? { maxAttempts: dto.maxAttempts }
          : {}),
        ...(dto.shuffleQuestions !== undefined
          ? { shuffleQuestions: dto.shuffleQuestions }
          : {}),
      },
    })
  }

  async addQuestion(quizId: string, dto: AddQuestionDto) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } })
    if (!quiz) throw new NotFoundException('Quiz not found')
    return this.prisma.question.create({
      data: {
        quizId,
        text: dto.text,
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.explanation ? { explanation: dto.explanation } : {}),
        ...(dto.points !== undefined ? { points: dto.points } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.options !== undefined ? { options: dto.options } : {}),
        ...(dto.correctAnswer ? { correctAnswer: dto.correctAnswer } : {}),
      },
    })
  }

  async startAttempt(userId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { order: 'asc' } } },
    })
    if (!quiz) throw new NotFoundException('Quiz not found')

    let questions = quiz.questions
    if (quiz.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5)
    }

    // Never leak the correct answers to the client.
    const sanitized = questions.map((q) => ({
      id: q.id,
      type: q.type,
      text: q.text,
      points: q.points,
      order: q.order,
      options: this.parseOptions(q.options).map((o) => ({
        id: o.id,
        text: o.text,
      })),
    }))

    return {
      quizId: quiz.id,
      title: quiz.title,
      timeLimitMins: quiz.timeLimitMins,
      userId,
      questions: sanitized,
    }
  }

  private gradeQuestion(question: Question, answer?: AnswerDto): GradeBreakdown {
    const possible = question.points
    if (!answer) {
      return { questionId: question.id, awarded: 0, possible, correct: false }
    }

    let correct = false
    if (question.type === 'MCQ' || question.type === 'MSQ') {
      const correctIds = this.parseOptions(question.options)
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort()
      const selected = [...answer.selectedOptionIds].sort()
      correct =
        correctIds.length > 0 &&
        correctIds.length === selected.length &&
        correctIds.every((id, i) => id === selected[i])
    } else {
      const expected = (question.correctAnswer ?? '').trim().toLowerCase()
      const given = (answer.text ?? '').trim().toLowerCase()
      correct = expected.length > 0 && expected === given
    }

    return {
      questionId: question.id,
      awarded: correct ? possible : 0,
      possible,
      correct,
    }
  }

  async submitAttempt(userId: string, quizId: string, answers: AnswerDto[]) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    })
    if (!quiz) throw new NotFoundException('Quiz not found')

    const answerMap = new Map(answers.map((a) => [a.questionId, a]))
    const breakdown = quiz.questions.map((q) =>
      this.gradeQuestion(q, answerMap.get(q.id)),
    )
    const score = breakdown.reduce((sum, b) => sum + b.awarded, 0)
    const maxScore = breakdown.reduce((sum, b) => sum + b.possible, 0)
    const pct = maxScore ? (score / maxScore) * 100 : 0
    const passed = pct >= quiz.passingScore

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        answers: answers as unknown as Prisma.InputJsonValue,
        score,
        maxScore,
        passed,
        submittedAt: new Date(),
      },
    })

    return {
      attemptId: attempt.id,
      score,
      maxScore,
      passed,
      breakdown,
    }
  }

  async createAssignment(orgId: string, dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        organizationId: orgId,
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.maxScore !== undefined ? { maxScore: dto.maxScore } : {}),
      },
    })
  }

  async submitAssignment(
    userId: string,
    assignmentId: string,
    dto: SubmitAssignmentDto,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    })
    if (!assignment) throw new NotFoundException('Assignment not found')

    return this.prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      create: {
        assignmentId,
        userId,
        status: 'SUBMITTED',
        ...(dto.content ? { content: dto.content } : {}),
        ...(dto.attachments !== undefined
          ? { attachments: dto.attachments }
          : {}),
      },
      update: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        ...(dto.content ? { content: dto.content } : {}),
        ...(dto.attachments !== undefined
          ? { attachments: dto.attachments }
          : {}),
      },
    })
  }

  async gradeSubmission(submissionId: string, score: number, feedback?: string) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
    })
    if (!submission) throw new NotFoundException('Submission not found')
    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        status: 'GRADED',
        gradedAt: new Date(),
        ...(feedback ? { feedback } : {}),
      },
    })
  }

  async generateQuestionsFromAI(
    content: string,
    count: number,
  ): Promise<unknown[]> {
    try {
      // Resolved lazily so a missing API key (or the optional @learnhub/ai
      // package being absent) never breaks module startup.
      const moduleName = '@learnhub/ai'
      const ai = (await import(moduleName)) as {
        generateQuizFromContent?: (
          content: string,
          count: number,
        ) => Promise<unknown[]>
      }
      if (!ai.generateQuizFromContent) return []
      return await ai.generateQuizFromContent(content, count)
    } catch {
      // No API key / package unavailable — degrade gracefully.
      return []
    }
  }
}
