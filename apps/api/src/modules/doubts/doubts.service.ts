import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { JwtPayload } from '@learnhub/types'
import type { Prisma } from '@learnhub/db'

import { PrismaService } from '../../prisma/prisma.service'
import { ModerationService } from '../study-groups/moderation.service'
import { AnswerDoubtDto, CreateDoubtDto } from './dto/doubt.dto'

@Injectable()
export class DoubtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
  ) {}

  private async screen(user: JwtPayload, text: string) {
    const res = await this.moderation.screenMessage({
      userId: user.sub,
      organizationId: user.orgId,
      body: text,
    })
    if (res.status === 'BLOCKED') {
      throw new BadRequestException({
        message: 'This was blocked to keep the space safe for students.',
        reasons: res.reasons,
        code: 'CONTENT_BLOCKED',
      })
    }
  }

  async create(user: JwtPayload, dto: CreateDoubtDto) {
    await this.screen(user, `${dto.title} ${dto.body}`)
    return this.prisma.doubt.create({
      data: {
        authorId: user.sub,
        organizationId: user.orgId,
        title: dto.title,
        body: dto.body,
        ...(dto.subjectId ? { subjectId: dto.subjectId } : {}),
        ...(dto.topicId ? { topicId: dto.topicId } : {}),
      },
    })
  }

  /** Feed of doubts, filterable by subject/topic/mine/unanswered. */
  async list(
    user: JwtPayload,
    opts: { subjectId?: string; topicId?: string; mine?: boolean; unanswered?: boolean },
  ) {
    const where: Prisma.DoubtWhereInput = {
      ...(user.orgId
        ? { OR: [{ organizationId: user.orgId }, { organizationId: null }] }
        : {}),
      ...(opts.subjectId ? { subjectId: opts.subjectId } : {}),
      ...(opts.topicId ? { topicId: opts.topicId } : {}),
      ...(opts.mine ? { authorId: user.sub } : {}),
      ...(opts.unanswered ? { answerCount: 0 } : {}),
    }
    const doubts = await this.prisma.doubt.findMany({
      where,
      orderBy: [{ isResolved: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: { author: { select: { id: true, name: true } } },
    })
    // resolve subject names in one pass
    const subjectIds = [...new Set(doubts.map((d) => d.subjectId).filter(Boolean))]
    const subjects = subjectIds.length
      ? await this.prisma.subject.findMany({
          where: { id: { in: subjectIds as string[] } },
          select: { id: true, name: true },
        })
      : []
    const subjectName = new Map(subjects.map((s) => [s.id, s.name]))
    return doubts.map((d) => ({
      id: d.id,
      title: d.title,
      body: d.body,
      author: d.author,
      subject: d.subjectId ? (subjectName.get(d.subjectId) ?? null) : null,
      isResolved: d.isResolved,
      upvotes: d.upvotes,
      answerCount: d.answerCount,
      createdAt: d.createdAt,
    }))
  }

  async detail(user: JwtPayload, doubtId: string) {
    const doubt = await this.prisma.doubt.findUnique({
      where: { id: doubtId },
      include: {
        author: { select: { id: true, name: true } },
        answers: {
          orderBy: [{ isAccepted: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
          include: { author: { select: { id: true, name: true } } },
        },
      },
    })
    if (!doubt) throw new NotFoundException('Doubt not found')

    const votes = await this.prisma.doubtVote.findMany({
      where: {
        userId: user.sub,
        OR: [
          { doubtId },
          { answerId: { in: doubt.answers.map((a) => a.id) } },
        ],
      },
    })
    const votedDoubt = votes.some((v) => v.doubtId === doubtId)
    const votedAnswer = new Set(votes.map((v) => v.answerId).filter(Boolean))

    return {
      id: doubt.id,
      title: doubt.title,
      body: doubt.body,
      author: doubt.author,
      isResolved: doubt.isResolved,
      upvotes: doubt.upvotes,
      isAuthor: doubt.authorId === user.sub,
      youVoted: votedDoubt,
      answers: doubt.answers.map((a) => ({
        id: a.id,
        body: a.body,
        author: a.author,
        isAccepted: a.isAccepted,
        upvotes: a.upvotes,
        youVoted: votedAnswer.has(a.id),
        createdAt: a.createdAt,
      })),
    }
  }

  async answer(user: JwtPayload, doubtId: string, dto: AnswerDoubtDto) {
    const doubt = await this.prisma.doubt.findUnique({ where: { id: doubtId } })
    if (!doubt) throw new NotFoundException('Doubt not found')
    await this.screen(user, dto.body)
    const [answer] = await this.prisma.$transaction([
      this.prisma.doubtAnswer.create({
        data: { doubtId, authorId: user.sub, body: dto.body },
        include: { author: { select: { id: true, name: true } } },
      }),
      this.prisma.doubt.update({
        where: { id: doubtId },
        data: { answerCount: { increment: 1 } },
      }),
    ])
    return answer
  }

  /** Toggle an upvote on a doubt or an answer (one per user per target). */
  async voteDoubt(user: JwtPayload, doubtId: string) {
    return this.toggleVote({ userId: user.sub, doubtId })
  }
  async voteAnswer(user: JwtPayload, answerId: string) {
    return this.toggleVote({ userId: user.sub, answerId })
  }

  private async toggleVote(target: { userId: string; doubtId?: string; answerId?: string }) {
    const where = target.doubtId
      ? { userId_doubtId: { userId: target.userId, doubtId: target.doubtId } }
      : { userId_answerId: { userId: target.userId, answerId: target.answerId! } }
    const existing = await this.prisma.doubtVote.findUnique({ where })
    const delta = existing ? -1 : 1
    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.doubtVote.delete({ where: { id: existing.id } })
      } else {
        await tx.doubtVote.create({
          data: {
            userId: target.userId,
            ...(target.doubtId ? { doubtId: target.doubtId } : {}),
            ...(target.answerId ? { answerId: target.answerId } : {}),
          },
        })
      }
      if (target.doubtId) {
        await tx.doubt.update({
          where: { id: target.doubtId },
          data: { upvotes: { increment: delta } },
        })
      } else {
        await tx.doubtAnswer.update({
          where: { id: target.answerId },
          data: { upvotes: { increment: delta } },
        })
      }
    })
    return { voted: !existing }
  }

  /** The doubt's author marks an answer as the accepted solution. */
  async accept(user: JwtPayload, answerId: string) {
    const answer = await this.prisma.doubtAnswer.findUnique({
      where: { id: answerId },
      include: { doubt: true },
    })
    if (!answer) throw new NotFoundException('Answer not found')
    if (answer.doubt.authorId !== user.sub) {
      throw new ForbiddenException('Only the person who asked can accept an answer')
    }
    await this.prisma.$transaction([
      this.prisma.doubtAnswer.updateMany({
        where: { doubtId: answer.doubtId },
        data: { isAccepted: false },
      }),
      this.prisma.doubtAnswer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      }),
      this.prisma.doubt.update({
        where: { id: answer.doubtId },
        data: { isResolved: true },
      }),
    ])
    return { success: true }
  }
}
