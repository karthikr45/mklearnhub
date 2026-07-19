'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Loader2,
  UserPlus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Student {
  user: { id: string; name: string; email: string }
}

interface Batch {
  id: string
  name: string
  isActive: boolean
  students?: Student[]
  academicYear?: { name?: string } | null
}

interface Member {
  id: string
  name: string
  email: string
  role: string
}

export default function BatchDetailPage() {
  const params = useParams<{ batchId: string }>()
  const batchId = params.batchId
  const orgId = useAuthStore((s) => s.user?.orgId) ?? null
  const queryClient = useQueryClient()

  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      const { data } = await api.get<Batch>(`/school/batches/${batchId}`)
      return data
    },
    enabled: Boolean(batchId),
  })

  const { data: members } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      const { data } = await api.get<{ items: Member[]; total: number }>(
        `/organizations/${orgId}/members`,
      )
      return data.items
    },
    enabled: Boolean(orgId) && showAdd,
  })

  const enrolledIds = useMemo(
    () => new Set((batch?.students ?? []).map((s) => s.user.id)),
    [batch],
  )
  const available = useMemo(
    () => (members ?? []).filter((m) => !enrolledIds.has(m.id)),
    [members, enrolledIds],
  )

  const addMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/school/batches/${batchId}/students`, {
        userIds: Array.from(selected),
      })
    },
    onSuccess: () => {
      toast.success('Students added')
      setSelected(new Set())
      setShowAdd(false)
      void queryClient.invalidateQueries({ queryKey: ['batch', batchId] })
    },
    onError: () => toast.error('Could not add students'),
  })

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const students = batch?.students ?? []

  const tabs = [
    {
      href: `/dashboard/school/batches/${batchId}/attendance`,
      label: 'Attendance',
      icon: ClipboardCheck,
    },
    {
      href: `/dashboard/school/batches/${batchId}/timetable`,
      label: 'Timetable',
      icon: CalendarDays,
    },
    {
      href: `/dashboard/school/batches/${batchId}/grades`,
      label: 'Grades',
      icon: BookOpen,
    },
  ]

  return (
    <div>
      <PageHeader
        title={batch?.name ?? 'Batch'}
        description={
          batch?.academicYear?.name
            ? `Academic year: ${batch.academicYear.name}`
            : 'Batch details'
        }
        action={
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" /> Add students
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {showAdd ? (
        <div className="mb-6 rounded-lg border bg-card p-5">
          <h3 className="mb-3 font-semibold">Add students to this batch</h3>
          {!orgId ? (
            <p className="text-sm text-muted-foreground">
              No organization available.
            </p>
          ) : available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members available to add.
            </p>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto rounded-md border">
                {available.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggle(m.id)}
                      className="h-4 w-4 rounded border"
                    />
                    <span className="font-medium">{m.name}</span>
                    <span className="text-muted-foreground">{m.email}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={selected.size === 0 || addMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Add {selected.size > 0 ? `(${selected.size})` : ''}
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-5 py-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">
            Students {students.length > 0 ? `(${students.length})` : ''}
          </h3>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : students.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No students enrolled yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.user.id} className="border-t">
                  <td className="px-5 py-2">{s.user.name}</td>
                  <td className="px-5 py-2 text-muted-foreground">
                    {s.user.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
