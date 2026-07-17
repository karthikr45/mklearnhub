'use client'

import { useParams } from 'next/navigation'

import { PageHeader } from '@/components/layout/PageHeader'

export default function Page() {
  const params = useParams()
  return (
    <div>
      <PageHeader
        title="Quiz Results"
        description={`Results for ${params.quizId}`}
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        This detail view is scaffolded and ready for implementation.
      </div>
    </div>
  )
}
