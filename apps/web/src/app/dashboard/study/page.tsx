'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, ClipboardCheck, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'
import { StartButton } from '@/components/study/StartButton'
import { StudyStatsBar } from '@/components/study/StudyStatsBar'
import { api } from '@/lib/api'

interface Subject {
  id: string
  name: string
  grade: string | null
  examTrack: string | null
  color: string | null
  chapterCount: number
  questionCount: number
}
interface Tracks {
  grade: string | null
  tracks: string[]
}
interface AssessmentItem {
  id: string
  title: string
  type: string
  subject: string | null
  durationMins: number | null
  questionCount: number
}
interface Attempt {
  id: string
  title: string
  score: number
  maxScore: number
  correctCount: number
  totalCount: number
  submittedAt: string
}

const TRACK_LABEL: Record<string, string> = {
  BOARD_SSC: 'SSC Board',
  BOARD_INTER: 'Intermediate Board',
  JEE_MAIN: 'JEE Main',
  JEE_ADVANCED: 'JEE Advanced',
  NEET: 'NEET',
  EAPCET_ENGINEERING: 'EAPCET (Engg)',
  EAPCET_AGRI_MEDICAL: 'EAPCET (Med)',
  FOUNDATION: 'Foundation',
}

export default function StudyHubPage() {
  const { data: tracks } = useQuery({
    queryKey: ['my-tracks'],
    queryFn: async () => (await api.get<Tracks>('/study/my-tracks')).data,
  })
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get<Subject[]>('/study/subjects')).data,
  })
  const { data: tests } = useQuery({
    queryKey: ['study-assessments'],
    queryFn: async () => (await api.get<AssessmentItem[]>('/study/assessments')).data,
  })
  const { data: history } = useQuery({
    queryKey: ['study-history'],
    queryFn: async () => (await api.get<Attempt[]>('/study/attempts')).data,
  })

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader
          title="Practice & Prep"
          description="Sharpen every chapter and get exam-ready."
        />
        <Link
          href="/dashboard/study/syllabus"
          className="mt-1 inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <TrendingUp className="h-4 w-4" /> Syllabus progress
        </Link>
      </div>

      <StudyStatsBar />

      {tracks && tracks.tracks.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Preparing for:</span>
          {tracks.tracks.map((t) => (
            <span
              key={t}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {TRACK_LABEL[t] ?? t}
            </span>
          ))}
        </div>
      )}

      {/* Subjects */}
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <BookOpen className="h-4 w-4" /> Subjects
      </h2>
      {!subjects || subjects.length === 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">
          No subjects available yet.
        </p>
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/study/subjects/${s.id}`}
              className="group rounded-lg border bg-card p-5 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: s.color ?? '#6366f1' }}
                >
                  <BookOpen className="h-5 w-5" />
                </span>
                {s.grade && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {s.grade}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold group-hover:text-primary">{s.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.chapterCount} chapters · {s.questionCount} questions
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Tests */}
      {tests && tests.length > 0 && (
        <>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ClipboardCheck className="h-4 w-4" /> Tests &amp; mock exams
          </h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((t) => (
              <div key={t.id} className="rounded-lg border bg-card p-5">
                <h3 className="font-semibold">{t.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.questionCount} questions
                  {t.durationMins ? ` · ${t.durationMins} min` : ''}
                </p>
                <StartButton
                  assessmentId={t.id}
                  label="Start test"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent attempts */}
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <TrendingUp className="h-4 w-4" /> Recent attempts
      </h2>
      {!history || history.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Target className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No attempts yet — pick a subject and start practising.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((h) => {
            const pct = h.maxScore ? Math.round((h.score / h.maxScore) * 100) : 0
            return (
              <Link
                key={h.id}
                href={`/dashboard/study/attempt/${h.id}`}
                className="flex items-center justify-between rounded-lg border bg-card p-3.5 hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.correctCount}/{h.totalCount} correct
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    pct >= 60 ? 'text-emerald-600' : pct >= 33 ? 'text-amber-600' : 'text-destructive'
                  }`}
                >
                  {pct}%
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
