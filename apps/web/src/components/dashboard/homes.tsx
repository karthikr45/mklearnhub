'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

interface OrgStats {
  totalUsers?: number
  totalCourses?: number
  totalEnrollments?: number
  completionRate?: number
}
interface Enrollment {
  id: string
  progressPct: number
  status: string
  course: { id: string; title: string; description?: string | null }
}
interface Course {
  id: string
  title: string
  status: string
  instructorId: string
  description?: string | null
}
interface Child {
  id: string
  name: string
  email: string
}

function firstName(name?: string): string {
  return name ? name.split(' ')[0] ?? name : ''
}

// ─── Admin ───────────────────────────────────────────
export function AdminHome() {
  const user = useAuthStore((s) => s.user)
  const orgId = user?.orgId ?? null
  const { data: stats, isLoading } = useQuery({
    queryKey: ['org-stats', orgId],
    queryFn: async () => (await api.get<OrgStats>(`/organizations/${orgId}/stats`)).data,
    enabled: Boolean(orgId),
  })
  const completion = stats?.completionRate ?? 0
  return (
    <div>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${firstName(user.name)}` : ''}`}
        description="Your organization at a glance."
      />
      <StatsGrid
        stats={[
          { label: 'Members', value: isLoading ? '—' : stats?.totalUsers ?? 0, icon: Users },
          { label: 'Courses', value: isLoading ? '—' : stats?.totalCourses ?? 0, icon: GraduationCap },
          { label: 'Enrollments', value: isLoading ? '—' : stats?.totalEnrollments ?? 0, icon: BookOpen },
          { label: 'Completion', value: isLoading ? '—' : `${completion}%`, icon: TrendingUp },
        ]}
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { href: '/dashboard/courses', label: 'Manage courses' },
          { href: '/dashboard/members', label: 'Invite members' },
          { href: '/dashboard/analytics', label: 'View analytics' },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="rounded-lg border bg-card p-5 hover:shadow-sm">
            <p className="font-medium">{a.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Instructor ──────────────────────────────────────
export function InstructorHome() {
  const user = useAuthStore((s) => s.user)
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => (await api.get<Course[]>('/courses')).data,
  })
  const mine = (courses ?? []).filter((c) => c.instructorId === user?.id)
  return (
    <div>
      <PageHeader
        title={`Hi${user?.name ? `, ${firstName(user.name)}` : ''}`}
        description="Courses you teach."
      />
      <div className="mb-6 flex gap-3">
        <Link href="/dashboard/courses/create" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          New course
        </Link>
        <Link href="/dashboard/courses" className="rounded-md border px-4 py-2 text-sm">All courses</Link>
      </div>
      {mine.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          You have no courses yet. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((c) => (
            <Link key={c.id} href={`/dashboard/courses/${c.id}`} className="rounded-lg border bg-card p-5 hover:shadow-sm">
              <h3 className="font-semibold">{c.title}</h3>
              <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{c.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Learner / Student ───────────────────────────────
export function LearnerHome() {
  const user = useAuthStore((s) => s.user)
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => (await api.get<Enrollment[]>('/courses/me/enrollments')).data,
  })
  return (
    <div>
      <PageHeader
        title={`Hi${user?.name ? `, ${firstName(user.name)}` : ''}`}
        description="Pick up where you left off."
      />
      <div className="mb-6 flex gap-3">
        <Link href="/dashboard/explore" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Explore courses
        </Link>
        <Link href="/dashboard/learning" className="rounded-md border px-4 py-2 text-sm">My learning</Link>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !enrollments || enrollments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">You&apos;re not enrolled in anything yet</p>
          <Link href="/dashboard/explore" className="mt-2 inline-block text-sm text-primary hover:underline">
            Browse the catalog →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <Link key={e.id} href={`/dashboard/courses/${e.course.id}`} className="rounded-lg border bg-card p-5 hover:shadow-sm">
              <h3 className="font-semibold">{e.course.title}</h3>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${e.progressPct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{e.progressPct}% complete</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Parent ──────────────────────────────────────────
export function ParentHome() {
  const user = useAuthStore((s) => s.user)
  const { data: children, isLoading } = useQuery({
    queryKey: ['my-children', user?.id],
    queryFn: async () =>
      (await api.get<Child[]>(`/school/parents/${user?.id}/children`)).data,
    enabled: Boolean(user?.id),
  })
  return (
    <div>
      <PageHeader title="My children" description="Follow your children's progress." />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !children || children.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No children linked to your account yet. Ask the school to link them.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((c) => (
            <Link key={c.id} href={`/dashboard/children/${c.id}`} className="rounded-lg border bg-card p-5 hover:shadow-sm">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                {c.name.charAt(0)}
              </div>
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-sm text-muted-foreground">{c.email}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Super admin ─────────────────────────────────────
export function SuperAdminHome() {
  return (
    <div>
      <PageHeader title="Platform administration" description="You are a platform super admin." />
      <div className="max-w-lg rounded-lg border bg-card p-6">
        <ShieldCheck className="mb-3 h-8 w-8 text-primary" />
        <p className="font-medium">Use the admin console</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide organizations, users and stats live in the admin app.
        </p>
        <a
          href="http://localhost:3002"
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Open admin console
        </a>
      </div>
    </div>
  )
}

