'use client'

import axios from 'axios'
import { ArrowLeft, ArrowRight, Check, School } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'

interface JoinPreview {
  valid: boolean
  schoolName?: string
  city?: string | null
  state?: string | null
  board?: string | null
  className?: string
  grade?: string | null
  section?: string | null
  academicYear?: string | null
}

const BOARD_LABEL: Record<string, string> = {
  TELANGANA_STATE: 'Telangana State Board',
  ANDHRA_PRADESH_STATE: 'Andhra Pradesh State Board',
  CBSE: 'CBSE',
  ICSE: 'ICSE',
  IB: 'IB',
  OTHER: 'Other',
}

export default function StudentRegisterPage() {
  const { registerStudent } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [preview, setPreview] = useState<JoinPreview | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const verifyCode = async () => {
    const c = code.trim()
    if (c.length < 4) return
    setChecking(true)
    try {
      const { data } = await axios.get<JoinPreview>(
        `${api.defaults.baseURL}/directory/join-code/${encodeURIComponent(c)}`,
      )
      if (!data.valid) {
        toast.error('That class join code was not found. Ask your teacher.')
        setPreview(null)
        return
      }
      setPreview(data)
      setStep(2)
    } catch {
      toast.error('Could not verify the code. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    registerStudent.mutate(
      { ...form, joinCode: code.trim() },
      { onError: () => toast.error('Could not create your account') },
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <School className="h-5 w-5 text-primary" />
        </span>
        <h2 className="text-lg font-semibold">Join your school</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 1
            ? 'Enter the class join code your teacher gave you.'
            : 'Confirm your class and create your account.'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <span className={step >= 1 ? 'font-medium text-primary' : 'text-muted-foreground'}>
          1. Class code
        </span>
        <span className="text-muted-foreground">—</span>
        <span className={step >= 2 ? 'font-medium text-primary' : 'text-muted-foreground'}>
          2. Your details
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Class join code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
              placeholder="e.g. TS-10A-DEMO"
              className="w-full rounded-md border px-3 py-2 text-sm uppercase tracking-wide"
            />
          </div>
          <button
            type="button"
            onClick={verifyCode}
            disabled={checking || code.trim().length < 4}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Continue'}
            {!checking && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have a code? Ask your class teacher or school office.
          </p>
        </div>
      )}

      {step === 2 && preview && (
        <form onSubmit={submit} className="space-y-4">
          {/* confirmed class banner */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
            <div className="flex items-center gap-1.5 font-medium">
              <Check className="h-4 w-4 text-primary" /> {preview.schoolName}
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <dt>Class</dt>
              <dd className="text-right text-foreground">
                {preview.grade}
                {preview.section ? ` · ${preview.section}` : ''}
              </dd>
              <dt>Syllabus</dt>
              <dd className="text-right text-foreground">
                {preview.board ? BOARD_LABEL[preview.board] ?? preview.board : '—'}
              </dd>
              <dt>Academic year</dt>
              <dd className="text-right text-foreground">{preview.academicYear ?? '—'}</dd>
              {preview.city && (
                <>
                  <dt>Location</dt>
                  <dd className="text-right text-foreground">{preview.city}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters, with an uppercase, lowercase and number.
            </p>
          </div>

          <button
            type="submit"
            disabled={registerStudent.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {registerStudent.isPending ? 'Creating…' : 'Create my account'}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Use a different code
          </button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Not a student?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Other sign-up options
        </Link>
      </p>
    </div>
  )
}
