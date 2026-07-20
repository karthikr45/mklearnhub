import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

const XP_PER_CORRECT = 10
const XP_PER_ANSWER = 5
const XP_PER_ACCEPTED = 20
const DAY_MS = 24 * 60 * 60 * 1000

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface BadgeDef {
  key: string
  name: string
  description: string
  icon: string
  earned: (s: Stats) => boolean
}
interface Stats {
  xp: number
  quizzes: number
  correct: number
  answers: number
  accepted: number
  currentStreak: number
  longestStreak: number
}

const BADGES: BadgeDef[] = [
  { key: 'first-steps', name: 'First Steps', description: 'Complete your first practice', icon: '🎯', earned: (s) => s.quizzes >= 1 },
  { key: 'sharp', name: 'Sharp Shooter', description: 'Get 25 correct answers', icon: '🏹', earned: (s) => s.correct >= 25 },
  { key: 'century', name: 'Century', description: 'Earn 100 XP', icon: '💯', earned: (s) => s.xp >= 100 },
  { key: 'on-fire', name: 'On Fire', description: 'Keep a 3-day streak', icon: '🔥', earned: (s) => s.longestStreak >= 3 },
  { key: 'unstoppable', name: 'Unstoppable', description: 'Keep a 7-day streak', icon: '⚡', earned: (s) => s.longestStreak >= 7 },
  { key: 'helper', name: 'Helper', description: 'Answer 3 doubts', icon: '🤝', earned: (s) => s.answers >= 3 },
  { key: 'trusted', name: 'Trusted', description: 'Get an answer accepted', icon: '✅', earned: (s) => s.accepted >= 1 },
]

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  private streaks(dates: Date[]): { current: number; longest: number } {
    const days = new Set(dates.map(dayKey))
    if (days.size === 0) return { current: 0, longest: 0 }

    const today = new Date()
    const todayKey = dayKey(today)
    const yesterdayKey = dayKey(new Date(today.getTime() - DAY_MS))

    // current streak: consecutive days ending today or yesterday
    let current = 0
    let cursor = days.has(todayKey)
      ? today
      : days.has(yesterdayKey)
        ? new Date(today.getTime() - DAY_MS)
        : null
    while (cursor && days.has(dayKey(cursor))) {
      current++
      cursor = new Date(cursor.getTime() - DAY_MS)
    }

    // longest run across all active days
    const sorted = [...days].sort()
    let longest = 1
    let run = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]!).getTime()
      const cur = new Date(sorted[i]!).getTime()
      if (cur - prev === DAY_MS) run++
      else run = 1
      longest = Math.max(longest, run)
    }
    return { current, longest }
  }

  /** A student's own stats, streak and badges. */
  async me(userId: string) {
    const [attempts, answers] = await Promise.all([
      this.prisma.assessmentAttempt.findMany({
        where: { userId, status: 'SUBMITTED' },
        select: { correctCount: true, submittedAt: true },
      }),
      this.prisma.doubtAnswer.findMany({
        where: { authorId: userId },
        select: { isAccepted: true, createdAt: true },
      }),
    ])

    const correct = attempts.reduce((n, a) => n + a.correctCount, 0)
    const accepted = answers.filter((a) => a.isAccepted).length
    const xp = correct * XP_PER_CORRECT + answers.length * XP_PER_ANSWER + accepted * XP_PER_ACCEPTED

    const dates = [
      ...attempts.map((a) => a.submittedAt).filter(Boolean),
      ...answers.map((a) => a.createdAt),
    ] as Date[]
    const { current, longest } = this.streaks(dates)

    const stats: Stats = {
      xp,
      quizzes: attempts.length,
      correct,
      answers: answers.length,
      accepted,
      currentStreak: current,
      longestStreak: longest,
    }

    return {
      xp,
      level: Math.floor(xp / 100) + 1,
      xpIntoLevel: xp % 100,
      currentStreak: current,
      longestStreak: longest,
      quizzes: attempts.length,
      correct,
      answers: answers.length,
      accepted,
      badges: BADGES.map((b) => ({
        key: b.key,
        name: b.name,
        description: b.description,
        icon: b.icon,
        earned: b.earned(stats),
      })),
    }
  }

  /** XP leaderboard within the student's school. */
  async leaderboard(orgId: string | null, userId: string) {
    if (!orgId) return { entries: [], you: null, total: 0 }

    const [attempts, answers, users] = await Promise.all([
      this.prisma.assessmentAttempt.findMany({
        where: { status: 'SUBMITTED', user: { organizationId: orgId } },
        select: { userId: true, correctCount: true },
      }),
      this.prisma.doubtAnswer.findMany({
        where: { author: { organizationId: orgId } },
        select: { authorId: true, isAccepted: true },
      }),
      this.prisma.user.findMany({
        where: { organizationId: orgId, role: 'STUDENT' },
        select: { id: true, name: true },
      }),
    ])

    const xpByUser = new Map<string, number>()
    for (const a of attempts) {
      xpByUser.set(a.userId, (xpByUser.get(a.userId) ?? 0) + a.correctCount * XP_PER_CORRECT)
    }
    for (const a of answers) {
      const add = XP_PER_ANSWER + (a.isAccepted ? XP_PER_ACCEPTED : 0)
      xpByUser.set(a.authorId, (xpByUser.get(a.authorId) ?? 0) + add)
    }

    const ranked = users
      .map((u) => ({ userId: u.id, name: u.name, xp: xpByUser.get(u.id) ?? 0 }))
      .sort((a, b) => b.xp - a.xp)

    const entries = ranked.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      xp: r.xp,
      isYou: r.userId === userId,
    }))
    const meIdx = ranked.findIndex((r) => r.userId === userId)
    return {
      total: ranked.length,
      entries: entries.slice(0, 20),
      you: meIdx >= 0 ? { rank: meIdx + 1, xp: ranked[meIdx]!.xp } : null,
    }
  }
}
