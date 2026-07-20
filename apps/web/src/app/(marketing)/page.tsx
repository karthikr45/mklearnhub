import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  BrainCircuit,
  Building2,
  GraduationCap,
  Layers,
  School,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AudienceTabs } from '@/components/marketing/AudienceTabs'
import { DashboardPreview } from '@/components/marketing/DashboardPreview'
import { PricingTable } from '@/components/marketing/PricingTable'

export const metadata: Metadata = {
  title: 'LearnHub — Knowledge base, LMS & school management in one platform',
  description:
    'LearnHub unifies your knowledge base, learning management system and school administration in a single, beautifully designed platform for businesses, schools and individual learners.',
}

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    desc: 'Spaces, manuals and rich articles with full-text search — your single source of truth.',
    className: 'md:col-span-2',
  },
  {
    icon: GraduationCap,
    title: 'Courses & LMS',
    desc: 'Author courses with video, chapters, quizzes and auto-issued certificates.',
  },
  {
    icon: School,
    title: 'School Suite',
    desc: 'Batches, timetables, attendance and grade cards — with a parent portal.',
  },
  {
    icon: BrainCircuit,
    title: 'AI assist',
    desc: 'Draft articles, summarise lessons and generate quizzes with Claude built in.',
  },
  {
    icon: Boxes,
    title: 'Portal builder',
    desc: 'Design public course portals with a drag-and-drop builder and custom domains.',
    className: 'md:col-span-2',
  },
]

const ENTERPRISE = [
  { icon: ShieldCheck, label: 'SSO & SAML' },
  { icon: Layers, label: 'HRMS sync' },
  { icon: BarChart3, label: 'SCORM / xAPI' },
  { icon: Building2, label: 'White-label' },
  { icon: ShieldCheck, label: 'Audit logs' },
  { icon: ShieldCheck, label: 'ISO 27001' },
]

const STATS = [
  { value: '1', label: 'Platform for KB + LMS + School' },
  { value: '3', label: 'Audiences: business, school, learner' },
  { value: '10+', label: 'Enterprise-grade modules' },
  { value: '99.9%', label: 'Uptime target' },
]

const STEPS = [
  {
    n: '01',
    title: 'Create your workspace',
    desc: 'Sign up and get a branded workspace in seconds — no credit card required.',
  },
  {
    n: '02',
    title: 'Build your content',
    desc: 'Add courses, articles and batches. Invite your team, students or parents by email.',
  },
  {
    n: '03',
    title: 'Launch & measure',
    desc: 'Publish public portals, track completion and issue certificates automatically.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'We replaced three separate tools with LearnHub. Our onboarding time dropped by half and everything finally lives in one place.',
    name: 'Priya Nair',
    role: 'Head of L&D, a fintech scale-up',
  },
  {
    quote:
      'The school suite plus the parent portal is exactly what our institute needed. Attendance, grades and courses — all connected.',
    name: 'Rahul Menon',
    role: 'Principal, Sunrise Academy',
  },
  {
    quote:
      'Certificates and progress tracking make our public courses feel premium. Learners love it and so do we.',
    name: 'Ananya Rao',
    role: 'Independent course creator',
  },
]

const FAQS = [
  {
    q: 'Can I use LearnHub for both internal training and public courses?',
    a: 'Yes. Run a private knowledge base and internal academy for your team, and publish public course portals with custom domains for external learners — from the same workspace.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Absolutely. The Free plan supports up to 5 members and 5 courses with the core knowledge base and LMS, so you can start today at no cost.',
  },
  {
    q: 'Do you support schools and institutes?',
    a: 'The Institute plan adds a full school management suite: batches, timetables, attendance, grade cards and a parent portal, alongside everything in the LMS.',
  },
  {
    q: 'What about enterprise security and compliance?',
    a: 'Enterprise includes SSO, HRMS sync, an API gateway, white-label branding, audit logs and an ISO 27001-aligned compliance layer, with a dedicated SLA.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mk-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="mk-glow pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 opacity-50" />

        <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/features"
              className="mk-reveal inline-flex items-center gap-2 rounded-full border bg-background/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              Knowledge base + LMS + School — now with AI assist
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <h1 className="mk-reveal mt-6 text-4xl font-bold tracking-tight sm:text-6xl" style={{ animationDelay: '0.05s' }}>
              The learning platform for{' '}
              <span className="mk-brand-text">modern organizations</span>
            </h1>

            <p className="mk-reveal mx-auto mt-6 max-w-2xl text-lg text-muted-foreground" style={{ animationDelay: '0.1s' }}>
              One beautifully designed platform to document knowledge, train your
              people, run your school and sell courses — for businesses,
              institutes and individual learners alike.
            </p>

            <div className="mk-reveal mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '0.15s' }}>
              <Link
                href="/register"
                className="mk-brand-bg inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-accent"
              >
                View pricing
              </Link>
            </div>
            <p className="mk-reveal mt-4 text-xs text-muted-foreground" style={{ animationDelay: '0.2s' }}>
              Free forever plan · No credit card required
            </p>
          </div>

          <div className="mk-reveal relative mx-auto mt-14 max-w-4xl" style={{ animationDelay: '0.25s' }}>
            <div className="mk-float">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo cloud ───────────────────────────────────── */}
      <section className="border-y bg-muted/20 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Built for teams, schools and creators of every size
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {['Acme Corp', 'Sunrise Academy', 'Northwind', 'BrightPath', 'EduWorks', 'Lumen'].map(
              (name) => (
                <span key={name} className="text-lg font-semibold tracking-tight text-muted-foreground">
                  {name}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Feature bento ────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Everything in one place"
          title="Replace your stack with one platform"
          desc="Knowledge, courses and school administration were never meant to live in separate tools. LearnHub brings them together."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group rounded-2xl border bg-card p-6 transition hover:shadow-lg hover:shadow-violet-500/5 ${f.className ?? ''}`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 transition group-hover:scale-105">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Audiences ────────────────────────────────────── */}
      <section className="border-y bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Built for everyone"
            title="One platform, three ways to learn"
            desc="Whether you run a company, a school or your own courses, LearnHub adapts to how you work."
          />
          <div className="mt-14">
            <AudienceTabs />
          </div>
        </div>
      </section>

      {/* ── Stats band (dark) ────────────────────────────── */}
      <section className="relative overflow-hidden bg-neutral-950 py-20 text-white">
        <div className="mk-dots pointer-events-none absolute inset-0 opacity-30" />
        <div className="mk-glow pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 opacity-40" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="mk-brand-text text-4xl font-bold tracking-tight sm:text-5xl">
                {s.value}
              </div>
              <p className="mt-2 text-sm text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Get started in minutes"
          title="From sign-up to launch in three steps"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-2xl border bg-card p-7">
              <span className="mk-brand-text text-5xl font-bold tracking-tighter">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Enterprise strip ─────────────────────────────── */}
      <section id="enterprise" className="border-y bg-muted/20 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 md:flex-row md:justify-between">
          <div className="max-w-md text-center md:text-left">
            <h3 className="text-2xl font-semibold tracking-tight">
              Enterprise-ready from day one
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Security, compliance and integrations that scale with the largest
              organizations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ENTERPRISE.map((e) => (
              <div
                key={e.label}
                className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium"
              >
                <e.icon className="h-4 w-4 text-violet-500" />
                {e.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading eyebrow="Loved by teams" title="What our customers say" />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border bg-card p-7">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="mk-brand-bg flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white">
                  {t.name.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="border-y bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Simple, transparent pricing"
            title="Plans that grow with you"
            desc="Start free, upgrade when you need more. Every plan includes the core knowledge base and LMS."
          />
          <div className="mt-14">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <div className="mt-10 divide-y rounded-2xl border bg-card">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                {f.q}
                <span className="text-muted-foreground transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-8 py-16 text-center text-white md:py-20">
          <div className="mk-glow pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 opacity-50" />
          <div className="mk-dots pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to bring learning together?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Join teams, schools and creators building on LearnHub. Start free —
              no credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="mk-brand-bg inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string
  title: string
  desc?: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-muted-foreground">{desc}</p>}
    </div>
  )
}
