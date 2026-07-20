import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { JwtPayload } from '@learnhub/types'
import { Namespace, Server, Socket } from 'socket.io'

import { PrismaService } from '../../prisma/prisma.service'
import { ModerationService } from './moderation.service'

const QUESTION_MS = 15_000
const REVEAL_MS = 3_500

interface SocketData {
  userId: string
  orgId: string | null
  role: string
  name: string
}

interface BattleQuestion {
  id: string
  text: string
  options: unknown
  correct: unknown
}
interface BattleState {
  id: string
  groupId: string
  hostId: string
  title: string
  questions: BattleQuestion[]
  index: number
  scores: Map<string, { name: string; score: number; correct: number }>
  answered: Set<string>
  questionStart: number
  timer?: NodeJS.Timeout
}

/**
 * Real-time study gateway. JWT-authenticated (no spoofable client userId), it
 * powers live group chat + presence and Kahoot-style quiz battles. All chat
 * still passes the child-safety moderation screen before broadcast.
 */
@WebSocketGateway({ namespace: '/study', cors: true })
export class StudyGateway implements OnGatewayConnection {
  private readonly logger = new Logger(StudyGateway.name)
  private readonly battles = new Map<string, BattleState>()

  @WebSocketServer() server!: Server
  /** The '/study' namespace — what clients actually connect to. */
  private io!: Namespace

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly moderation: ModerationService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    this.io = client.nsp
    const d = await this.ensureAuth(client)
    if (!d) client.disconnect()
  }

  /**
   * Authenticate the socket from its handshake JWT, idempotently. Called on
   * connect AND at the start of every handler, because a client can emit a
   * message before the async handleConnection has finished — this closes that
   * race and caches the result on socket.data.
   */
  private async ensureAuth(client: Socket): Promise<SocketData | null> {
    const existing = client.data as Partial<SocketData> | undefined
    if (existing?.userId) return existing as SocketData
    try {
      const token = client.handshake.auth?.token as string | undefined
      if (!token) return null
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      })
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true },
      })
      if (!user) return null
      const data: SocketData = {
        userId: payload.sub,
        orgId: payload.orgId,
        role: payload.role,
        name: user.name,
      }
      client.data = data
      this.io = client.nsp
      return data
    } catch {
      return null
    }
  }

  private async isMember(groupId: string, userId: string): Promise<boolean> {
    const m = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    })
    return Boolean(m)
  }

  private async presence(groupId: string) {
    const room = `group:${groupId}`
    const sockets = await this.io.in(room).fetchSockets()
    const byUser = new Map<string, string>()
    for (const s of sockets) {
      const d = s.data as SocketData
      if (d?.userId) byUser.set(d.userId, d.name)
    }
    this.io.to(room).emit('presence', {
      groupId,
      online: [...byUser.entries()].map(([userId, name]) => ({ userId, name })),
    })
  }

  // ── Group chat + presence ───────────────────────────
  @SubscribeMessage('group:join')
  async joinGroup(client: Socket, payload: { groupId: string }): Promise<void> {
    const d = await this.ensureAuth(client)
    if (!d) return
    if (!(await this.isMember(payload.groupId, d.userId))) {
      client.emit('error:auth', { message: 'Not a member of this group' })
      return
    }
    await client.join(`group:${payload.groupId}`)
    await this.presence(payload.groupId)
  }

  @SubscribeMessage('group:leave')
  async leaveGroup(client: Socket, payload: { groupId: string }): Promise<void> {
    await client.leave(`group:${payload.groupId}`)
    await this.presence(payload.groupId)
  }

  @SubscribeMessage('chat:typing')
  async typing(client: Socket, payload: { groupId: string }): Promise<void> {
    const d = await this.ensureAuth(client)
    if (!d) return
    client
      .to(`group:${payload.groupId}`)
      .emit('chat:typing', { userId: d.userId, name: d.name })
  }

  @SubscribeMessage('chat:send')
  async chatSend(
    client: Socket,
    payload: { groupId: string; body: string },
  ): Promise<void> {
    const d = await this.ensureAuth(client)
    if (!d) return
    if (!(await this.isMember(payload.groupId, d.userId))) return
    const screen = await this.moderation.screenMessage({
      userId: d.userId,
      organizationId: d.orgId,
      body: payload.body,
    })
    if (screen.status === 'BLOCKED') {
      client.emit('chat:blocked', { reasons: screen.reasons })
      return
    }
    const msg = await this.prisma.studyGroupMessage.create({
      data: {
        groupId: payload.groupId,
        userId: d.userId,
        body: payload.body,
        moderationStatus: screen.status,
      },
    })
    this.io.to(`group:${payload.groupId}`).emit('chat:message', {
      id: msg.id,
      body: msg.body,
      createdAt: msg.createdAt,
      user: { id: d.userId, name: d.name },
    })
  }

  // ── Live quiz battles ───────────────────────────────
  @SubscribeMessage('battle:create')
  async battleCreate(
    client: Socket,
    payload: { groupId: string; assessmentId: string },
  ): Promise<void> {
    const d = await this.ensureAuth(client)
    if (!d) return
    if (!(await this.isMember(payload.groupId, d.userId))) return

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: payload.assessmentId },
      include: { items: { orderBy: { order: 'asc' }, include: { question: true } } },
    })
    const questions = (assessment?.items ?? []).map((i) => ({
      id: i.question.id,
      text: i.question.text,
      options: i.question.options,
      correct: i.question.correctAnswer,
    }))
    if (questions.length === 0) {
      client.emit('error:battle', { message: 'That test has no questions' })
      return
    }

    const battle = await this.prisma.quizBattle.create({
      data: {
        groupId: payload.groupId,
        hostId: d.userId,
        title: assessment!.title,
        questionIds: questions.map((q) => q.id),
        status: 'LOBBY',
      },
    })
    const state: BattleState = {
      id: battle.id,
      groupId: payload.groupId,
      hostId: d.userId,
      title: battle.title,
      questions,
      index: -1,
      scores: new Map(),
      answered: new Set(),
      questionStart: 0,
    }
    this.battles.set(battle.id, state)
    await client.join(`battle:${battle.id}`)
    this.joinBattleState(state, d)
    // announce to the whole group so members can hop in
    this.io.to(`group:${payload.groupId}`).emit('battle:announced', {
      battleId: battle.id,
      title: battle.title,
      hostName: d.name,
      questionCount: questions.length,
    })
    client.emit('battle:created', { battleId: battle.id })
    this.emitLobby(state)
  }

  @SubscribeMessage('battle:join')
  async battleJoin(client: Socket, payload: { battleId: string }): Promise<void> {
    const d = await this.ensureAuth(client)
    if (!d) return
    const state = this.battles.get(payload.battleId)
    if (!state) {
      client.emit('error:battle', { message: 'Battle not found or already ended' })
      return
    }
    if (!(await this.isMember(state.groupId, d.userId))) return
    await client.join(`battle:${payload.battleId}`)
    this.joinBattleState(state, d)
    this.emitLobby(state)
  }

  private joinBattleState(state: BattleState, d: SocketData): void {
    if (!state.scores.has(d.userId)) {
      state.scores.set(d.userId, { name: d.name, score: 0, correct: 0 })
    }
  }

  private emitLobby(state: BattleState): void {
    this.io.to(`battle:${state.id}`).emit('battle:lobby', {
      battleId: state.id,
      title: state.title,
      hostId: state.hostId,
      questionCount: state.questions.length,
      participants: [...state.scores.entries()].map(([userId, s]) => ({
        userId,
        name: s.name,
      })),
    })
  }

  @SubscribeMessage('battle:start')
  async battleStart(client: Socket, payload: { battleId: string }): Promise<void> {
    const d = await this.ensureAuth(client)
    if (!d) return
    const state = this.battles.get(payload.battleId)
    if (!state || state.hostId !== d.userId) return
    await this.prisma.quizBattle.update({
      where: { id: state.id },
      data: { status: 'ACTIVE' },
    })
    this.sendQuestion(state)
  }

  private sendQuestion(state: BattleState): void {
    state.index++
    if (state.index >= state.questions.length) {
      void this.finishBattle(state)
      return
    }
    state.answered = new Set()
    state.questionStart = Date.now()
    const q = state.questions[state.index]!
    this.io.to(`battle:${state.id}`).emit('battle:question', {
      index: state.index,
      total: state.questions.length,
      question: { id: q.id, text: q.text, options: q.options },
      durationMs: QUESTION_MS,
    })
    state.timer = setTimeout(() => this.revealAndAdvance(state), QUESTION_MS)
  }

  @SubscribeMessage('battle:answer')
  async battleAnswer(
    client: Socket,
    payload: { battleId: string; answer: unknown },
  ): Promise<void> {
    const d = await this.ensureAuth(client)
    if (!d) return
    const state = this.battles.get(payload.battleId)
    if (!state || state.index < 0) return
    if (state.answered.has(d.userId)) return
    state.answered.add(d.userId)

    const q = state.questions[state.index]!
    const correct = String(payload.answer) === String(q.correct)
    const entry = state.scores.get(d.userId)
    if (entry && correct) {
      const elapsed = Date.now() - state.questionStart
      const speedBonus = Math.max(0, Math.round((1 - elapsed / QUESTION_MS) * 50))
      entry.score += 100 + speedBonus
      entry.correct += 1
    }
    client.emit('battle:answered', { correct })
    // If everyone answered, reveal early.
    if (state.answered.size >= state.scores.size) {
      if (state.timer) clearTimeout(state.timer)
      this.revealAndAdvance(state)
    }
  }

  private revealAndAdvance(state: BattleState): void {
    const q = state.questions[state.index]
    this.io.to(`battle:${state.id}`).emit('battle:reveal', {
      correctAnswer: q?.correct,
      leaderboard: this.leaderboard(state),
    })
    setTimeout(() => this.sendQuestion(state), REVEAL_MS)
  }

  private leaderboard(state: BattleState) {
    return [...state.scores.entries()]
      .map(([userId, s]) => ({ userId, name: s.name, score: s.score, correct: s.correct }))
      .sort((a, b) => b.score - a.score)
  }

  private async finishBattle(state: BattleState): Promise<void> {
    const board = this.leaderboard(state)
    this.io.to(`battle:${state.id}`).emit('battle:final', { leaderboard: board })
    try {
      await this.prisma.quizBattle.update({
        where: { id: state.id },
        data: { status: 'FINISHED', finishedAt: new Date() },
      })
      for (const [userId, s] of state.scores) {
        await this.prisma.battleParticipant.upsert({
          where: { battleId_userId: { battleId: state.id, userId } },
          create: { battleId: state.id, userId, score: s.score, correctCount: s.correct },
          update: { score: s.score, correctCount: s.correct },
        })
      }
    } catch (err) {
      this.logger.error(`Failed to persist battle ${state.id}: ${String(err)}`)
    }
    this.battles.delete(state.id)
  }
}
