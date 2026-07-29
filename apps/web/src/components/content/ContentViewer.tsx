'use client'

import { useQuery } from '@tanstack/react-query'
import { ExternalLink, X } from 'lucide-react'
import { useState } from 'react'

import { VideoPlayer } from '@/components/courses/VideoPlayer'
import { MathText } from '@/components/study/MathText'
import { api } from '@/lib/api'

interface Option { id: string; text: string }
interface ContentDetail {
  id: string
  title: string
  description?: string | null
  contentType: string
  body?: {
    text?: string
    html?: string
    options?: Option[]
    correctAnswer?: string
    explanation?: string
  } | null
  sourceUrl?: string | null
  deliveryUrl?: string | null
  attributionText?: string | null
}

/** Interactive MCQ rendered from an asset's body. */
function Mcq({ body }: { body: NonNullable<ContentDetail['body']> }) {
  const [picked, setPicked] = useState<string | null>(null)
  const options = body.options ?? []
  return (
    <div>
      {body.text && (
        <p className="mb-3 font-medium">
          <MathText text={body.text} />
        </p>
      )}
      <div className="space-y-2">
        {options.map((o) => {
          const isPicked = picked === o.id
          const isCorrect = body.correctAnswer === o.id
          const show = picked !== null
          return (
            <button
              key={o.id}
              onClick={() => setPicked(o.id)}
              disabled={show}
              className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition disabled:cursor-default ${
                show && isCorrect
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : show && isPicked
                    ? 'border-destructive/40 bg-destructive/5'
                    : 'hover:bg-accent'
              }`}
            >
              <span className="font-semibold uppercase">{o.id}.</span>
              <MathText text={o.text} />
            </button>
          )
        })}
      </div>
      {picked !== null && body.explanation && (
        <p className="mt-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Explanation: </span>
          <MathText text={body.explanation} />
        </p>
      )}
    </div>
  )
}

export function ContentViewer({
  assetId,
  onClose,
}: {
  assetId: string
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['content-view', assetId],
    queryFn: async () =>
      (await api.get<ContentDetail>(`/curriculum/content/${assetId}`)).data,
  })

  const render = () => {
    if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>
    const { contentType, deliveryUrl, body } = data
    if (body?.options?.length) return <Mcq body={body} />
    if (deliveryUrl) {
      if (contentType === 'VIDEO') return <VideoPlayer src={deliveryUrl} />
      if (contentType === 'IMAGE' || contentType === 'DIAGRAM')
        return <img src={deliveryUrl} alt={data.title} className="mx-auto max-h-[70vh] rounded-lg" />
      if (contentType === 'PDF')
        return (
          <div>
            <a
              href={deliveryUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mk-brand-bg mb-3 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              <ExternalLink className="h-4 w-4" /> Open PDF in a new tab
            </a>
            <iframe
              src={deliveryUrl}
              title={data.title}
              className="h-[70vh] w-full rounded-lg border"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              If the preview stays blank, use “Open PDF in a new tab” above — some
              official sources block inline embedding.
            </p>
          </div>
        )
      return (
        <a
          href={deliveryUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mk-brand-bg inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          <ExternalLink className="h-4 w-4" /> Open file
        </a>
      )
    }
    if (body?.text || body?.html)
      return (
        <div className="prose prose-sm max-w-none text-sm leading-relaxed">
          <MathText text={body.text ?? stripTags(body.html ?? '')} />
        </div>
      )
    if (data.sourceUrl)
      return (
        <a href={data.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
          {data.sourceUrl}
        </a>
      )
    return <p className="text-sm text-muted-foreground">No content to display.</p>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{data?.title ?? 'Loading…'}</h2>
            {data?.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{data.description}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        {render()}
        {data?.attributionText && (
          <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
            Source: {data.attributionText}
          </p>
        )}
      </div>
    </div>
  )
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
