'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'

import { MathText } from '@/components/study/MathText'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

interface Option {
  id: string
  text: string
}
interface Question {
  id: string
  text: string
  type: string
  options: Option[]
  topic: string | null
  yourAnswer: unknown
  correctAnswer?: unknown
  explanation?: string | null
  isCorrect: boolean
}
interface TopicStat {
  topic: string
  correct: number
  total: number
  accuracy: number
}
interface Attempt {
  id: string
  assessmentId: string | null
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'
  score: number
  maxScore: number
  correctCount: number
  totalCount: number
  analytics: { byTopic?: TopicStat[] }
  questions: Question[]
}
interface Leaderboard {
  total: number
  you: { rank: number; total: number; percentile: number } | null
  entries: { rank: number; name: string; score: number; maxScore: number; isYou: boolean }[]
}

export default function AttemptPage() {
  const params = useParams<{ attemptId: string }>()
  const attemptId = params.attemptId
  const qc = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [idx, setIdx] = useState(0)

  const { data: attempt, isLoading } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: async () =>
      (await api.get<Attempt>(`/study/attempts/${attemptId}`)).data,
    enabled: Boolean(attemptId),
  })

  const submit = useMutation({
    mutationFn: async () => {
      const responses = Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response,
      }))
      return (await api.post(`/study/attempts/${attemptId}/submit`, { responses }))
        .data as Attempt
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempt', attemptId] })
      qc.invalidateQueries({ queryKey: ['study-history'] })
    },
    onError: () => toast.error('Could not submit — please try again'),
  })

  const submitted = attempt?.status === 'SUBMITTED'
  const answeredCount = Object.keys(answers).length

  if (isLoading || !attempt) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (submitted) return <Results attempt={attempt} />

  const q = attempt.questions[idx]
  if (!q) return null
  const opts = (q.options as Option[]) ?? []

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {idx + 1} of {attempt.questions.length}
        </span>
        <span className="text-xs text-muted-foreground">
          {answeredCount}/{attempt.questions.length} answered
        </span>
      </div>
      <div className="mb-2 h-1.5 rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${((idx + 1) / attempt.questions.length) * 100}%` }}
        />
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6">
        {q.topic && (
          <span className="mb-3 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
            {q.topic}
          </span>
        )}
        <p className="text-lg font-medium"><MathText text={q.text} /></p>
        <div className="mt-5 space-y-2.5">
          {opts.map((o) => {
            const selected = answers[q.id] === o.id
            return (
              <button
                key={o.id}
                onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition ${
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'hover:bg-accent'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase ${
                    selected ? 'border-primary bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {o.id}
                </span>
                <MathText text={o.text} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        {idx < attempt.questions.length - 1 ? (
          <button
            onClick={() => setIdx((i) => i + 1)}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || answeredCount === 0}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submit.isPending ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  )
}

function Results({ attempt }: { attempt: Attempt }) {
  const pct = attempt.maxScore
    ? Math.round((attempt.score / attempt.maxScore) * 100)
    : 0
  const byTopic = useMemo(() => attempt.analytics?.byTopic ?? [], [attempt])

  const { data: board } = useQuery({
    queryKey: ['leaderboard', attempt.assessmentId],
    queryFn: async () =>
      (await api.get<Leaderboard>(`/study/assessments/${attempt.assessmentId}/leaderboard`))
        .data,
    enabled: Boolean(attempt.assessmentId),
  })

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Your score</p>
        <p
          className={`mt-1 text-4xl font-bold ${
            pct >= 60 ? 'text-emerald-600' : pct >= 33 ? 'text-amber-600' : 'text-destructive'
          }`}
        >
          {attempt.score}/{attempt.maxScore}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {attempt.correctCount} of {attempt.totalCount} correct · {pct}%
        </p>
        {board?.you && (
          <div className="mt-4 flex justify-center gap-6 border-t pt-4">
            <div>
              <div className="text-2xl font-bold">#{board.you.rank}</div>
              <div className="text-xs text-muted-foreground">
                of {board.you.total} student{board.you.total === 1 ? '' : 's'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{board.you.percentile}%</div>
              <div className="text-xs text-muted-foreground">percentile</div>
            </div>
          </div>
        )}
      </div>

      {board && board.entries.length > 1 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">Leaderboard</h3>
          <div className="space-y-1.5">
            {board.entries.map((e) => (
              <div
                key={e.rank}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  e.isYou ? 'border-primary bg-primary/5' : 'bg-card'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 font-semibold text-muted-foreground">#{e.rank}</span>
                  {e.name}
                  {e.isYou && <span className="text-xs text-primary">(you)</span>}
                </span>
                <span className="font-medium">
                  {e.score}/{e.maxScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {byTopic.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">By topic</h3>
          <div className="space-y-2">
            {byTopic.map((t) => (
              <div key={t.topic} className="card-elevated p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{t.topic}</span>
                  <span className="text-muted-foreground">
                    {t.correct}/{t.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                  <div
                    className={`h-1.5 rounded-full ${
                      t.accuracy >= 60 ? 'bg-emerald-500' : t.accuracy >= 33 ? 'bg-amber-500' : 'bg-destructive'
                    }`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="mb-2 mt-6 text-sm font-semibold">Review</h3>
      <div className="space-y-3">
        {attempt.questions.map((q, i) => {
          const opts = (q.options as Option[]) ?? []
          const your = q.yourAnswer as string | undefined
          const correct = q.correctAnswer as string | undefined
          return (
            <div key={q.id} className="card-elevated p-4">
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                    q.isCorrect ? 'bg-emerald-500' : 'bg-destructive'
                  }`}
                >
                  {q.isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <p className="text-sm font-medium">
                  {i + 1}. <MathText text={q.text} />
                </p>
              </div>
              <div className="mt-3 space-y-1.5 pl-7">
                {opts.map((o) => {
                  const isCorrect = o.id === correct
                  const isYours = o.id === your
                  return (
                    <div
                      key={o.id}
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : isYours
                            ? 'border-destructive/40 bg-destructive/5'
                            : ''
                      }`}
                    >
                      <span className="font-semibold uppercase">{o.id}.</span> <MathText text={o.text} />
                      {isCorrect && (
                        <span className="ml-2 text-xs font-medium">✓ correct</span>
                      )}
                      {isYours && !isCorrect && (
                        <span className="ml-2 text-xs">your answer</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {q.explanation && (
                <p className="mt-3 rounded-md bg-muted/50 p-3 pl-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Explanation: </span>
                  <MathText text={q.explanation ?? ''} />
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/dashboard/study"
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to Practice
        </Link>
      </div>
    </div>
  )
}
