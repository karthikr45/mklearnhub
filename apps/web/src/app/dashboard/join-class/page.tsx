'use client'

import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { ArrowRight, Check, School, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Preview {
  valid: boolean
  schoolName?: string
  grade?: string | null
  section?: string | null
  academicYear?: string | null
}

export default function JoinClassPage() {
  const router = useRouter()
  const { user, setAuth } = useAuthStore()
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)

  const verify = async () => {
    const c = code.trim()
    if (c.length < 4) return
    setChecking(true)
    try {
      const { data } = await axios.get<Preview>(
        `${api.defaults.baseURL}/directory/join-code/${encodeURIComponent(c)}`,
      )
      if (!data.valid) {
        toast.error('That class code was not found. Ask your teacher.')
        setPreview(null)
        return
      }
      setPreview(data)
    } catch {
      toast.error('Could not verify the code.')
    } finally {
      setChecking(false)
    }
  }

  const join = useMutation({
    mutationFn: async () => {
      await api.post('/school/join', { code: code.trim() })
      // Role + school changed → refresh the session so the whole app updates.
      const refreshToken = useAuthStore.getState().refreshToken
      const { data: tokens } = await api.post<{
        accessToken: string
        refreshToken: string
      }>('/auth/refresh', { refreshToken })
      const { data: me } = await api.get('/auth/me')
      return { tokens, me }
    },
    onSuccess: ({ tokens, me }) => {
      setAuth({
        user: me,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })
      toast.success(`You've joined ${preview?.schoolName}!`)
      router.push('/dashboard/my-class')
    },
    onError: () => toast.error('Could not join the class'),
  })

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Join a class"
        description="Enter the class code your teacher shared to join your school and study with classmates."
      />

      <div className="card-elevated p-6">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/5 p-4">
          <span className="mk-brand-bg flex h-10 w-10 items-center justify-center rounded-xl text-white">
            <Users className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            Joining a class unlocks study groups, live quiz battles, doubts and
            your class timetable.
          </p>
        </div>

        <label className="text-sm font-medium">Class join code</label>
        <div className="mt-1 flex gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setPreview(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && verify()}
            placeholder="e.g. TS-10A-DEMO"
            className="flex-1 rounded-lg border px-3 py-2 text-sm uppercase tracking-wide outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={verify}
            disabled={checking || code.trim().length < 4}
            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Check'}
            {!checking && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

        {preview?.valid && (
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 font-medium">
              <School className="h-4 w-4 text-primary" /> {preview.schoolName}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {preview.grade}
              {preview.section ? ` · Section ${preview.section}` : ''} ·{' '}
              {preview.academicYear}
            </p>
            <button
              onClick={() => join.mutate()}
              disabled={join.isPending}
              className="mk-brand-bg mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-500/30 transition hover:opacity-90 disabled:opacity-50"
            >
              {join.isPending ? (
                'Joining…'
              ) : (
                <>
                  <Check className="h-4 w-4" /> Join {preview.schoolName}
                </>
              )}
            </button>
          </div>
        )}

        {user?.role === 'STUDENT' && (
          <p className="mt-4 text-xs text-muted-foreground">
            You&apos;re already in a class — joining another moves you to it.
          </p>
        )}
      </div>
    </div>
  )
}
