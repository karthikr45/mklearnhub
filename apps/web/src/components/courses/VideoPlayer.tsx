'use client'

import 'plyr/dist/plyr.css'

import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

/** API origin (without the /api/v1 suffix) for statically-served media. */
function mediaBase(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'
  return api.replace(/\/api\/v1\/?$/, '')
}

/** Resolve a stored video URL (relative /uploads path, absolute URL, YouTube). */
function resolveSrc(src: string): string {
  if (src.startsWith('/uploads')) return `${mediaBase()}${src}`
  return src
}

function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (host === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`
    return null
  } catch {
    return null
  }
}

export function VideoPlayer({
  src,
  onEnded,
}: {
  src: string
  onEnded?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const yt = toYouTubeEmbed(src)
  const resolved = resolveSrc(src)

  useEffect(() => {
    if (yt) return
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null
    // Plyr instance type is loaded dynamically; keep it loose to avoid a
    // top-level import that would run Plyr's DOM code during SSR.
    let player: { destroy: () => void } | null = null
    let cancelled = false

    const isHls = resolved.includes('.m3u8')
    if (isHls && !video.canPlayType('application/vnd.apple.mpegurl')) {
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.loadSource(resolved)
        hls.attachMedia(video)
      }
    } else {
      video.src = resolved
    }

    // Premium control skin — loaded client-side only.
    void import('plyr').then(({ default: Plyr }) => {
      if (cancelled || !videoRef.current) return
      player = new Plyr(videoRef.current, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'settings',
          'pip',
          'fullscreen',
        ],
        settings: ['speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      })
    })

    return () => {
      cancelled = true
      if (player) player.destroy()
      if (hls) hls.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [resolved, yt])

  if (yt) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg pt-[56.25%]">
        <iframe
          src={yt}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg bg-black plyr-brand">
      <video ref={videoRef} onEnded={onEnded} className="w-full" playsInline />
    </div>
  )
}
