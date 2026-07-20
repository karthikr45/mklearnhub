'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { CheckCircle2, HelpCircle, MessageCircle, Plus, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Doubt {
  id: string
  title: string
  body: string
  author: { id: string; name: string }
  subject: string | null
  isResolved: boolean
  upvotes: number
  answerCount: number
  createdAt: string
}

type Filter = 'all' | 'unanswered' | 'mine'

export default function DoubtsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')
  const [asking, setAsking] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })

  const { data: doubts, isLoading } = useQuery({
    queryKey: ['doubts', filter],
    queryFn: async () => {
      const params =
        filter === 'unanswered'
          ? '?unanswered=true'
          : filter === 'mine'
            ? '?mine=true'
            : ''
      return (await api.get<Doubt[]>(`/doubts${params}`)).data
    },
  })

  const ask = useMutation({
    mutationFn: async () => (await api.post('/doubts', form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doubts'] })
      setAsking(false)
      setForm({ title: '', body: '' })
      toast.success('Your doubt has been posted')
    },
    onError: (err) => {
      const msg =
        err instanceof AxiosError
          ? ((err.response?.data as { message?: string })?.message ??
            'Could not post')
          : 'Could not post'
      toast.error(msg)
    },
  })

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader
          title="Doubts & Q&A"
          description="Ask your classmates and teachers — every post is kept safe."
        />
        <button
          onClick={() => setAsking((v) => !v)}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Ask a doubt
        </button>
      </div>

      {asking && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Your question in one line (e.g. How to find HCF using Euclid's lemma?)"
            className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={3}
            placeholder="Add details so others can help…"
            className="mb-3 w-full resize-none rounded-md border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => ask.mutate()}
              disabled={form.title.trim().length < 5 || form.body.trim().length < 5 || ask.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {ask.isPending ? 'Posting…' : 'Post doubt'}
            </button>
            <button onClick={() => setAsking(false)} className="rounded-md border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {(['all', 'unanswered', 'mine'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
              filter === f ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !doubts || doubts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <HelpCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No doubts here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to ask.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/doubts/${d.id}`}
              className="block rounded-lg border bg-card p-4 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{d.title}</h3>
                {d.isResolved && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Resolved
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.body}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{d.author.name}</span>
                {d.subject && <span className="rounded bg-secondary px-1.5 py-0.5">{d.subject}</span>}
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" /> {d.upvotes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {d.answerCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
