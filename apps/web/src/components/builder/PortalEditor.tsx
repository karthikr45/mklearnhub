'use client'

import { Puck, type Data } from '@measured/puck'
import '@measured/puck/puck.css'

import { portalConfig, type PortalMetadata } from '@/lib/puck.config'

export function PortalEditor({
  initialData,
  metadata,
  onPublish,
}: {
  initialData: Data
  metadata: PortalMetadata
  onPublish: (data: Data) => void | Promise<void>
}) {
  return (
    <Puck
      config={portalConfig}
      data={initialData}
      metadata={metadata}
      iframe={{ enabled: false }}
      onPublish={onPublish}
    />
  )
}
