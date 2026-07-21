'use client'

import {
  Building2,
  CreditCard,
  KeyRound,
  Plug,
  School,
  ScrollText,
  ShieldCheck,
  Users,
  Webhook,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/layout/PageHeader'

interface SettingLink {
  href: string
  title: string
  description: string
  icon: LucideIcon
}

const links: SettingLink[] = [
  {
    href: '/dashboard/settings/school',
    title: 'School Profile',
    description: 'State, board and directory listing so students can find you.',
    icon: School,
  },
  {
    href: '/dashboard/members',
    title: 'Members',
    description: 'Invite and manage people in your organization.',
    icon: Users,
  },
  {
    href: '/dashboard/settings/branding',
    title: 'Branding',
    description: 'White-label colors, logo, and custom domain.',
    icon: Building2,
  },
  {
    href: '/dashboard/settings/sso',
    title: 'SSO',
    description: 'SAML / OIDC single sign-on configuration.',
    icon: ShieldCheck,
  },
  {
    href: '/dashboard/settings/integrations',
    title: 'Integrations',
    description: 'Connect HRMS, storage, and third-party services.',
    icon: Plug,
  },
  {
    href: '/dashboard/settings/api-keys',
    title: 'API Keys',
    description: 'Create and revoke keys for the API gateway.',
    icon: KeyRound,
  },
  {
    href: '/dashboard/settings/webhooks',
    title: 'Webhooks',
    description: 'Subscribe external systems to platform events.',
    icon: Webhook,
  },
  {
    href: '/dashboard/settings/audit-log',
    title: 'Audit Log',
    description: 'Review security and administrative activity.',
    icon: ScrollText,
  },
  {
    href: '/dashboard/settings/privacy',
    title: 'Privacy',
    description: 'Data-subject requests, retention, and deletion.',
    icon: ShieldCheck,
  },
  {
    href: '/dashboard/settings/billing',
    title: 'Billing',
    description: 'Subscription plan, invoices, and payment method.',
    icon: CreditCard,
  },
]

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your organization."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
