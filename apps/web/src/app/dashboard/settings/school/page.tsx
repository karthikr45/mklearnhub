'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, School } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Org {
  id: string
  name: string
  board: string | null
  state: string | null
  city: string | null
  listedInDirectory: boolean
}

const STATES = [
  { value: '', label: '—' },
  { value: 'TELANGANA', label: 'Telangana' },
  { value: 'ANDHRA_PRADESH', label: 'Andhra Pradesh' },
]
const BOARDS = [
  { value: '', label: '—' },
  { value: 'TELANGANA_STATE', label: 'Telangana State Board (SSC)' },
  { value: 'ANDHRA_PRADESH_STATE', label: 'Andhra Pradesh State Board (SSC)' },
  { value: 'TELANGANA_INTERMEDIATE', label: 'Telangana Intermediate (BIE TS)' },
  { value: 'ANDHRA_PRADESH_INTERMEDIATE', label: 'Andhra Pradesh Intermediate (BIE AP)' },
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE / ISC' },
  { value: 'IB', label: 'IB' },
  { value: 'NIOS', label: 'NIOS' },
  { value: 'OTHER', label: 'Other' },
]

export default function SchoolProfilePage() {
  const orgId = useAuthStore((s) => s.user?.orgId) ?? null
  const qc = useQueryClient()
  const [form, setForm] = useState({ state: '', board: '', city: '', listedInDirectory: false })

  const { data: org } = useQuery({
    queryKey: ['org', orgId],
    queryFn: async () => (await api.get<Org>(`/organizations/${orgId}`)).data,
    enabled: Boolean(orgId),
  })

  useEffect(() => {
    if (org) {
      setForm({
        state: org.state ?? '',
        board: org.board ?? '',
        city: org.city ?? '',
        listedInDirectory: org.listedInDirectory,
      })
    }
  }, [org])

  const save = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        city: form.city,
        listedInDirectory: form.listedInDirectory,
      }
      if (form.state) body.state = form.state
      if (form.board) body.board = form.board
      return (await api.patch(`/organizations/${orgId}`, body)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', orgId] })
      toast.success('School profile saved')
    },
    onError: () => toast.error('Could not save'),
  })

  return (
    <div className="max-w-xl">
      <Link href="/dashboard/settings" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <PageHeader
        title="School Profile"
        description="Set your board and state, and list your school so students can find it."
      />

      <div className="space-y-5 rounded-lg border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">State</label>
            <select
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Board / syllabus</label>
            <select
              value={form.board}
              onChange={(e) => setForm({ ...form, board: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {BOARDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">City</label>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="e.g. Hyderabad"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-start gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            checked={form.listedInDirectory}
            onChange={(e) => setForm({ ...form, listedInDirectory: e.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <span className="text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <School className="h-4 w-4 text-primary" /> List in the public school directory
            </span>
            <span className="text-muted-foreground">
              Students browsing by state and board can find your school. They still
              need a class join code to enrol.
            </span>
          </span>
        </label>

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  )
}
