import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import {
  fetchPortal,
  PortalDocument,
  portalSeo,
} from '@/components/builder/PortalDocument'

export const dynamic = 'force-dynamic'

function apiPath(orgSlug: string, portalSlug: string): string {
  return `/portals/public/by-slug/${encodeURIComponent(orgSlug)}/${encodeURIComponent(portalSlug)}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; portalSlug: string }>
}): Promise<Metadata> {
  const { orgSlug, portalSlug } = await params
  return portalSeo(await fetchPortal(apiPath(orgSlug, portalSlug)))
}

export default async function PublicPortalBySlugPage({
  params,
}: {
  params: Promise<{ orgSlug: string; portalSlug: string }>
}) {
  const { orgSlug, portalSlug } = await params
  const data = await fetchPortal(apiPath(orgSlug, portalSlug))
  if (!data) notFound()
  return <PortalDocument data={data} />
}
