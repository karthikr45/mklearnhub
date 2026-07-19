import type { Data } from '@measured/puck'
import type { Metadata } from 'next'
import { Render } from '@measured/puck/rsc'

import { brandingStyle, type BrandingInput } from '@/lib/branding-style'
import { portalConfig, type PortalMetadata } from '@/lib/puck.config'

export interface PublicPortalPayload {
  portal: { name: string; logoUrl?: string | null; primaryColor?: string | null }
  pageJson: Data | null
  branding?:
    | (BrandingInput & { appName?: string | null; logoUrl?: string | null })
    | null
  courses: PortalMetadata['courses']
  articles: PortalMetadata['articles']
}

export async function fetchPortal(
  path: string,
): Promise<PublicPortalPayload | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  try {
    const res = await fetch(`${base}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as PublicPortalPayload
  } catch {
    return null
  }
}

/** Build SEO metadata for a portal (used by each route's generateMetadata). */
export function portalSeo(
  data: PublicPortalPayload | null,
  fallbackTitle = 'Portal',
): Metadata {
  const name = data?.portal.name ?? fallbackTitle
  const description = data?.branding?.appName
    ? `${name} — ${data.branding.appName}`
    : `${name}`
  return {
    title: name,
    description,
    openGraph: { title: name, description, type: 'website' },
    twitter: { card: 'summary', title: name, description },
  }
}

/** Server component that renders a portal's Puck document with live data. */
export function PortalDocument({ data }: { data: PublicPortalPayload }) {
  const pageData: Data = data.pageJson ?? { content: [], root: {} }
  const metadata: PortalMetadata = {
    courses: data.courses ?? [],
    articles: data.articles ?? [],
    logoUrl: data.portal.logoUrl ?? data.branding?.logoUrl ?? null,
    appName: data.branding?.appName ?? data.portal.name,
  }
  // Portal-level colour overrides the org branding; org branding supplies the
  // rest (secondary/accent/font). Falls back to the default theme.
  const style = brandingStyle({
    primaryColor: data.portal.primaryColor ?? data.branding?.primaryColor,
    secondaryColor: data.branding?.secondaryColor,
    accentColor: data.branding?.accentColor,
    fontFamily: data.branding?.fontFamily,
  })
  return (
    <main style={style} className="bg-background text-foreground">
      <Render config={portalConfig} data={pageData} metadata={metadata} />
    </main>
  )
}
