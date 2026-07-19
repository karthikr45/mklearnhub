'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Pencil, Send } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { docToText, textToDoc } from '@/lib/tiptap'

interface Article {
  id: string
  title: string
  content: unknown
  excerpt: string | null
  status: string
  tags: string[]
  updatedAt: string
}

function StatusBadge({ status }: { status: string }) {
  const published = status === 'PUBLISHED'
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        published
          ? 'bg-green-500/15 text-green-600'
          : 'bg-secondary text-muted-foreground'
      }`}
    >
      {status}
    </span>
  )
}

// [articleSlug] = article id (see knowledge/page.tsx). Article creation lives
// in the manual page, so 'new' is never routed to here.
export default function ArticleDetailPage() {
  const params = useParams<{
    spaceSlug: string
    manualSlug: string
    articleSlug: string
  }>()
  const spaceId = params.spaceSlug
  const manualId = params.manualSlug
  const articleId = params.articleSlug
  const qc = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const { data } = await api.get<Article>(`/spaces/articles/${articleId}`)
      return data
    },
    enabled: Boolean(articleId),
  })

  const saveArticle = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<Article>(
        `/spaces/articles/${articleId}`,
        {
          title: title.trim(),
          content: textToDoc(content),
        },
      )
      return data
    },
    onSuccess: () => {
      toast.success('Article saved')
      qc.invalidateQueries({ queryKey: ['article', articleId] })
      qc.invalidateQueries({ queryKey: ['manual', manualId] })
      setEditing(false)
    },
    onError: () => toast.error('Failed to save article'),
  })

  const publishArticle = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Article>(
        `/spaces/articles/${articleId}/publish`,
      )
      return data
    },
    onSuccess: () => {
      toast.success('Article published')
      qc.invalidateQueries({ queryKey: ['article', articleId] })
      qc.invalidateQueries({ queryKey: ['manual', manualId] })
    },
    onError: () => toast.error('Failed to publish article'),
  })

  function startEditing() {
    if (!article) return
    setTitle(article.title)
    setContent(docToText(article.content))
    setEditing(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    saveArticle.mutate()
  }

  const paragraphs = article
    ? docToText(article.content)
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : []

  return (
    <div>
      <Link
        href={`/dashboard/knowledge/${spaceId}/${manualId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to manual
      </Link>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !article ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">Article not found</p>
        </div>
      ) : editing ? (
        <form onSubmit={handleSave} className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 font-semibold">Edit article</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveArticle.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saveArticle.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <PageHeader
            title={article.title}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                {article.status === 'DRAFT' && (
                  <button
                    onClick={() => publishArticle.mutate()}
                    disabled={publishArticle.isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {publishArticle.isPending ? 'Publishing…' : 'Publish'}
                  </button>
                )}
              </div>
            }
          />

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <StatusBadge status={article.status} />
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
            <span className="text-xs text-muted-foreground">
              Updated {new Date(article.updatedAt).toLocaleString()}
            </span>
          </div>

          <article className="rounded-lg border bg-card p-6">
            {paragraphs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This article has no content yet.
              </p>
            ) : (
              <div className="space-y-4">
                {paragraphs.map((p, i) => (
                  <p key={i} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </article>
        </>
      )}
    </div>
  )
}
