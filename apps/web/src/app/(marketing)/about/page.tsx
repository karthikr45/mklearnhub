import {
  Compass,
  Heart,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — LearnHub',
  description:
    'LearnHub unifies knowledge, learning and school management in one platform. Learn about our mission, values and commitment to security.',
}

const VALUES = [
  { icon: Compass, title: 'Clarity', desc: 'Learning tools should be obvious, not overwhelming. We obsess over simple, focused design.' },
  { icon: Heart, title: 'For everyone', desc: 'From a solo creator to a 10,000-seat enterprise — the platform meets you where you are.' },
  { icon: Zap, title: 'Momentum', desc: 'We ship fast and iterate with our customers, turning feedback into features quickly.' },
  { icon: ShieldCheck, title: 'Trust', desc: 'Security and privacy are foundations, not add-ons. Your data is yours.' },
]

const STACK = [
  'Next.js 15 & React Server Components',
  'NestJS on Fastify',
  'PostgreSQL & Prisma',
  'Turborepo monorepo',
  'Claude AI assist',
  'Razorpay billing',
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mk-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Our story
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Bringing learning <span className="mk-brand-text">together</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Knowledge lived in wikis, training in an LMS, and school records in
            spreadsheets. We built LearnHub so it could all live in one place —
            beautifully.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <Target className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight">Our mission</h2>
            <p className="mt-4 text-muted-foreground">
              To give every organization — a startup, a school, or a global
              enterprise — a single, elegant home for knowledge and learning. We
              believe teaching and training should be effortless to run and a joy
              to use.
            </p>
            <p className="mt-4 text-muted-foreground">
              That means one login, one design language, and one connected data
              model across your knowledge base, courses and school records.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: 'KB + LMS + School', v: 'One platform' },
              { k: 'Businesses · Schools · Learners', v: 'Three audiences' },
              { k: 'SSO · Compliance · API', v: 'Enterprise ready' },
              { k: 'Free forever plan', v: 'Start today' },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl border bg-card p-6">
                <div className="mk-brand-text text-xl font-bold tracking-tight">
                  {s.v}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-y bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              What we value
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Principles behind the product
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border bg-card p-6">
                <v.icon className="h-6 w-6 text-violet-500" />
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="order-2 grid grid-cols-2 gap-3 md:order-1">
            {STACK.map((s) => (
              <div
                key={s}
                className="rounded-xl border bg-card px-4 py-3 text-sm font-medium"
              >
                {s}
              </div>
            ))}
          </div>
          <div className="order-1 md:order-2">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <Lock className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight">
              Secure by design
            </h2>
            <p className="mt-4 text-muted-foreground">
              Multi-tenant isolation, JWT auth with rotating refresh tokens,
              encryption, PII scrubbing and an audit trail on every mutation. Our
              enterprise layer is aligned with ISO 27001 controls.
            </p>
            <p className="mt-4 text-muted-foreground">
              Built on a modern, battle-tested stack for reliability at scale.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-8 py-16 text-center text-white">
          <div className="mk-glow pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 opacity-50" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight">
              Join us on the journey
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">
              Start building your knowledge and learning home today.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/register"
                className="mk-brand-bg inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
              >
                Get started free
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
