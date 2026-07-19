import { notFound } from 'next/navigation'

import {
  fetchPortal,
  PortalDocument,
} from '@/components/builder/PortalDocument'

export const dynamic = 'force-dynamic'

export default async function PublicPortalPage({
  params,
}: {
  params: Promise<{ portalId: string }>
}) {
  const { portalId } = await params
  const data = await fetchPortal(`/portals/public/${portalId}`)
  if (!data) notFound()
  return <PortalDocument data={data} />
}
