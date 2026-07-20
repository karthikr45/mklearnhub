import {
  BarChart3,
  BookOpen,
  Boxes,
  BrainCircuit,
  Building2,
  Calendar,
  Check,
  FileBadge,
  GraduationCap,
  Layers,
  ListChecks,
  Palette,
  School,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Features — LearnHub',
  description:
    'Explore LearnHub features: knowledge base, LMS, school management, portal builder, AI assist and an enterprise layer with SSO, compliance and white-label.',
}

const GROUPS = [
  {
    id: 'business',
    icon: BookOpen,
    kicker: 'For businesses',
    title: 'Knowledge base & internal academy',
    desc: 'Document everything your team needs and turn it into training.',
    features: [
      { icon: BookOpen, title: 'Spaces & manuals', desc: 'Organize knowledge into spaces, manuals and versioned articles.' },
      { icon: GraduationCap, title: 'Course authoring', desc: 'Chapters, lessons, resources and prerequisites with a clean editor.' },
      { icon: Video, title: 'Video lessons', desc: 'Upload once; we transcode to adaptive HLS for smooth streaming.' },
      { icon: ListChecks, title: 'Quizzes & assessments', desc: 'MCQs, question banks and automatic grading with instant feedback.' },
      { icon: FileBadge, title: 'Certificates', desc: 'Auto-issue verifiable certificates on course completion.' },
      { icon: BarChart3, title: 'Analytics', desc: 'Track enrollment, progress and completion across your org.' },
    ],
  },
  {
    id: 'schools',
    icon: School,
    kicker: 'For schools & institutes',
    title: 'Complete school management',
    desc: 'Everything an institute needs, connected to your LMS.',
    features: [
      { icon: Users, title: 'Batches & cohorts', desc: 'Group students into batches across academic years.' },
      { icon: Calendar, title: 'Timetables', desc: 'Build weekly schedules and share them with students.' },
      { icon: ListChecks, title: 'Attendance', desc: 'Mark and report attendance with present/absent summaries.' },
      { icon: FileBadge, title: 'Grade cards', desc: 'Record scores by subject and term with grade labels.' },
      { icon: Users, title: 'Parent portal', desc: 'Parents follow their children’s grades and attendance.' },
      { icon: GraduationCap, title: 'Blended learning', desc: 'Combine classroom management with online courses.' },
    ],
  },
  {
    id: 'individuals',
    icon: Boxes,
    kicker: 'For creators & platforms',
    title: 'Build & sell public courses',
    desc: 'Turn your workspace into a public learning destination.',
    features: [
      { icon: Palette, title: 'Portal builder', desc: 'Drag-and-drop public pages with a live visual editor.' },
      { icon: Building2, title: 'Custom domains', desc: 'Serve portals on your own domain with per-org branding.' },
      { icon: BrainCircuit, title: 'AI assist', desc: 'Draft content, summarize lessons and generate quizzes.' },
      { icon: BarChart3, title: 'Subscriptions', desc: 'Monetize with Razorpay plans and subscription packages.' },
    ],
  },
  {
    id: 'enterprise',
    icon: ShieldCheck,
    kicker: 'For enterprises',
    title: 'Security, compliance & integrations',
    desc: 'The enterprise layer that lets IT say yes.',
    features: [
      { icon: ShieldCheck, title: 'SSO & SAML', desc: 'Google and SAML single sign-on for your workforce.' },
      { icon: Layers, title: 'HRMS sync', desc: 'Keep users and roles in sync with your HR system.' },
      { icon: BarChart3, title: 'SCORM / xAPI', desc: 'Import industry-standard course packages.' },
      { icon: Building2, title: 'API gateway & white-label', desc: 'Programmatic access and fully branded experiences.' },
      { icon: ShieldCheck, title: 'Audit logs', desc: 'Every mutation captured for accountability.' },
      { icon: ShieldCheck, title: 'ISO 27001 aligned', desc: 'Encryption, PII scrubbing and security headers built in.' },
    ],
  },
] as const

export default function FeaturesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="mk-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">
            Features
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            One platform, <span className="mk-brand-text">every capability</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            From documenting knowledge to running a school to selling public
            courses — explore what LearnHub can do.
          </p>
        </div>
      </section>

      {GROUPS.map((group, gi) => (
        <section
          key={group.id}
          id={group.id}
          className={gi % 2 === 1 ? 'border-b bg-muted/20' : 'border-b'}
        >
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                <group.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">
                {group.kicker}
              </span>
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight">
              {group.title}
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">{group.desc}</p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border bg-card p-6 transition hover:shadow-lg hover:shadow-violet-500/5"
                >
                  <f.icon className="h-6 w-6 text-violet-500" />
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight">See it for yourself</h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Every feature is available to try on the free plan. Create a workspace
          and explore in minutes.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="mk-brand-bg inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
          >
            <Check className="h-4 w-4" /> Get started free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-accent"
          >
            Compare plans
          </Link>
        </div>
      </section>
    </>
  )
}
