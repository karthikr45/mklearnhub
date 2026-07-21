'use client'

import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface ModEvent {
  id: string
  targetType: 'MESSAGE' | 'RESOURCE'
  status: 'BLOCKED' | 'FLAGGED'
  reasons: string[]
  matched: string[]
  excerpt: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
}

const REASON_LABEL: Record<string, string> = {
  adult: 'Adult content',
  profanity: 'Profanity',
  hate: 'Hate speech',
  violence: 'Violence',
  selfharm: 'Self-harm',
  drugs: 'Drugs / substances',
  grooming: 'Grooming risk',
  'contact-info': 'Contact info shared',
  'disallowed-file-type': 'Disallowed file type',
}

export default function SafetyPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['moderation-log'],
    queryFn: async () =>
      (await api.get<ModEvent[]>('/study-groups/moderation-log')).data,
  })

  const blocked = events?.filter((e) => e.status === 'BLOCKED').length ?? 0
  const flagged = events?.filter((e) => e.status === 'FLAGGED').length ?? 0

  return (
    <div>
      <PageHeader
        title="Student safety"
        description="Content automatically blocked or flagged in student study groups."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-md">
        <div className="card-elevated p-4">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          <div className="mt-2 text-2xl font-bold">{blocked}</div>
          <div className="text-xs text-muted-foreground">Blocked</div>
        </div>
        <div className="card-elevated p-4">
          <ShieldCheck className="h-5 w-5 text-amber-500" />
          <div className="mt-2 text-2xl font-bold">{flagged}</div>
          <div className="text-xs text-muted-foreground">Flagged for review</div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !events || events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
          <p className="font-medium">All clear</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No unsafe content has been detected in your students&apos; groups.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Reason</th>
                <th className="px-4 py-2.5 font-medium">Student</th>
                <th className="px-4 py-2.5 font-medium">Content</th>
                <th className="px-4 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.status === 'BLOCKED'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {e.reasons.map((r) => (
                        <span
                          key={r}
                          className="rounded bg-secondary px-1.5 py-0.5 text-xs"
                        >
                          {REASON_LABEL[r] ?? r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.user.name}</div>
                    <div className="text-xs text-muted-foreground">{e.user.email}</div>
                  </td>
                  <td className="max-w-[16rem] px-4 py-3">
                    <span className="text-muted-foreground">
                      {e.targetType === 'RESOURCE' ? '📎 ' : ''}
                      {e.excerpt ?? '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
