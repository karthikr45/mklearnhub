import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

const NODE_TYPES = new Set([
  'SUBJECT', 'UNIT', 'BOOK', 'CHAPTER', 'TOPIC', 'SUBTOPIC', 'OBJECTIVE',
])
const QUESTION_TYPES = new Set([
  'MCQ', 'MSQ', 'TRUE_FALSE', 'NUMERIC', 'ASSERTION_REASON',
])
const DIFFICULTIES = new Set(['EASY', 'MEDIUM', 'HARD'])

export interface QuestionOption {
  id: string
  text: string
}

export interface CreateCurriculumQuestionInput {
  text: string
  type?: string
  difficulty?: string
  options?: QuestionOption[]
  correctAnswer: unknown
  explanation?: string
  marks?: number
  negativeMarks?: number
}

/**
 * Curriculum-native question bank: author practice questions directly against
 * a curriculum node (subject/chapter/topic/…) and link them via
 * QuestionCurriculumMapping. These feed the student "Practice" flow on the
 * syllabus. Platform questions (super-admin) have organizationId null; org
 * admins scope questions to their organization.
 */
@Injectable()
export class CurriculumQuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertNode(nodeType: string) {
    if (!NODE_TYPES.has(nodeType)) {
      throw new BadRequestException(`Unknown curriculum node type: ${nodeType}`)
    }
  }

  /** Admin view: questions mapped to a node, WITH answers/explanations. */
  async list(nodeType: string, nodeId: string) {
    this.assertNode(nodeType)
    const mappings = await this.prisma.questionCurriculumMapping.findMany({
      where: { nodeType: nodeType as never, nodeId },
      orderBy: { createdAt: 'asc' },
      include: { question: true },
    })
    return mappings.map((m) => ({
      mappingId: m.id,
      question: {
        id: m.question.id,
        text: m.question.text,
        type: m.question.type,
        difficulty: m.question.difficulty,
        options: m.question.options,
        correctAnswer: m.question.correctAnswer,
        explanation: m.question.explanation,
        marks: m.question.marks,
        negativeMarks: m.question.negativeMarks,
      },
    }))
  }

  /** Create a question and map it to the node in one step. */
  async create(
    userId: string,
    orgId: string | null,
    role: string | undefined,
    nodeType: string,
    nodeId: string,
    input: CreateCurriculumQuestionInput,
  ) {
    this.assertNode(nodeType)
    if (!input.text?.trim()) throw new BadRequestException('Question text is required')

    const type = (input.type ?? 'MCQ').toUpperCase()
    if (!QUESTION_TYPES.has(type)) {
      throw new BadRequestException(`Unsupported question type: ${type}`)
    }
    const difficulty = (input.difficulty ?? 'MEDIUM').toUpperCase()
    if (!DIFFICULTIES.has(difficulty)) {
      throw new BadRequestException(`Unsupported difficulty: ${difficulty}`)
    }
    if (input.correctAnswer === undefined || input.correctAnswer === null) {
      throw new BadRequestException('A correct answer is required')
    }
    if ((type === 'MCQ' || type === 'MSQ') && (input.options?.length ?? 0) < 2) {
      throw new BadRequestException('Choice questions need at least two options')
    }

    // Super-admin authors platform questions (org null); others scope to org.
    const organizationId = role === 'SUPER_ADMIN' ? null : orgId

    const question = await this.prisma.assessmentQuestion.create({
      data: {
        organizationId,
        type: type as never,
        difficulty: difficulty as never,
        text: input.text.trim(),
        options: (input.options ?? []) as unknown as Prisma.InputJsonValue,
        correctAnswer: input.correctAnswer as Prisma.InputJsonValue,
        ...(input.explanation ? { explanation: input.explanation.trim() } : {}),
        marks: input.marks ?? 1,
        negativeMarks: input.negativeMarks ?? 0,
        createdById: userId,
        curriculumLinks: {
          create: { nodeType: nodeType as never, nodeId },
        },
      },
    })
    await this.audit.log({
      userId,
      action: 'curriculum.question.created',
      resource: 'AssessmentQuestion',
      resourceId: question.id,
      newValues: { nodeType, nodeId },
    })
    return question
  }

  /** Detach a question from a node (and delete the orphaned question). */
  async remove(userId: string, mappingId: string) {
    const mapping = await this.prisma.questionCurriculumMapping.findUnique({
      where: { id: mappingId },
    })
    if (!mapping) throw new NotFoundException('Question mapping not found')

    // If this was the question's only curriculum link and it isn't part of any
    // fixed assessment, remove the question entirely; otherwise just unlink.
    const [linkCount, itemCount] = await Promise.all([
      this.prisma.questionCurriculumMapping.count({
        where: { questionId: mapping.questionId },
      }),
      this.prisma.assessmentItem.count({ where: { questionId: mapping.questionId } }),
    ])

    if (linkCount <= 1 && itemCount === 0) {
      await this.prisma.assessmentQuestion.delete({ where: { id: mapping.questionId } })
    } else {
      await this.prisma.questionCurriculumMapping.delete({ where: { id: mappingId } })
    }
    await this.audit.log({
      userId,
      action: 'curriculum.question.removed',
      resource: 'AssessmentQuestion',
      resourceId: mapping.questionId,
    })
    return { removed: true }
  }
}
