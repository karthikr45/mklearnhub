'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, FileText, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { textToDoc } from '@/lib/tiptap'

interface ArticleListItem {
  id: string
  title: string
  slug: string
  status: string
  excerpt: string | null
  updatedAt: string
}

interface ManualWithArticles {
  id: string
  name: string
  slug: string
  description: string | null
  articles: ArticleListItem[]
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

// [spaceSlug] = space id, [manualSlug] = manual id (see knowledge/page.tsx).
export default function ManualDetailPage() {
  const params = useParams<{ spaceSlug: string; manualSlug: string }>()
  const spaceId = params.spaceSlug
  const manualId = params.manualSlug
  const router = useRouter()
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const { data: manual, isLoading } = useQuery({
    queryKey: ['manual', manualId],
    queryFn: async () => {
      const { data } = await api.get<ManualWithArticles>(
        `/spaces/manuals/${manualId}`,
      )
      return data
    },
    enabled: Boolean(manualId),
  })

  const createArticle = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ArticleListItem>(
        `/spaces/manuals/${manualId}/articles`,
        {
          title: title.trim(),
          content: textToDoc(content),
        },
      )
      return data
    },
    onSuccess: (article) => {
      toast.success('Article created')
      qc.invalidateQueries({ queryKey: ['manual', manualId] })
      router.push(`/dashboard/knowledge/${spaceId}/${manualId}/${article.id}`)
    },
    onError: () => toast.error('Failed to create article'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    createArticle.mutate()
  }

  const articles = manual?.articles ?? []

  return (
    <div>
      <Link
        href={`/dashboard/knowledge/${spaceId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to space
      </Link>

      <PageHeader
        title={isLoading ? 'Loading…' : (manual?.name ?? 'Manual')}
        {...(manual?.description ? { description: manual.description } : {})}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New article
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">New article</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="How to onboard a new member"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article. Separate paragraphs with a blank line."
              rows={8}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createArticle.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createArticle.isPending ? 'Creating…' : 'Create article'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : articles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No articles yet</p>
          <p className="text-sm text-muted-foreground">
            Write your first article for this manual.
          </p>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/dashboard/knowledge/${spaceId}/${manualId}/${article.id}`}
              className="block p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{article.title}</p>
                <StatusBadge status={article.status} />
              </div>
              {article.excerpt && (
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {article.excerpt}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {new Date(article.updatedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
