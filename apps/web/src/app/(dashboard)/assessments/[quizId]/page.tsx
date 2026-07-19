'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Clock, Loader2, Send } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface QuizOption {
  id: string
  text: string
}

interface QuizQuestion {
  id: string
  type: string
  text: string
  points: number
  order: number
  options: QuizOption[]
}

interface QuizAttempt {
  quizId: string
  title: string
  timeLimitMins?: number | null
  questions: QuizQuestion[]
}

interface AnswerState {
  selectedOptionIds: string[]
  text: string
}

interface SubmitAnswer {
  questionId: string
  selectedOptionIds: string[]
  text?: string
}

function formatTime(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function QuizAttemptPage() {
  const params = useParams<{ quizId: string }>()
  const quizId = params.quizId
  const router = useRouter()

  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [remaining, setRemaining] = useState<number | null>(null)
  const submittedRef = useRef(false)

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz-attempt', quizId],
    queryFn: async () => {
      const { data } = await api.post<QuizAttempt>(
        `/assessments/quizzes/${quizId}/start`,
      )
      return data
    },
    enabled: Boolean(quizId),
    refetchOnWindowFocus: false,
  })

  const questions = useMemo(
    () =>
      quiz
        ? quiz.questions.slice().sort((a, b) => a.order - b.order)
        : [],
    [quiz],
  )

  const submit = useMutation({
    mutationFn: async () => {
      const payload: SubmitAnswer[] = questions.map((q) => {
        const state = answers[q.id]
        const answer: SubmitAnswer = {
          questionId: q.id,
          selectedOptionIds: state?.selectedOptionIds ?? [],
        }
        const text = state?.text?.trim()
        if (text) answer.text = text
        return answer
      })
      const { data } = await api.post(
        `/assessments/quizzes/${quizId}/submit`,
        { answers: payload },
      )
      return data
    },
    onSuccess: (result) => {
      sessionStorage.setItem(
        `quiz-result-${quizId}`,
        JSON.stringify(result),
      )
      router.push(`/dashboard/assessments/${quizId}/results`)
    },
    onError: () => {
      submittedRef.current = false
      toast.error('Failed to submit quiz')
    },
  })

  const doSubmit = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    submit.mutate()
  }

  // Initialise the countdown once the quiz (with a time limit) has loaded.
  useEffect(() => {
    if (quiz?.timeLimitMins && remaining === null) {
      setRemaining(quiz.timeLimitMins * 60)
    }
  }, [quiz, remaining])

  useEffect(() => {
    if (remaining === null) return
    if (remaining <= 0) {
      doSubmit()
      return
    }
    const timer = setTimeout(() => setRemaining((r) => (r ?? 1) - 1), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  function setSingle(questionId: string, optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedOptionIds: [optionId], text: '' },
    }))
  }

  function toggleMulti(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = prev[questionId]?.selectedOptionIds ?? []
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      return {
        ...prev,
        [questionId]: { selectedOptionIds: next, text: '' },
      }
    })
  }

  function setText(questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedOptionIds: [], text: value },
    }))
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (!quiz) {
    return <p className="text-sm text-muted-foreground">Quiz not found.</p>
  }

  return (
    <div>
      <PageHeader
        title={quiz.title}
        description={`${questions.length} question${
          questions.length === 1 ? '' : 's'
        }`}
        action={
          remaining !== null ? (
            <span
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                remaining <= 30 ? 'text-destructive' : ''
              }`}
            >
              <Clock className="h-4 w-4" /> {formatTime(remaining)}
            </span>
          ) : undefined
        }
      />

      <div className="max-w-3xl space-y-4">
        {questions.map((q, idx) => {
          const state = answers[q.id]
          return (
            <div key={q.id} className="rounded-lg border bg-card p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <p className="font-medium">
                  {idx + 1}. {q.text}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {q.points} pt{q.points === 1 ? '' : 's'}
                </span>
              </div>

              {q.type === 'MSQ' ? (
                <div className="space-y-2">
                  {q.options.map((o) => (
                    <label
                      key={o.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={
                          state?.selectedOptionIds.includes(o.id) ?? false
                        }
                        onChange={() => toggleMulti(q.id, o.id)}
                      />
                      {o.text}
                    </label>
                  ))}
                </div>
              ) : q.type === 'MCQ' || q.type === 'TRUE_FALSE' ? (
                <div className="space-y-2">
                  {q.options.map((o) => (
                    <label
                      key={o.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm hover:bg-muted/50"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={
                          state?.selectedOptionIds.includes(o.id) ?? false
                        }
                        onChange={() => setSingle(q.id, o.id)}
                      />
                      {o.text}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={state?.text ?? ''}
                  onChange={(e) => setText(q.id, e.target.value)}
                  rows={q.type === 'ESSAY' ? 6 : 3}
                  placeholder="Your answer…"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}
            </div>
          )
        })}

        <button
          onClick={doSubmit}
          disabled={submit.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {submit.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit quiz
        </button>
      </div>
    </div>
  )
}
