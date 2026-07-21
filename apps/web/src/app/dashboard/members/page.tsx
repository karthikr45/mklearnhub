'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Copy, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Member {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface InviteResponse {
  inviteId: string
  token: string
}

const INVITE_ROLES = [
  'INSTRUCTOR',
  'LEARNER',
  'STUDENT',
  'PARENT',
  'ORG_ADMIN',
] as const

export default function MembersPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)

  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<(typeof INVITE_ROLES)[number]>('LEARNER')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: async () => {
      const { data } = await api.get<{ items: Member[]; total: number }>(
        `/organizations/${orgId}/members`,
      )
      return data
    },
    enabled: Boolean(orgId),
  })

  const invite = useMutation({
    mutationFn: async (input: { email: string; role: string }) => {
      const { data } = await api.post<InviteResponse>(
        `/organizations/${orgId}/invites`,
        input,
      )
      return data
    },
    onSuccess: (res) => {
      setInviteLink(`${window.location.origin}/register?invite=${res.token}`)
      setCopied(false)
    },
    onError: () => toast.error('Could not create invite'),
  })

  function openModal() {
    setEmail('')
    setRole('LEARNER')
    setInviteLink(null)
    setCopied(false)
    setOpen(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    invite.mutate({ email, role })
  }

  async function copyLink() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div>
      <PageHeader
        title="Members"
        description="People in your organization."
        action={
          <button
            onClick={openModal}
            disabled={!orgId}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" /> Invite
          </button>
        }
      />

      {!orgId ? (
        <p className="text-sm text-muted-foreground">
          You are not part of an organization yet.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {m.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md card-elevated p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invite a member</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteLink ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Send this link to the person you&apos;re inviting.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyLink}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copy link
                  </button>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="person@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as (typeof INVITE_ROLES)[number])
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {INVITE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={invite.isPending}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {invite.isPending ? 'Creating…' : 'Create invite'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
