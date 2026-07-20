/**
 * Shared navigation + brand constants for the LearnHub marketing site.
 */
export const MARKETING_NAV = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export const BRAND = {
  name: 'LearnHub',
  tagline: 'Knowledge base, LMS & school management — in one platform.',
  poweredBy: 'MK Tech Monk',
} as const
