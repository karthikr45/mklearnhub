'use client'

import { useQuery } from '@tanstack/react-query'
import { Flame, Medal, Star } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Entry {
  rank: number
  name: string
  xp: number
  isYou: boolean
}
interface Board {
  total: number
  you: { rank: number; xp: number } | null
  entries: Entry[]
}
interface Badge {
  key: string
  name: string
  description: string
  icon: string
  earned: boolean
}
interface Me {
  xp: number
  level: number
  currentStreak: number
  longestStreak: number
  quizzes: number
  correct: number
  badges: Badge[]
}

const MEDAL = ['text-amber-500', 'text-slate-400', 'text-orange-700']

export default function LeaderboardPage() {
  const { data: board } = useQuery({
    queryKey: ['leaderboard-full'],
    queryFn: async () => (await api.get<Board>('/gamification/leaderboard')).data,
  })
  const { data: me } = useQuery({
    queryKey: ['gamification-me'],
    queryFn: async () => (await api.get<Me>('/gamification/me')).data,
  })

  return (
    <div>
      <PageHeader
        title="Leaderboard & Achievements"
        description="Earn XP by practising and helping classmates."
      />

      {me && (
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Level" value={`L${me.level}`} icon={<Star className="h-4 w-4 text-amber-500" />} />
          <Stat label="XP" value={me.xp} icon={<Star className="h-4 w-4 text-amber-500" />} />
          <Stat label="Current streak" value={`${me.currentStreak}d`} icon={<Flame className="h-4 w-4 text-orange-500" />} />
          <Stat label="Best streak" value={`${me.longestStreak}d`} icon={<Flame className="h-4 w-4 text-orange-500" />} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Leaderboard */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">School leaderboard</h2>
          <div className="space-y-1.5">
            {board?.entries.map((e) => (
              <div
                key={e.rank}
                className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${
                  e.isYou ? 'border-primary bg-primary/5' : 'bg-card'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`inline-flex w-6 justify-center font-bold ${
                      e.rank <= 3 ? MEDAL[e.rank - 1] : 'text-muted-foreground'
                    }`}
                  >
                    {e.rank <= 3 ? <Medal className="h-4 w-4" /> : e.rank}
                  </span>
                  <span className="text-sm font-medium">{e.name}</span>
                  {e.isYou && <span className="text-xs text-primary">(you)</span>}
                </span>
                <span className="text-sm font-semibold">{e.xp} XP</span>
              </div>
            ))}
            {(!board || board.entries.length === 0) && (
              <p className="text-sm text-muted-foreground">No rankings yet.</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">Badges</h2>
          <div className="grid grid-cols-2 gap-3">
            {me?.badges.map((b) => (
              <div
                key={b.key}
                className={`rounded-lg border p-4 text-center ${
                  b.earned ? 'bg-card' : 'bg-muted/30 opacity-60'
                }`}
              >
                <div className={`text-3xl ${b.earned ? '' : 'grayscale'}`}>{b.icon}</div>
                <p className="mt-2 text-sm font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-1.5">{icon}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
