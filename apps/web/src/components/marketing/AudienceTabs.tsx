'use client'

import { Briefcase, Check, GraduationCap, School } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const AUDIENCES = [
  {
    key: 'business',
    icon: Briefcase,
    tab: 'Businesses',
    title: 'Onboard, train and certify your whole team',
    desc: 'Spin up a branded academy in minutes. Build courses, publish a searchable knowledge base, and track completion across every department.',
    points: [
      'Internal knowledge base with spaces & manuals',
      'Course authoring with video, quizzes & certificates',
      'Team analytics and completion tracking',
      'SSO, HRMS sync and audit logs on higher tiers',
    ],
  },
  {
    key: 'schools',
    icon: School,
    tab: 'Schools & Institutes',
    title: 'Run your institution end to end',
    desc: 'Manage batches, timetables, attendance and grades alongside a full LMS — with parent visibility built in.',
    points: [
      'Batches, timetables & academic years',
      'Attendance and grade cards',
      'Parent portal to follow every child',
      'Blended online + classroom learning',
    ],
  },
  {
    key: 'individuals',
    icon: GraduationCap,
    tab: 'Individual learners',
    title: 'Learn at your own pace, prove it with certificates',
    desc: 'Enrol in public courses, track your progress lesson by lesson, and earn verifiable certificates you can share.',
    points: [
      'A personal learning dashboard',
      'Video lessons with resume-where-you-left-off',
      'Quizzes and instant feedback',
      'Shareable, verifiable certificates',
    ],
  },
] as const

export function AudienceTabs() {
  const [active, setActive] = useState(0)
  const current = AUDIENCES[active]!

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {AUDIENCES.map((a, i) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setActive(i)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              i === active
                ? 'mk-brand-bg text-white shadow-sm shadow-violet-500/30'
                : 'border text-muted-foreground hover:bg-accent'
            }`}
          >
            <a.icon className="h-4 w-4" />
            {a.tab}
          </button>
        ))}
      </div>

      <div className="grid items-center gap-10 rounded-3xl border bg-card p-8 md:grid-cols-2 md:p-12">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">{current.title}</h3>
          <p className="mt-3 text-muted-foreground">{current.desc}</p>
          <ul className="mt-6 space-y-3">
            {current.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                  <Check className="h-3 w-3 text-violet-600" />
                </span>
                <span className="text-sm">{p}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-full border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
          >
            Explore {current.tab}
          </Link>
        </div>

        <div className="relative">
          <div className="mk-glow absolute -inset-6 -z-10 opacity-40" />
          <div className="grid grid-cols-2 gap-4">
            {current.points.map((p, i) => (
              <div
                key={p}
                className={`rounded-2xl border bg-background p-5 ${
                  i % 3 === 0 ? 'col-span-2' : ''
                }`}
              >
                <current.icon className="h-5 w-5 text-violet-500" />
                <p className="mt-3 text-sm font-medium leading-snug">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
