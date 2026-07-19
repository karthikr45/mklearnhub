'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Batch {
  id: string
  name: string
  isActive: boolean
  _count?: { students?: number }
  branch?: { name?: string } | null
}

export default function BatchesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [maxStudents, setMaxStudents] = useState('')

  const { data: batches, isLoading } = useQuery({
    queryKey: ['school-batches'],
    queryFn: async () => {
      const { data } = await api.get<Batch[]>('/school/batches')
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: { name: string; maxStudents?: number } = { name: name.trim() }
      const parsed = Number(maxStudents)
      if (maxStudents.trim() && Number.isFinite(parsed) && parsed > 0) {
        body.maxStudents = parsed
      }
      const { data } = await api.post<Batch>('/school/batches', body)
      return data
    },
    onSuccess: () => {
      toast.success('Batch created')
      setName('')
      setMaxStudents('')
      setShowForm(false)
      void queryClient.invalidateQueries({ queryKey: ['school-batches'] })
    },
    onError: () => toast.error('Could not create batch'),
  })

  const submit = () => {
    if (!name.trim()) {
      toast.error('Batch name is required')
      return
    }
    createMutation.mutate()
  }

  return (
    <div>
      <PageHeader
        title="Batches"
        description="Manage class batches."
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New batch
          </button>
        }
      />

      {showForm ? (
        <div className="mb-6 rounded-lg border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Batch name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grade 10 — Section A"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Max students (optional)
              </label>
              <input
                type="number"
                min={1}
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                placeholder="e.g. 30"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={submit}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Create batch
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !batches || batches.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No batches yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first batch to start enrolling students.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              href={`/dashboard/school/batches/${batch.id}`}
              className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold">{batch.name}</h3>
                <span
                  className={
                    batch.isActive
                      ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600'
                      : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                  }
                >
                  {batch.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {batch.branch?.name ? (
                <p className="text-xs text-muted-foreground">
                  {batch.branch.name}
                </p>
              ) : null}
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {batch._count?.students ?? 0} students
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
