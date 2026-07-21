'use client'

import axios from 'axios'
import { ArrowLeft, ArrowRight, Check, Users } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { TermsCheckbox } from '@/components/auth/TermsCheckbox'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'

interface Preview {
  valid: boolean
  studentName?: string
  schoolName?: string | null
}

function ParentForm() {
  const { registerParent } = useAuth()
  const preset = useSearchParams().get('code') ?? ''
  const [step, setStep] = useState<1 | 2>(1)
  const [code, setCode] = useState(preset)
  const [checking, setChecking] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [terms, setTerms] = useState(false)

  const verify = async (raw: string) => {
    const c = raw.trim()
    if (c.length < 4) return
    setChecking(true)
    try {
      const { data } = await axios.get<Preview>(
        `${api.defaults.baseURL}/auth/parent-invite/${encodeURIComponent(c)}`,
      )
      if (!data.valid) {
        toast.error('That parent invite code was not found.')
        return
      }
      setPreview(data)
      setStep(2)
    } catch {
      toast.error('Could not verify the code.')
    } finally {
      setChecking(false)
    }
  }

  // If a code came in the link, verify it automatically.
  useEffect(() => {
    if (preset) void verify(preset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!terms) {
      toast.error('Please accept the Terms and Privacy Policy')
      return
    }
    registerParent.mutate(
      { ...form, code: code.trim(), termsAccepted: terms },
      { onError: () => toast.error('Could not create your account') },
    )
  }

  return (
    <div className="space-y-5">
      <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="text-center">
        <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </span>
        <h2 className="text-lg font-semibold">Follow your child’s progress</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 1
            ? 'Enter the invite code your child shared with you.'
            : 'Confirm and create your account.'}
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Parent invite code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && verify(code)}
              placeholder="e.g. PC-AB12CD"
              className="w-full rounded-md border px-3 py-2 text-sm uppercase tracking-wide"
            />
          </div>
          <button
            type="button"
            onClick={() => verify(code)}
            disabled={checking || code.trim().length < 4}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Continue'}
            {!checking && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Your child can find their code under “Invite a parent”.
          </p>
        </div>
      )}

      {step === 2 && preview && (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <div className="flex items-center gap-1.5 font-medium">
              <Check className="h-4 w-4 text-primary" /> You’ll be linked to{' '}
              {preview.studentName}
            </div>
            {preview.schoolName && (
              <p className="mt-1 text-xs text-muted-foreground">{preview.schoolName}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Your name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
            <p className="text-xs text-muted-foreground">At least 8 characters, with uppercase, lowercase and a number.</p>
          </div>
          <TermsCheckbox checked={terms} onChange={setTerms} />
          <button
            type="submit"
            disabled={registerParent.isPending || !terms}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {registerParent.isPending ? 'Creating…' : 'Create my account'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ParentRegisterPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading…</p>}>
      <ParentForm />
    </Suspense>
  )
}
