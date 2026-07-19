import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import {
  fetchPortal,
  PortalDocument,
  portalSeo,
} from '@/components/builder/PortalDocument'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>
}): Promise<Metadata> {
  const { host } = await params
  return portalSeo(
    await fetchPortal(`/portals/public/by-domain/${encodeURIComponent(host)}`),
  )
}

// Reached via a middleware rewrite when a request arrives on a custom domain
// bound to a portal (Portal.customDomain).
export default async function PortalByDomainPage({
  params,
}: {
  params: Promise<{ host: string }>
}) {
  const { host } = await params
  const data = await fetchPortal(
    `/portals/public/by-domain/${encodeURIComponent(host)}`,
  )
  if (!data) notFound()
  return <PortalDocument data={data} />
}
