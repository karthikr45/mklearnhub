'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Topic {
  id: string
  name: string
  attempted: number
  accuracy: number
  mastery: 'mastered' | 'familiar' | 'weak' | 'untouched'
}
interface Chapter {
  id: string
  name: string
  topicCount: number
  topicsTouched: number
  topics: Topic[]
}
interface SubjectProgress {
  id: string
  name: string
  grade: string | null
  color: string | null
  totalTopics: number
  masteredTopics: number
  completionPct: number
  chapters: Chapter[]
}

const MASTERY: Record<Topic['mastery'], { label: string; cls: string }> = {
  mastered: { label: 'Mastered', cls: 'bg-emerald-500' },
  familiar: { label: 'Familiar', cls: 'bg-amber-500' },
  weak: { label: 'Needs work', cls: 'bg-destructive' },
  untouched: { label: 'Not started', cls: 'bg-muted-foreground/30' },
}

export default function SyllabusPage() {
  const { data: subjects, isLoading } = useQuery({
    queryKey: ['syllabus'],
    queryFn: async () =>
      (await api.get<SubjectProgress[]>('/study/syllabus')).data,
  })

  return (
    <div>
      <Link
        href="/dashboard/study"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Practice
      </Link>
      <PageHeader
        title="Syllabus progress"
        description="Your mastery across every topic, based on your practice."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          {subjects?.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: s.color ?? '#6366f1' }}
                  />
                  <h3 className="font-semibold">{s.name}</h3>
                  {s.grade && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {s.grade}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {s.masteredTopics}/{s.totalTopics} mastered · {s.completionPct}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${s.completionPct}%` }}
                />
              </div>

              <div className="mt-4 space-y-3">
                {s.chapters.map((c) => (
                  <div key={c.id}>
                    <p className="mb-1.5 text-sm font-medium">{c.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.topics.map((t) => (
                        <span
                          key={t.id}
                          title={`${MASTERY[t.mastery].label}${t.attempted ? ` · ${t.accuracy}% over ${t.attempted}` : ''}`}
                          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${MASTERY[t.mastery].cls}`}
                          />
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.values(MASTERY).map((m) => (
          <span key={m.label} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${m.cls}`} /> {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}
