'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Globe, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Portal {
  id: string
  name: string
  slug: string
  isPublic: boolean
  type: string
  organization?: { slug: string }
}

function publicUrl(p: Portal): string {
  return p.organization
    ? `/portal/${p.organization.slug}/${p.slug}`
    : `/p/${p.id}`
}

export default function PortalsPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')

  const { data: portals, isLoading } = useQuery({
    queryKey: ['portals'],
    queryFn: async () => {
      const { data } = await api.get<Portal[]>('/portals')
      return data
    },
  })

  const create = useMutation({
    mutationFn: async (portalName: string) => {
      const { data } = await api.post<Portal>('/portals', { name: portalName })
      return data
    },
    onSuccess: () => {
      setName('')
      qc.invalidateQueries({ queryKey: ['portals'] })
      toast.success('Portal created')
    },
    onError: () => toast.error('Could not create portal (org admin only)'),
  })

  return (
    <div>
      <PageHeader
        title="Portals"
        description="Build branded public pages with the drag-and-drop editor."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) create.mutate(name.trim())
        }}
        className="mb-6 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New portal name (e.g. Help Center)"
          className="w-full max-w-sm rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Create
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !portals || portals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No portals yet</p>
          <p className="text-sm text-muted-foreground">
            Create one above, then open the builder.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((p) => (
            <div key={p.id} className="rounded-lg border bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    p.isPublic
                      ? 'bg-green-100 text-green-700'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {p.isPublic ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">{p.type}</p>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href={`/dashboard/portals/${p.id}`}
                  className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground"
                >
                  Open builder
                </Link>
                {p.isPublic ? (
                  <a
                    href={publicUrl(p)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
