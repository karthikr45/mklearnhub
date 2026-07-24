'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

interface Attachment {
  id: string
  title: string
  fileName: string
  contentType: string
  fileSize: number
}

/** Human-readable byte size. */
function fmtSize(bytes: number): string {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

/** Pick an icon from the file's mime type. */
function iconFor(contentType: string) {
  const t = contentType.toLowerCase()
  if (t.startsWith('image/')) return FileImage
  if (t.startsWith('audio/')) return FileAudio
  if (t.startsWith('video/')) return FileVideo
  if (t.includes('zip') || t.includes('compressed') || t.includes('rar')) return FileArchive
  if (t.includes('sheet') || t.includes('excel') || t.includes('csv')) return FileSpreadsheet
  return FileText
}

export function LessonAttachments({
  lessonId,
  canEdit,
}: {
  lessonId: string
  canEdit: boolean
}) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)

  const { data: attachments } = useQuery({
    queryKey: ['lesson-attachments', lessonId],
    queryFn: async () =>
      (await api.get<Attachment[]>(`/lessons/${lessonId}/attachments`)).data,
    enabled: Boolean(lessonId),
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      setUploadPct(0)
      const contentType = file.type || 'application/octet-stream'
      // 1) presigned direct-to-storage URL
      const { data: presign } = await api.post<{ url: string; key: string }>(
        `/lessons/${lessonId}/attachments/upload-url`,
        { filename: file.name, contentType },
      )
      // 2) PUT straight to storage with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', presign.url)
        xhr.setRequestHeader('Content-Type', contentType)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(
                new Error(
                  `Storage rejected the upload (HTTP ${xhr.status}). Add a PUT CORS rule to the bucket for this origin.`,
                ),
              )
        xhr.onerror = () =>
          reject(new Error('Could not reach storage (missing CORS PUT rule?).'))
        xhr.send(file)
      })
      setUploadPct(100)
      // 3) register the object on the lesson
      await api.post(`/lessons/${lessonId}/attachments`, {
        storageKey: presign.key,
        fileName: file.name,
        contentType,
        fileSize: file.size,
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['lesson-attachments', lessonId] })
      toast.success('Resource attached')
      setUploadPct(null)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setUploadPct(null)
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/attachments/${id}`)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['lesson-attachments', lessonId] })
      toast.success('Resource removed')
    },
    onError: () => toast.error('Could not remove resource'),
  })

  const download = async (id: string) => {
    try {
      const { data } = await api.get<{ url: string }>(`/attachments/${id}/download`)
      window.open(data.url, '_blank', 'noopener')
    } catch {
      toast.error('Could not open this file')
    }
  }

  const hasAny = (attachments?.length ?? 0) > 0
  if (!hasAny && !canEdit) return null

  return (
    <div className="card-elevated mt-4 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Paperclip className="h-4 w-4 text-primary" />
        Resources & downloads
      </div>

      {hasAny ? (
        <ul className="space-y-2">
          {attachments!.map((a) => {
            const Icon = iconFor(a.contentType)
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <button
                  onClick={() => download(a.id)}
                  className="flex-1 truncate text-left hover:underline"
                  title={a.fileName}
                >
                  {a.title}
                </button>
                {a.fileSize > 0 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtSize(a.fileSize)}
                  </span>
                )}
                <button
                  onClick={() => download(a.id)}
                  aria-label="Download"
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Download className="h-4 w-4" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => remove.mutate(a.id)}
                    disabled={remove.isPending}
                    aria-label="Remove"
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No resources yet.</p>
      )}

      {canEdit && (
        <div className="mt-3 border-t pt-3">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload.mutate(f)
              e.target.value = ''
            }}
          />
          {uploadPct !== null ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {uploadPct < 100 ? `Uploading… ${uploadPct}%` : 'Finishing…'}
                </span>
                <span className="font-medium">{uploadPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              <Upload className="h-4 w-4" />
              Attach a file (PDF, slides, docs, images…)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
