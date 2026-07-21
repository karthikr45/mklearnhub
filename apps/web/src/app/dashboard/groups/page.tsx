'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessagesSquare, Plus, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Group {
  id: string
  name: string
  description: string | null
  gradeLabel: string | null
  memberCount: number
  isMember: boolean
  createdAt: string
}

export default function GroupsPage() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const { data: groups, isLoading } = useQuery({
    queryKey: ['study-groups'],
    queryFn: async () => (await api.get<Group[]>('/study-groups')).data,
  })

  const createMut = useMutation({
    mutationFn: async () => (await api.post('/study-groups', form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-groups'] })
      setCreating(false)
      setForm({ name: '', description: '' })
      toast.success('Study group created')
    },
    onError: () => toast.error('Could not create group'),
  })

  const joinMut = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/study-groups/${id}/join`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-groups'] }),
    onError: () => toast.error('Could not join group'),
  })

  return (
    <div>
      <PageHeader
        title="Study Groups"
        description="Study together with classmates from your school and year."
      />

      <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-medium">A safe space for students</p>
            <p className="text-muted-foreground">
              Only students from your own school and academic year can join. Chat
              and shared files are automatically checked to keep the group safe,
              and your teachers can review activity.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New group
        </button>
      </div>

      {creating && (
        <div className="mb-6 card-elevated p-4">
          <h3 className="mb-3 text-sm font-semibold">Create a study group</h3>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Group name (e.g. Class 10 Maths Prep)"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this group for? (optional)"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => createMut.mutate()}
                disabled={form.name.trim().length < 2 || createMut.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {createMut.isPending ? 'Creating…' : 'Create'}
              </button>
              <button
                onClick={() => setCreating(false)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !groups || groups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <MessagesSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No study groups yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to create one for your class.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id} className="flex flex-col card-elevated p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{g.name}</h3>
                {g.gradeLabel && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {g.gradeLabel}
                  </span>
                )}
              </div>
              {g.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {g.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {g.memberCount} member
                {g.memberCount === 1 ? '' : 's'}
              </div>
              <div className="mt-4">
                {g.isMember ? (
                  <Link
                    href={`/dashboard/groups/${g.id}`}
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Open
                  </Link>
                ) : (
                  <button
                    onClick={() => joinMut.mutate(g.id)}
                    disabled={joinMut.isPending}
                    className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    Join group
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
