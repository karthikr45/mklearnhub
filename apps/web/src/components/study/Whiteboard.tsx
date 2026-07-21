'use client'

import '@excalidraw/excalidraw/index.css'

import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

// Excalidraw is a heavy, browser-only canvas — never server-render it.
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((m) => m.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading whiteboard…
      </div>
    ),
  },
)

/**
 * Premium collaborative-ready whiteboard. Drawings persist per `boardId` to
 * localStorage so a student's work survives a refresh. `boardId` scopes the
 * storage (e.g. a study group id) so different boards don't collide.
 */
export function Whiteboard({
  boardId = 'default',
  className,
}: {
  boardId?: string
  className?: string
}) {
  const storageKey = `learnhub:whiteboard:${boardId}`
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [initialData, setInitialData] = useState<
    ExcalidrawInitialDataState | null | undefined
  >(undefined)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Load any saved scene (client-only) before mounting the canvas.
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    )
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        setInitialData({
          elements: parsed.elements ?? [],
          appState: { ...parsed.appState, collaborators: [] },
          scrollToContent: true,
        })
      } else {
        setInitialData(null)
      }
    } catch {
      setInitialData(null)
    }
  }, [storageKey])

  const persist = useCallback(
    (elements: readonly unknown[], appState: Record<string, unknown>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        try {
          const { collaborators: _c, ...safeAppState } = appState
          localStorage.setItem(
            storageKey,
            JSON.stringify({ elements, appState: safeAppState }),
          )
        } catch {
          /* storage full / unavailable — drawing still works in-session */
        }
      }, 600)
    },
    [storageKey],
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  // Wait until we've read localStorage so the canvas mounts with saved data.
  if (initialData === undefined) {
    return (
      <div
        className={
          className ??
          'flex h-[70vh] items-center justify-center rounded-2xl border'
        }
      >
        <span className="text-sm text-muted-foreground">Loading whiteboard…</span>
      </div>
    )
  }

  return (
    <div
      className={
        className ??
        'h-[75vh] overflow-hidden rounded-2xl border bg-card shadow-sm'
      }
    >
      <Excalidraw
        excalidrawAPI={(api) => (apiRef.current = api)}
        initialData={initialData}
        theme={theme}
        onChange={(elements, appState) =>
          persist(elements, appState as unknown as Record<string, unknown>)
        }
        UIOptions={{
          canvasActions: {
            loadScene: true,
            saveToActiveFile: false,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  )
}
