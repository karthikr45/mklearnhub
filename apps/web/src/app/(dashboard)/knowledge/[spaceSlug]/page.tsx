'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, FileText, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Manual {
  id: string
  name: string
  slug: string
  description: string | null
}

interface SpaceWithManuals {
  id: string
  name: string
  slug: string
  description: string | null
  iconEmoji: string | null
  manuals: Manual[]
}

// [spaceSlug] carries the space id (see note in knowledge/page.tsx).
export default function SpaceDetailPage() {
  const params = useParams<{ spaceSlug: string }>()
  const spaceId = params.spaceSlug
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: space, isLoading } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: async () => {
      const { data } = await api.get<SpaceWithManuals>(`/spaces/${spaceId}`)
      return data
    },
    enabled: Boolean(spaceId),
  })

  const createManual = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Manual>(`/spaces/${spaceId}/manuals`, {
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      })
      return data
    },
    onSuccess: () => {
      toast.success('Manual created')
      qc.invalidateQueries({ queryKey: ['space', spaceId] })
      setName('')
      setDescription('')
      setShowForm(false)
    },
    onError: () => toast.error('Failed to create manual'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    createManual.mutate()
  }

  const manuals = space?.manuals ?? []

  return (
    <div>
      <Link
        href="/dashboard/knowledge"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Knowledge Base
      </Link>

      <PageHeader
        title={
          isLoading
            ? 'Loading…'
            : `${space?.iconEmoji ?? '📘'} ${space?.name ?? 'Space'}`
        }
        {...(space?.description ? { description: space.description } : {})}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New manual
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">New manual</h2>
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
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Getting started"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this manual cover?"
              rows={2}
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
              disabled={createManual.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createManual.isPending ? 'Creating…' : 'Create manual'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : manuals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No manuals yet</p>
          <p className="text-sm text-muted-foreground">
            Add a manual to start grouping articles.
          </p>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border">
          {manuals.map((manual) => (
            <Link
              key={manual.id}
              href={`/dashboard/knowledge/${spaceId}/${manual.id}`}
              className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">{manual.name}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {manual.description ?? 'No description'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
