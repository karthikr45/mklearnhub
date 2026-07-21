'use client'

import { useQuery } from '@tanstack/react-query'
import { Video, VideoOff } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import { api } from '@/lib/api'

interface RoomToken {
  configured: boolean
  url?: string
  token?: string
  room?: string
}

// Load the LiveKit room (and its heavy client) only when a user joins.
const LiveRoomInner = dynamic(() => import('./LiveRoomInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-2xl border text-sm text-muted-foreground">
      Connecting to room…
    </div>
  ),
})

export function StudyRoom({ groupId }: { groupId: string }) {
  const [joined, setJoined] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['room-token', groupId],
    queryFn: async () =>
      (await api.get<RoomToken>(`/rooms/study/${groupId}/token`)).data,
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  if (!data?.configured) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <VideoOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Live rooms aren&apos;t enabled yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Audio &amp; video study rooms require a LiveKit server. Once an admin
          configures it, you&apos;ll be able to hop on a call with your group
          right here.
        </p>
      </div>
    )
  }

  if (joined && data.url && data.token) {
    return (
      <LiveRoomInner
        url={data.url}
        token={data.token}
        onLeave={() => setJoined(false)}
      />
    )
  }

  return (
    <div className="rounded-2xl border p-10 text-center">
      <Video className="mx-auto mb-3 h-10 w-10 text-primary" />
      <p className="font-medium">Live study room</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Join a real-time audio &amp; video call with your group to study
        together, share your screen, and talk through problems.
      </p>
      <button
        onClick={() => setJoined(true)}
        className="mk-brand-bg mt-4 inline-flex items-center gap-1.5 rounded-md px-5 py-2 text-sm font-medium text-white"
      >
        <Video className="h-4 w-4" /> Join room
      </button>
    </div>
  )
}
