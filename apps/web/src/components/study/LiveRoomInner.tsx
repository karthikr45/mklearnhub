'use client'

import '@livekit/components-styles'

import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react'

/**
 * The actual LiveKit connection. Kept in its own module so it (and the heavy
 * livekit-client dependency) is only loaded once a room is enabled and a token
 * has been minted.
 */
export default function LiveRoomInner({
  url,
  token,
  onLeave,
}: {
  url: string
  token: string
  onLeave: () => void
}) {
  return (
    <div className="h-[70vh] overflow-hidden rounded-2xl border" data-lk-theme="default">
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connect
        video
        audio
        onDisconnected={onLeave}
        style={{ height: '100%' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  )
}
