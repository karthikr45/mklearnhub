'use client'

import type { AuthUser } from '@learnhub/types'
import {
  ArrowLeft,
  BookOpen,
  Check,
  GraduationCap,
  Rocket,
  Sparkles,
  Target,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

type Track = 'SCHOOL' | 'INTERMEDIATE' | 'ENGINEERING' | 'MBA' | 'OTHER'

const TRACKS: { value: Track; label: string; desc: string }[] = [
  { value: 'SCHOOL', label: 'School (Class 6–10)', desc: 'CBSE, State or ICSE board' },
  { value: 'INTERMEDIATE', label: 'Intermediate / +2', desc: 'MPC, BiPC, CEC, MEC…' },
  { value: 'ENGINEERING', label: 'Engineering / Medical entrance', desc: 'JEE, NEET, EAMCET' },
  { value: 'MBA', label: 'MBA / Higher studies', desc: 'CAT and other entrances' },
  { value: 'OTHER', label: 'Just exploring', desc: 'Pick topics you love' },
]

const SCHOOL_BOARDS = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'TELANGANA_STATE', label: 'Telangana State Board' },
  { value: 'ANDHRA_PRADESH_STATE', label: 'Andhra Pradesh State Board' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'IB', label: 'IB' },
  { value: 'NIOS', label: 'NIOS' },
  { value: 'OTHER', label: 'Other' },
]
const INTER_BOARDS = [
  { value: 'TELANGANA_INTERMEDIATE', label: 'TS Intermediate' },
  { value: 'ANDHRA_PRADESH_INTERMEDIATE', label: 'AP Intermediate' },
  { value: 'CBSE', label: 'CBSE (11–12)' },
]
const CLASSES = ['6', '7', '8', '9', '10']
const INTER_YEARS = [
  { label: '1st Year', cls: '11' },
  { label: '2nd Year', cls: '12' },
]
const GROUPS = ['MPC', 'BiPC', 'CEC', 'MEC', 'HEC']
const ENGG_EXAMS = [
  { value: 'JEE_MAIN', label: 'JEE Main' },
  { value: 'JEE_ADVANCED', label: 'JEE Advanced' },
  { value: 'NEET', label: 'NEET (Medical)' },
  { value: 'EAPCET_ENGINEERING', label: 'TS / AP EAMCET' },
]
const MBA_EXAMS = [
  { value: 'CAT', label: 'CAT' },
  { value: 'XAT', label: 'XAT' },
  { value: 'GMAT', label: 'GMAT' },
]
const INTERESTS = [
  'Coding',
  'Aptitude/Reasoning',
  'English/Communication',
  'GK/Current affairs',
  'Spoken languages',
]

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

export function LearnerOnboarding() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [step, setStep] = useState<'track' | 'details'>('track')
  const [track, setTrack] = useState<Track | null>(null)
  const [board, setBoard] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [stream, setStream] = useState('')
  const [examTargets, setExamTargets] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const pickTrack = (t: Track) => {
    setTrack(t)
    setBoard(t === 'INTERMEDIATE' ? INTER_BOARDS[0]!.value : SCHOOL_BOARDS[0]!.value)
    setClassLevel('')
    setStream('')
    setStep('details')
  }

  const finish = async () => {
    if (!track) return
    setSaving(true)
    try {
      await api.put('/auth/me/learner-profile', {
        track,
        ...(board ? { board } : {}),
        ...(classLevel ? { classLevel } : {}),
        ...(academicYear ? { year: academicYear } : {}),
        ...(stream ? { stream } : {}),
        examTargets,
        interests,
      })
      const { data } = await api.post<AuthUser>('/auth/me/onboarded')
      setUser(data)
      toast.success('All set — welcome to LearnHub!')
      router.replace('/dashboard')
    } catch {
      toast.error('Could not save. Please try again.')
      setSaving(false)
    }
  }

  const canFinish =
    track === 'OTHER'
      ? interests.length > 0
      : track === 'ENGINEERING' || track === 'MBA'
        ? examTargets.length > 0
        : track === 'INTERMEDIATE'
          ? Boolean(board && classLevel && stream)
          : Boolean(board && classLevel)

  return (
    <div className="mk-brand-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="mk-brand-bg flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="font-semibold">LearnHub</span>
        </div>

        {step === 'track' ? (
          <div>
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              What are you studying?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ll tailor courses, practice and mock tests to you.
            </p>
            <div className="mt-5 space-y-2.5">
              {TRACKS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => pickTrack(t.value)}
                  className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition hover:border-primary/50 hover:bg-accent"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-7 w-7" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              {track === 'OTHER' ? 'Pick your interests' : 'A few quick details'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {track === 'OTHER'
                ? "Choose topics you want to learn — we'll show those."
                : 'This helps us show the right syllabus and tests.'}
            </p>

            <div className="mt-5 space-y-4">
              {(track === 'SCHOOL' || track === 'INTERMEDIATE') && (
                <>
                  <Field label="Board">
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {(track === 'INTERMEDIATE' ? INTER_BOARDS : SCHOOL_BOARDS).map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </Field>

                  {track === 'SCHOOL' ? (
                    <Field label="Class">
                      <select
                        value={classLevel}
                        onChange={(e) => setClassLevel(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select class</option>
                        {CLASSES.map((c) => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <>
                      <Field label="Year">
                        <select
                          value={classLevel}
                          onChange={(e) => setClassLevel(e.target.value)}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select year</option>
                          {INTER_YEARS.map((y) => (
                            <option key={y.cls} value={y.cls}>{y.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Group">
                        <div className="flex flex-wrap gap-2">
                          {GROUPS.map((g) => (
                            <Chip key={g} active={stream === g} onClick={() => setStream(g)}>
                              {g}
                            </Chip>
                          ))}
                        </div>
                      </Field>
                    </>
                  )}

                  <Field label="Academic year (optional)">
                    <input
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="e.g. 2025-26"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </Field>
                </>
              )}

              {(track === 'ENGINEERING' || track === 'MBA') && (
                <Field label="Target exams">
                  <div className="flex flex-wrap gap-2">
                    {(track === 'ENGINEERING' ? ENGG_EXAMS : MBA_EXAMS).map((ex) => (
                      <Chip
                        key={ex.value}
                        active={examTargets.includes(ex.value)}
                        onClick={() => setExamTargets((l) => toggle(l, ex.value))}
                      >
                        {ex.label}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}

              {track === 'OTHER' && (
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((it) => (
                    <Chip
                      key={it}
                      active={interests.includes(it)}
                      onClick={() => setInterests((l) => toggle(l, it))}
                    >
                      {it}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep('track')}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={finish}
                disabled={!canFinish || saving}
                className="mk-brand-bg inline-flex items-center gap-1.5 rounded-md px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? 'Setting up…' : 'Start learning'}
                {!saving && <Rocket className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${
        active ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
      }`}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}
