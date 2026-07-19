'use client'

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

    const isHls = resolved.includes('.m3u8')
    if (isHls && !video.canPlayType('application/vnd.apple.mpegurl')) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(resolved)
        hls.attachMedia(video)
        return () => hls.destroy()
      }
    }
    video.src = resolved
    return () => {
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
    <video
      ref={videoRef}
      controls
      onEnded={onEnded}
      className="w-full rounded-lg bg-black"
    />
  )
}
