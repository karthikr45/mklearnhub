import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PricingTable } from '@/components/marketing/PricingTable'

export const metadata: Metadata = {
  title: 'Pricing — LearnHub',
  description:
    'Simple, transparent pricing for LearnHub. Start free, then scale to Teams, Institute or Enterprise as you grow.',
}

const COMPARE = [
  { label: 'Members', values: ['5', '50', '500', 'Unlimited'] },
  { label: 'Courses', values: ['5', '50', '200', 'Unlimited'] },
  { label: 'Knowledge base & LMS', values: [true, true, true, true] },
  { label: 'Advanced analytics', values: [false, true, true, true] },
  { label: 'Custom branding', values: [false, true, true, true] },
  { label: 'School management suite', values: [false, false, true, true] },
  { label: 'SCORM / xAPI', values: [false, false, true, true] },
  { label: 'Audit logs', values: [false, false, true, true] },
  { label: 'SSO & HRMS sync', values: [false, false, false, true] },
  { label: 'API gateway & white-label', values: [false, false, false, true] },
  { label: 'ISO 27001 compliance', values: [false, false, false, true] },
  { label: 'Dedicated support & SLA', values: [false, false, false, true] },
] as const

const PLAN_NAMES = ['Free', 'Teams', 'Institute', 'Enterprise'] as const

const FAQS = [
  {
    q: 'Can I change plans later?',
    a: 'Yes — upgrade or downgrade at any time. Changes apply immediately and billing is prorated.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We use Razorpay, supporting cards, UPI, net banking and wallets. Enterprise customers can pay by invoice.',
  },
  {
    q: 'Is there a discount for annual billing?',
    a: 'Yes. Paying annually saves 20% compared to monthly billing on all paid plans.',
  },
  {
    q: 'Do you offer nonprofit or education discounts?',
    a: 'We do. Reach out via the contact page and our team will help you find the right plan.',
  },
] as const

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-violet-500" />
    ) : (
      <span className="text-muted-foreground/40">—</span>
    )
  }
  return <span className="text-sm font-medium">{value}</span>
}

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="mk-glow pointer-events-none absolute -top-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 opacity-40" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">
            Pricing
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Pricing that <span className="mk-brand-text">scales with you</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Start free and upgrade as your team, school or audience grows. No
            hidden fees.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <PricingTable />
      </section>

      {/* Comparison table */}
      <section className="border-y bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Compare plans
          </h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-1/3 px-4 py-3 text-left text-sm font-semibold">
                    Features
                  </th>
                  {PLAN_NAMES.map((p) => (
                    <th key={p} className="px-4 py-3 text-center text-sm font-semibold">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.label} className="border-t">
                    <td className="border-t px-4 py-3 text-sm text-muted-foreground">
                      {row.label}
                    </td>
                    {row.values.map((v, i) => (
                      <td key={i} className="border-t px-4 py-3 text-center">
                        <Cell value={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Pricing questions
        </h2>
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
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="mk-brand-bg inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
          >
            Get started free
          </Link>
        </div>
      </section>
    </>
  )
}
