'use client'

import { useMutation } from '@tanstack/react-query'
import { Check, Copy, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

/**
 * Lets a student generate a parent-link code and share a ready-made sign-up
 * link, so a parent registers already linked to this child.
 */
export function InviteParentCard() {
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const gen = useMutation({
    mutationFn: async () =>
      (await api.post<{ code: string }>('/auth/me/parent-code')).data,
    onSuccess: (d) => setCode(d.code),
    onError: () => toast.error('Could not create an invite code'),
  })

  const link =
    code && typeof window !== 'undefined'
      ? `${window.location.origin}/register/parent?code=${code}`
      : ''

  const copy = async () => {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Invite a parent</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Share this link so a parent can sign up and follow your progress.
      </p>
      {!code ? (
        <button
          onClick={() => gen.mutate()}
          disabled={gen.isPending}
          className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {gen.isPending ? 'Generating…' : 'Get parent invite link'}
        </button>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs"
          />
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </section>
  )
}
