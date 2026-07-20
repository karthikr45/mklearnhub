'use client'

import { useQuery } from '@tanstack/react-query'
import { Flame, Star, Trophy } from 'lucide-react'
import Link from 'next/link'

import { api } from '@/lib/api'

interface Badge {
  key: string
  name: string
  icon: string
  earned: boolean
}
interface Me {
  xp: number
  level: number
  xpIntoLevel: number
  currentStreak: number
  longestStreak: number
  badges: Badge[]
}

export function StudyStatsBar() {
  const { data } = useQuery({
    queryKey: ['gamification-me'],
    queryFn: async () => (await api.get<Me>('/gamification/me')).data,
  })
  if (!data) return null
  const earned = data.badges.filter((b) => b.earned)

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          L{data.level}
        </span>
        <div className="min-w-[8rem]">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Star className="h-3.5 w-3.5 text-amber-500" /> {data.xp} XP
          </div>
          <div className="mt-1 h-1.5 w-32 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${data.xpIntoLevel}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-600">
        <Flame className="h-4 w-4" /> {data.currentStreak}-day streak
      </div>

      <div className="flex items-center gap-1">
        {earned.slice(0, 5).map((b) => (
          <span key={b.key} title={b.name} className="text-lg">
            {b.icon}
          </span>
        ))}
        {earned.length === 0 && (
          <span className="text-xs text-muted-foreground">No badges yet</span>
        )}
      </div>

      <Link
        href="/dashboard/leaderboard"
        className="ml-auto inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
      >
        <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
      </Link>
    </div>
  )
}
