'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface Tier {
  name: string
  priceInr: number | null
  blurb: string
  features: string[]
  highlight?: boolean
  cta: string
}

// Mirrors packages/api billing PLAN_CATALOG so marketing == product.
const TIERS: Tier[] = [
  {
    name: 'Free',
    priceInr: 0,
    blurb: 'For individuals getting started.',
    features: [
      'Up to 5 members',
      'Up to 5 courses',
      'Core knowledge base & LMS',
      'Community support',
    ],
    cta: 'Start for free',
  },
  {
    name: 'Teams',
    priceInr: 2999,
    blurb: 'For growing teams and creators.',
    features: [
      'Up to 50 members',
      'Up to 50 courses',
      'Advanced analytics',
      'Custom branding',
      'Email support',
    ],
    highlight: true,
    cta: 'Start free trial',
  },
  {
    name: 'Institute',
    priceInr: 9999,
    blurb: 'For schools and institutes.',
    features: [
      'Up to 500 members',
      'Up to 200 courses',
      'School management suite',
      'SCORM / xAPI',
      'Audit logs & priority support',
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Enterprise',
    priceInr: null,
    blurb: 'For large, regulated organizations.',
    features: [
      'Unlimited members & courses',
      'SSO & HRMS sync',
      'API gateway & white-label',
      'ISO 27001 compliance',
      'Dedicated support & SLA',
    ],
    cta: 'Contact sales',
  },
]

function formatInr(n: number): string {
  return n.toLocaleString('en-IN')
}

export function PricingTable() {
  const [annual, setAnnual] = useState(true)

  return (
    <div>
      {/* billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={annual ? 'text-sm text-muted-foreground' : 'text-sm font-medium'}>
          Monthly
        </span>
        <button
          type="button"
          onClick={() => setAnnual((v) => !v)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            annual ? 'mk-brand-bg' : 'bg-muted-foreground/30'
          }`}
          aria-label="Toggle annual billing"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              annual ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className={annual ? 'text-sm font-medium' : 'text-sm text-muted-foreground'}>
          Annual
          <span className="ml-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            Save 20%
          </span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const monthly = tier.priceInr
          const shown =
            monthly === null
              ? null
              : annual
                ? Math.round(monthly * 0.8)
                : monthly
          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                tier.highlight
                  ? 'border-violet-300/70 bg-card shadow-xl shadow-violet-500/10 ring-1 ring-violet-300/50'
                  : 'bg-card'
              }`}
            >
              {tier.highlight && (
                <span className="mk-brand-bg absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>

              <div className="mt-5 flex items-end gap-1">
                {shown === null ? (
                  <span className="text-3xl font-bold tracking-tight">Custom</span>
                ) : shown === 0 ? (
                  <span className="text-4xl font-bold tracking-tight">₹0</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold tracking-tight">
                      ₹{formatInr(shown)}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">/mo</span>
                  </>
                )}
              </div>
              {shown !== null && shown > 0 && annual && (
                <p className="mt-1 text-xs text-muted-foreground">billed annually</p>
              )}

              <Link
                href={tier.priceInr === null ? '/contact' : '/register'}
                className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-medium transition ${
                  tier.highlight
                    ? 'mk-brand-bg text-white shadow-sm shadow-violet-500/30 hover:opacity-90'
                    : 'border hover:bg-accent'
                }`}
              >
                {tier.cta}
              </Link>

              <ul className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
