'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Space {
  id: string
  name: string
  slug: string
  description: string | null
  iconEmoji: string | null
}

// NOTE: routes are declared with slug params ([spaceSlug]) but the API detail
// endpoints are keyed by id. In production the slug would be resolved to an id
// server-side; here we pass the id as the slug segment so everything works.
export default function KnowledgePage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconEmoji, setIconEmoji] = useState('')

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      const { data } = await api.get<Space[]>('/spaces')
      return data
    },
  })

  const createSpace = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Space>('/spaces', {
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(iconEmoji.trim() ? { iconEmoji: iconEmoji.trim() } : {}),
      })
      return data
    },
    onSuccess: () => {
      toast.success('Space created')
      qc.invalidateQueries({ queryKey: ['spaces'] })
      setName('')
      setDescription('')
      setIconEmoji('')
      setShowForm(false)
    },
    onError: () => toast.error('Failed to create space'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    createSpace.mutate()
  }

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Spaces, manuals, and articles."
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New space
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">New space</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-[80px_1fr]">
            <div>
              <label className="mb-1 block text-sm font-medium">Emoji</label>
              <input
                value={iconEmoji}
                onChange={(e) => setIconEmoji(e.target.value)}
                placeholder="📘"
                maxLength={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-center text-lg"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What lives in this space?"
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
              disabled={createSpace.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createSpace.isPending ? 'Creating…' : 'Create space'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !spaces || spaces.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No spaces yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first space to organize your knowledge base.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Link
              key={space.id}
              href={`/dashboard/knowledge/${space.id}`}
              className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 text-3xl">{space.iconEmoji ?? '📘'}</div>
              <h3 className="font-semibold">{space.name}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {space.description ?? 'No description'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
