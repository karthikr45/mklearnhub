'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Whiteboard } from '@/components/study/Whiteboard'
import { useAuthStore } from '@/lib/store'

export default function WhiteboardPage() {
  const userId = useAuthStore((s) => s.user?.id)
  // Personal scratch board — scoped per user so it survives refreshes.
  const boardId = userId ? `user-${userId}` : 'default'

  return (
    <div>
      <PageHeader
        title="Whiteboard"
        description="Sketch out a problem, work through a proof, or map an idea. Your board saves automatically."
      />
      <Whiteboard boardId={boardId} />
    </div>
  )
}
