'use client'

import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'

interface BreakdownItem {
  questionId: string
  awarded: number
  possible: number
  correct: boolean
}

interface QuizResult {
  score: number
  maxScore: number
  passed: boolean
  breakdown?: BreakdownItem[]
}

export default function QuizResultsPage() {
  const params = useParams<{ quizId: string }>()
  const quizId = params.quizId

  const [result, setResult] = useState<QuizResult | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`quiz-result-${quizId}`)
      if (raw) setResult(JSON.parse(raw) as QuizResult)
    } catch {
      setResult(null)
    }
    setLoaded(true)
  }, [quizId])

  if (!loaded) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (!result) {
    return (
      <div>
        <PageHeader title="Quiz Results" description="Your latest attempt." />
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">No recent attempt</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Take the quiz to see your results here.
          </p>
          <Link
            href={`/dashboard/assessments/${quizId}`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go to quiz
          </Link>
        </div>
      </div>
    )
  }

  const pct = result.maxScore
    ? Math.round((result.score / result.maxScore) * 100)
    : 0

  return (
    <div>
      <PageHeader title="Quiz Results" description="Your latest attempt." />

      <div className="max-w-3xl space-y-6">
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your score</p>
              <p className="text-3xl font-bold">
                {result.score}
                <span className="text-lg font-normal text-muted-foreground">
                  {' '}
                  / {result.maxScore}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{pct}%</p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                result.passed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {result.passed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              {result.passed ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>

        {result.breakdown && result.breakdown.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <div className="border-b bg-muted/50 px-4 py-3 text-sm font-semibold">
              Question breakdown
            </div>
            <ul>
              {result.breakdown.map((item, idx) => (
                <li
                  key={item.questionId}
                  className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="flex items-center gap-3">
                    {item.correct ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Question {idx + 1}
                  </span>
                  <span className="text-muted-foreground">
                    {item.awarded} / {item.possible}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href={`/dashboard/assessments/${quizId}`}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" /> Retake
        </Link>
      </div>
    </div>
  )
}
