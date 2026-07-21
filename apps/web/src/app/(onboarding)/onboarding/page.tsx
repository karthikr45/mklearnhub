'use client'

import type { AuthUser } from '@learnhub/types'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  type LucideIcon,
  MessagesSquare,
  Palette,
  Rocket,
  School,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface Step {
  icon: LucideIcon
  title: string
  body: string
  points?: string[]
}

const STEPS: Record<string, Step[]> = {
  ORG_ADMIN: [
    {
      icon: Rocket,
      title: 'Welcome to LearnHub',
      body: "You're the admin of your new workspace. Let's get it ready in three quick steps.",
    },
    {
      icon: Palette,
      title: 'Make it yours',
      body: 'Set up your school profile and branding so everything looks like your institution.',
      points: [
        'Add your logo, colours and organisation details in Settings → Branding',
        'Set your board, state and academic year in Settings → School',
      ],
    },
    {
      icon: Users,
      title: 'Bring in your people',
      body: 'Invite teachers and create classes so students can join.',
      points: [
        'Invite teachers and staff from Members',
        'Create classes and share join codes from School',
        'Students self-enrol with the class code — no manual data entry',
      ],
    },
  ],
  INSTRUCTOR: [
    {
      icon: Rocket,
      title: 'Welcome, teacher',
      body: "Here's how to get your class up and running on LearnHub.",
    },
    {
      icon: BookOpen,
      title: 'Create your first course',
      body: 'Build a course with lessons, videos and assessments from the Courses area.',
      points: [
        'Add lessons and upload or link video',
        'Create quizzes and assignments your class can take',
      ],
    },
    {
      icon: School,
      title: 'Share a class code',
      body: 'Generate a join code in School and share it with your students.',
      points: [
        'Students join instantly with the code — like Google Classroom',
        'Track attendance, grades and progress in one place',
      ],
    },
  ],
  STUDENT: [
    {
      icon: GraduationCap,
      title: "You're in your class",
      body: "Welcome! Here's everything you can do to study smarter with your classmates.",
    },
    {
      icon: MessagesSquare,
      title: 'Study together, safely',
      body: 'Join study groups with your verified classmates to learn together.',
      points: [
        'Chat, share notes and use the shared whiteboard',
        'Challenge each other with live quiz battles',
        'Everything is moderated to keep the space safe',
      ],
    },
    {
      icon: Target,
      title: 'Practice and ask',
      body: 'Sharpen up for your board, JEE, NEET or EAMCET exams.',
      points: [
        'Take topic-wise quizzes and mock tests in Practice',
        'Review your rank and weak topics after each test',
        'Stuck on something? Ask in Doubts and get help',
      ],
    },
  ],
  LEARNER: [
    {
      icon: Sparkles,
      title: 'Welcome to LearnHub',
      body: "You're set up for self-study. Here's how to make the most of it.",
    },
    {
      icon: Target,
      title: 'Explore and practise',
      body: 'Find courses and practise for the exams you care about.',
      points: [
        'Browse courses in Explore',
        'Take topic-wise practice tests in Practice',
        'Build flashcards with spaced repetition',
      ],
    },
    {
      icon: LayoutDashboard,
      title: 'Track your progress',
      body: 'Your dashboard shows your streak, recent activity and next steps.',
    },
  ],
  PARENT: [
    {
      icon: Users,
      title: "Follow your child's journey",
      body: "You're linked to your child's account. Here's what you can see.",
    },
    {
      icon: HelpCircle,
      title: "Stay in the loop",
      body: 'Open Children to view attendance, grades and recent activity, and get notified of important updates.',
    },
  ],
}

export default function OnboardingPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [hydrated, setHydrated] = useState(false)
  const [idx, setIdx] = useState(0)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    const p = useAuthStore.persist
    if (!p) {
      setHydrated(true)
      return
    }
    const unsub = p.onFinishHydration(() => setHydrated(true))
    if (p.hasHydrated()) setHydrated(true)
    return unsub
  }, [])

  // Once hydrated: bounce out if not logged in, or already onboarded.
  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace('/login')
    } else if (user.onboarded) {
      router.replace('/dashboard')
    }
  }, [hydrated, user, router])

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const steps = STEPS[user.role] ?? STEPS.LEARNER!
  const step = steps[idx]!
  const isLast = idx === steps.length - 1
  const Icon = step.icon

  const finish = async () => {
    setFinishing(true)
    try {
      const { data } = await api.post<AuthUser>('/auth/me/onboarded')
      setUser(data)
      router.replace('/dashboard')
    } catch {
      toast.error('Could not finish setup. Please try again.')
      setFinishing(false)
    }
  }

  return (
    <div className="mk-brand-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="mk-brand-bg flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="font-semibold">LearnHub</span>
          </div>
          <button
            onClick={finish}
            disabled={finishing}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Skip
          </button>
        </div>

        <div className="mb-5 flex gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= idx ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="min-h-[15rem]">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{step.title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
          {step.points && (
            <ul className="mt-4 space-y-2">
              {step.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {isLast ? (
            <button
              onClick={finish}
              disabled={finishing}
              className="mk-brand-bg inline-flex items-center gap-1.5 rounded-md px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {finishing ? 'Setting up…' : 'Get started'}
              {!finishing && <Rocket className="h-4 w-4" />}
            </button>
          ) : (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="mk-brand-bg inline-flex items-center gap-1.5 rounded-md px-6 py-2.5 text-sm font-medium text-white"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
