'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import {
  ArrowLeft,
  FileText,
  LinkIcon,
  Send,
  ShieldCheck,
  StickyNote,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { LiveBattle } from '@/components/study/LiveBattle'
import { StudyRoom } from '@/components/study/StudyRoom'
import { Whiteboard } from '@/components/study/Whiteboard'
import { api } from '@/lib/api'
import { getStudySocket } from '@/lib/studySocket'

interface Msg {
  id: string
  body: string
  createdAt: string
  moderationStatus: string
  user: { id: string; name: string; avatarUrl: string | null }
}
interface Resource {
  id: string
  type: 'NOTE' | 'LINK' | 'FILE'
  title: string
  body: string | null
  url: string | null
  fileKey: string | null
  createdAt: string
  user: { id: string; name: string }
}
interface GroupDetail {
  id: string
  name: string
  description: string | null
  members: { role: string; user: { id: string; name: string } }[]
}

function blockedMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string; code?: string } | undefined
    if (data?.message) return data.message
  }
  return fallback
}

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = params.groupId
  const qc = useQueryClient()
  const [tab, setTab] = useState<
    'chat' | 'battle' | 'room' | 'whiteboard' | 'resources' | 'members'
  >('chat')

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => (await api.get<GroupDetail>(`/study-groups/${groupId}`)).data,
    enabled: Boolean(groupId),
  })

  return (
    <div>
      <Link
        href="/dashboard/groups"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All groups
      </Link>

      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{group?.name ?? 'Group'}</h1>
          {group?.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>
      </div>

      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
        <ShieldCheck className="h-3.5 w-3.5" /> Protected space — messages &amp; files are safety-checked
      </div>

      <div className="mb-5 flex gap-1 border-b">
        {(['chat', 'battle', 'room', 'whiteboard', 'resources', 'members'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'battle' ? 'Quiz battle' : t === 'room' ? 'Live room' : t}
          </button>
        ))}
      </div>

      {tab === 'chat' && <ChatTab groupId={groupId} />}
      {tab === 'battle' && <LiveBattle groupId={groupId} />}
      {tab === 'room' && <StudyRoom groupId={groupId} />}
      {tab === 'whiteboard' && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            Work through a problem together on the shared board. Your board saves
            automatically.
          </p>
          <Whiteboard boardId={`group-${groupId}`} />
        </div>
      )}
      {tab === 'resources' && <ResourcesTab groupId={groupId} qc={qc} />}
      {tab === 'members' && (
        <div className="space-y-2">
          {group?.members.map((m) => (
            <div
              key={m.user.id}
              className="flex items-center gap-3 card-elevated p-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {m.user.name.charAt(0)}
              </span>
              <span className="text-sm font-medium">{m.user.name}</span>
              {m.role === 'OWNER' && (
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs">
                  Owner
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Realtime chat over the /study socket. Initial history loads via REST, then
 * live messages + presence arrive over the socket; sends go through the
 * socket so they hit the same child-safety moderation before broadcast.
 */
function ChatTab({ groupId }: { groupId: string }) {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [online, setOnline] = useState<{ userId: string; name: string }[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: history } = useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: async () =>
      (await api.get<Msg[]>(`/study-groups/${groupId}/messages`)).data,
  })

  useEffect(() => {
    if (history) setMessages(history)
  }, [history])

  useEffect(() => {
    const socket = getStudySocket()
    socket.emit('group:join', { groupId })
    const onMessage = (m: Msg) =>
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
    const onPresence = (p: { groupId: string; online: { userId: string; name: string }[] }) => {
      if (p.groupId === groupId) setOnline(p.online)
    }
    const onBlocked = () =>
      toast.error('Your message was blocked to keep the group safe.')
    socket.on('chat:message', onMessage)
    socket.on('presence', onPresence)
    socket.on('chat:blocked', onBlocked)
    return () => {
      socket.emit('group:leave', { groupId })
      socket.off('chat:message', onMessage)
      socket.off('presence', onPresence)
      socket.off('chat:blocked', onBlocked)
    }
  }, [groupId])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  const send = () => {
    const body = text.trim()
    if (!body) return
    getStudySocket().emit('chat:send', { groupId, body })
    setText('')
  }

  return (
    <div>
      {online.length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          {online.length} online: {online.map((o) => o.name.split(' ')[0]).join(', ')}
        </div>
      )}
      <div
        ref={scrollRef}
        className="mb-4 max-h-[26rem] space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-4"
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to your classmates 👋
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {m.user.name.charAt(0)}
              </span>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{m.user.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90">{m.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  )
}

function ResourcesTab({
  groupId,
  qc,
}: {
  groupId: string
  qc: ReturnType<typeof useQueryClient>
}) {
  const [form, setForm] = useState({
    type: 'NOTE' as 'NOTE' | 'LINK' | 'FILE',
    title: '',
    body: '',
    url: '',
    fileName: '',
  })

  const { data: resources } = useQuery({
    queryKey: ['group-resources', groupId],
    queryFn: async () =>
      (await api.get<Resource[]>(`/study-groups/${groupId}/resources`)).data,
  })

  const add = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = { type: form.type, title: form.title }
      if (form.type === 'NOTE' && form.body) payload.body = form.body
      if (form.type === 'LINK' && form.url) payload.url = form.url
      if (form.type === 'FILE' && form.fileName) payload.fileName = form.fileName
      return (await api.post(`/study-groups/${groupId}/resources`, payload)).data
    },
    onSuccess: () => {
      setForm({ type: 'NOTE', title: '', body: '', url: '', fileName: '' })
      qc.invalidateQueries({ queryKey: ['group-resources', groupId] })
      toast.success('Shared with the group')
    },
    onError: (err) =>
      toast.error(blockedMessage(err, 'This could not be shared')),
  })

  const icons = { NOTE: StickyNote, LINK: LinkIcon, FILE: FileText }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* composer */}
      <div className="card-elevated p-4">
        <h3 className="mb-3 text-sm font-semibold">Share study material</h3>
        <div className="mb-3 flex gap-1.5">
          {(['NOTE', 'LINK', 'FILE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setForm({ ...form, type: t })}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                form.type === t
                  ? 'bg-primary text-primary-foreground'
                  : 'border text-muted-foreground'
              }`}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          {form.type === 'NOTE' && (
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write your note…"
              rows={3}
              className="w-full resize-none rounded-md border px-3 py-2 text-sm"
            />
          )}
          {form.type === 'LINK' && (
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://…"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          )}
          {form.type === 'FILE' && (
            <>
              <input
                value={form.fileName}
                onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                placeholder="document-name.pdf"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Documents only (PDF, Word, PowerPoint, Excel, text). Images and
                video aren&apos;t allowed in school groups.
              </p>
            </>
          )}
          <button
            onClick={() => add.mutate()}
            disabled={form.title.trim().length < 1 || add.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {add.isPending ? 'Sharing…' : 'Share'}
          </button>
        </div>
      </div>

      {/* list */}
      <div className="space-y-3">
        {!resources || resources.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No shared material yet.
          </p>
        ) : (
          resources.map((r) => {
            const Icon = icons[r.type]
            return (
              <div key={r.id} className="card-elevated p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{r.title}</span>
                </div>
                {r.body && <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>}
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1 block truncate text-sm text-primary hover:underline"
                  >
                    {r.url}
                  </a>
                )}
                {r.fileKey && (
                  <p className="mt-1 text-sm text-muted-foreground">📄 {r.fileKey}</p>
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Shared by {r.user.name}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
