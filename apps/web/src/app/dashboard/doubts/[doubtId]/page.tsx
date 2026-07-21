'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { ArrowLeft, Check, CheckCircle2, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

interface Answer {
  id: string
  body: string
  author: { id: string; name: string }
  isAccepted: boolean
  upvotes: number
  youVoted: boolean
  createdAt: string
}
interface DoubtDetail {
  id: string
  title: string
  body: string
  author: { id: string; name: string }
  isResolved: boolean
  upvotes: number
  isAuthor: boolean
  youVoted: boolean
  answers: Answer[]
}

function errMsg(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return (err.response?.data as { message?: string })?.message ?? fallback
  }
  return fallback
}

export default function DoubtDetailPage() {
  const params = useParams<{ doubtId: string }>()
  const doubtId = params.doubtId
  const qc = useQueryClient()
  const [answer, setAnswer] = useState('')

  const { data: doubt, isLoading } = useQuery({
    queryKey: ['doubt', doubtId],
    queryFn: async () => (await api.get<DoubtDetail>(`/doubts/${doubtId}`)).data,
    enabled: Boolean(doubtId),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['doubt', doubtId] })

  const postAnswer = useMutation({
    mutationFn: async () =>
      (await api.post(`/doubts/${doubtId}/answers`, { body: answer })).data,
    onSuccess: () => {
      setAnswer('')
      invalidate()
    },
    onError: (err) => toast.error(errMsg(err, 'Could not post your answer')),
  })
  const voteDoubt = useMutation({
    mutationFn: async () => (await api.post(`/doubts/${doubtId}/vote`)).data,
    onSuccess: invalidate,
  })
  const voteAnswer = useMutation({
    mutationFn: async (answerId: string) =>
      (await api.post(`/doubts/answers/${answerId}/vote`)).data,
    onSuccess: invalidate,
  })
  const accept = useMutation({
    mutationFn: async (answerId: string) =>
      (await api.post(`/doubts/answers/${answerId}/accept`)).data,
    onSuccess: invalidate,
  })

  if (isLoading || !doubt) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/doubts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All doubts
      </Link>

      <div className="card-elevated p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold">{doubt.title}</h1>
          {doubt.isResolved && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Resolved
            </span>
          )}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{doubt.body}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span>Asked by {doubt.author.name}</span>
          <button
            onClick={() => voteDoubt.mutate()}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
              doubt.youVoted ? 'border-primary text-primary' : ''
            }`}
          >
            <ThumbsUp className="h-3 w-3" /> {doubt.upvotes}
          </button>
        </div>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold">
        {doubt.answers.length} answer{doubt.answers.length === 1 ? '' : 's'}
      </h2>
      <div className="space-y-3">
        {doubt.answers.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg border p-4 ${
              a.isAccepted ? 'border-emerald-300 bg-emerald-50/50' : 'bg-card'
            }`}
          >
            {a.isAccepted && (
              <div className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Accepted answer
              </div>
            )}
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{a.body}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{a.author.name}</span>
              <button
                onClick={() => voteAnswer.mutate(a.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  a.youVoted ? 'border-primary text-primary' : ''
                }`}
              >
                <ThumbsUp className="h-3 w-3" /> {a.upvotes}
              </button>
              {doubt.isAuthor && !a.isAccepted && (
                <button
                  onClick={() => accept.mutate(a.id)}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 hover:bg-accent"
                >
                  <Check className="h-3 w-3" /> Accept
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 card-elevated p-4">
        <h3 className="mb-2 text-sm font-semibold">Your answer</h3>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={3}
          placeholder="Help your classmate out…"
          className="mb-3 w-full resize-none rounded-md border px-3 py-2 text-sm"
        />
        <button
          onClick={() => postAnswer.mutate()}
          disabled={answer.trim().length < 2 || postAnswer.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {postAnswer.isPending ? 'Posting…' : 'Post answer'}
        </button>
      </div>
    </div>
  )
}
