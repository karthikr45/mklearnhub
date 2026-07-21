'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, KeyRound, Loader2, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Batch {
  id: string
  name: string
  grade?: string | null
  section?: string | null
  joinCode?: string | null
  isActive: boolean
  _count?: { students?: number }
  branch?: { name?: string } | null
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-dashed bg-muted/40 px-2 py-1 font-mono text-xs hover:bg-accent"
      title="Copy class code"
    >
      <KeyRound className="h-3 w-3 text-primary" />
      {code}
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 opacity-60" />}
    </button>
  )
}

export default function BatchesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', grade: '', section: '', maxStudents: '' })

  const { data: batches, isLoading } = useQuery({
    queryKey: ['school-batches'],
    queryFn: async () => (await api.get<Batch[]>('/school/batches')).data,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { name: form.name.trim() }
      if (form.grade.trim()) body.grade = form.grade.trim()
      if (form.section.trim()) body.section = form.section.trim()
      const parsed = Number(form.maxStudents)
      if (form.maxStudents.trim() && Number.isFinite(parsed) && parsed > 0) {
        body.maxStudents = parsed
      }
      return (await api.post<Batch>('/school/batches', body)).data
    },
    onSuccess: (batch) => {
      toast.success(`Class created — share code ${batch.joinCode}`)
      setForm({ name: '', grade: '', section: '', maxStudents: '' })
      setShowForm(false)
      void queryClient.invalidateQueries({ queryKey: ['school-batches'] })
    },
    onError: () => toast.error('Could not create class'),
  })

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Create classes and share their join code so students can register."
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New class
          </button>
        }
      />

      {showForm && (
        <div className="mb-6 card-elevated p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Class name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Grade 10 — Section A"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Grade</label>
                <input
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  placeholder="Class 10"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Section</label>
                <input
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="A"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            A unique join code is generated automatically — you’ll share it with students.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => (form.name.trim() ? createMutation.mutate() : toast.error('Class name is required'))}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create class
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !batches || batches.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No classes yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first class — you’ll get a join code to give students.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Link
              key={batch.id}
              href={`/dashboard/school/batches/${batch.id}`}
              className="card-elevated card-elevated-hover p-5"
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
              {(batch.grade || batch.section) && (
                <p className="text-xs text-muted-foreground">
                  {batch.grade}
                  {batch.section ? ` · Section ${batch.section}` : ''}
                </p>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {batch._count?.students ?? 0} students
              </p>
              {batch.joinCode && (
                <div className="mt-3">
                  <CopyCode code={batch.joinCode} />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
