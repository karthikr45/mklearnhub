import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

type Mastery = 'mastered' | 'familiar' | 'weak' | 'untouched'

function mastery(attempted: number, accuracy: number): Mastery {
  if (attempted === 0) return 'untouched'
  if (accuracy >= 80) return 'mastered'
  if (accuracy >= 50) return 'familiar'
  return 'weak'
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rank + percentile for a fixed assessment. Uses each student's BEST
   * submitted attempt so re-takes don't distort the board.
   */
  async leaderboard(assessmentId: string, userId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { id: true, title: true },
    })
    if (!assessment) throw new NotFoundException('Assessment not found')

    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { assessmentId, status: 'SUBMITTED' },
      select: {
        userId: true,
        score: true,
        maxScore: true,
        durationSecs: true,
        user: { select: { id: true, name: true } },
      },
    })

    // best attempt per user (higher score, then faster)
    const best = new Map<string, (typeof attempts)[number]>()
    for (const a of attempts) {
      const cur = best.get(a.userId)
      if (
        !cur ||
        a.score > cur.score ||
        (a.score === cur.score && (a.durationSecs ?? 1e9) < (cur.durationSecs ?? 1e9))
      ) {
        best.set(a.userId, a)
      }
    }
    const ranked = [...best.values()].sort(
      (x, y) =>
        y.score - x.score || (x.durationSecs ?? 1e9) - (y.durationSecs ?? 1e9),
    )
    const entries = ranked.map((a, i) => ({
      rank: i + 1,
      userId: a.user.id,
      name: a.user.name,
      score: a.score,
      maxScore: a.maxScore,
      isYou: a.user.id === userId,
    }))

    const total = ranked.length
    const meIdx = ranked.findIndex((a) => a.userId === userId)
    const you =
      meIdx >= 0
        ? {
            rank: meIdx + 1,
            total,
            // percentile = % of peers you scored >= to
            percentile:
              total > 1
                ? Math.round(((total - meIdx - 1) / (total - 1)) * 100)
                : 100,
            score: ranked[meIdx]!.score,
            maxScore: ranked[meIdx]!.maxScore,
          }
        : null

    return { assessment, total, entries: entries.slice(0, 20), you }
  }

  /**
   * Per-subject syllabus mastery for a student, derived from every graded
   * response they've submitted (topic-level accuracy → mastery band).
   */
  async syllabus(userId: string, orgId: string | null) {
    const subjects = await this.prisma.subject.findMany({
      where: orgId
        ? { OR: [{ organizationId: orgId }, { organizationId: null }] }
        : { organizationId: null },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            topics: {
              orderBy: { order: 'asc' },
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    const responses = await this.prisma.attemptResponse.findMany({
      where: { attempt: { userId, status: 'SUBMITTED' } },
      select: { isCorrect: true, question: { select: { topicId: true } } },
    })
    const stat = new Map<string, { attempted: number; correct: number }>()
    for (const r of responses) {
      const tid = r.question.topicId
      if (!tid) continue
      const s = stat.get(tid) ?? { attempted: 0, correct: 0 }
      s.attempted++
      if (r.isCorrect) s.correct++
      stat.set(tid, s)
    }

    return subjects.map((subj) => {
      const chapters = subj.chapters.map((ch) => {
        const topics = ch.topics.map((t) => {
          const s = stat.get(t.id) ?? { attempted: 0, correct: 0 }
          const accuracy = s.attempted
            ? Math.round((s.correct / s.attempted) * 100)
            : 0
          return {
            id: t.id,
            name: t.name,
            attempted: s.attempted,
            accuracy,
            mastery: mastery(s.attempted, accuracy),
          }
        })
        const touched = topics.filter((t) => t.attempted > 0).length
        return {
          id: ch.id,
          name: ch.name,
          topicCount: topics.length,
          topicsTouched: touched,
          topics,
        }
      })
      const allTopics = chapters.flatMap((c) => c.topics)
      const mastered = allTopics.filter((t) => t.mastery === 'mastered').length
      return {
        id: subj.id,
        name: subj.name,
        grade: subj.grade,
        color: subj.color,
        totalTopics: allTopics.length,
        masteredTopics: mastered,
        completionPct: allTopics.length
          ? Math.round((mastered / allTopics.length) * 100)
          : 0,
        chapters,
      }
    })
  }
}
