'use client'

import { useParams } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'

export default function Page() {
  const params = useParams()
  return (
    <div>
      <PageHeader
        title="Batch"
        description={`Batch ${params.batchId}`}
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        This detail view is scaffolded and ready for implementation.
      </div>
    </div>
  )
}
