import Link from 'next/link'

import { Logo } from './Logo'
import { BRAND } from './nav'

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/register', label: 'Get started' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { href: '/features#business', label: 'For businesses' },
      { href: '/features#schools', label: 'For schools' },
      { href: '/features#individuals', label: 'For learners' },
      { href: '/features#enterprise', label: 'Enterprise' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/pricing', label: 'Plans' },
      { href: '/about#security', label: 'Security' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">{BRAND.tagline}</p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {'2026'} {BRAND.name}. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            Powered by{' '}
            <span className="mk-brand-text font-semibold">{BRAND.poweredBy}</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
