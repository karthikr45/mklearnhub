'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Send, Webhook, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

interface WebhookItem {
  id: string
  name: string
  url: string
  events: string[]
  status: 'ACTIVE' | 'FAILING'
}

interface Delivery {
  id: string
  timestamp: string
  event: string
  status: 'SUCCESS' | 'FAILED'
  statusCode: number
  responseTimeMs: number
}

const EVENT_GROUPS: { category: string; events: string[] }[] = [
  {
    category: 'Users',
    events: ['user.created', 'user.updated', 'user.deactivated'],
  },
  {
    category: 'Learning',
    events: ['enrollment.created', 'enrollment.completed', 'certificate.issued'],
  },
  { category: 'Assessment', events: ['quiz.passed', 'quiz.failed'] },
  { category: 'Attendance', events: ['attendance.marked'] },
  { category: 'System', events: ['hrms.sync.completed'] },
]

export default function WebhooksPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)
  const queryClient = useQueryClient()

  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks', orgId],
    queryFn: async () => {
      const { data } = await api.get<{ items: WebhookItem[] }>('/webhooks')
      return data.items
    },
    enabled: Boolean(orgId),
  })

  const pingMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/webhooks/${id}/ping`)
    },
    onSuccess: () => toast.success('Ping sent'),
    onError: () => toast.error('Ping failed'),
  })

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="Receive real-time event notifications at your endpoints."
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add webhook
          </button>
        }
      />

      {!orgId ? (
        <p className="text-sm text-muted-foreground">
          You are not part of an organization yet.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !webhooks || webhooks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No webhooks configured.
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((hook) => (
            <div key={hook.id} className="card-elevated">
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 shrink-0 rounded-full',
                      hook.status === 'ACTIVE'
                        ? 'bg-emerald-500'
                        : 'bg-destructive',
                    )}
                    title={hook.status}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <Webhook className="h-4 w-4 text-muted-foreground" />
                      {hook.name}
                    </div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {hook.url}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => pingMutation.mutate(hook.id)}
                    disabled={pingMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Ping
                  </button>
                  <button
                    onClick={() =>
                      setExpandedId((prev) =>
                        prev === hook.id ? null : hook.id,
                      )
                    }
                    className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    {expandedId === hook.id ? 'Hide' : 'Deliveries'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 px-4 pb-4">
                {hook.events.map((e) => (
                  <span
                    key={e}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                  >
                    {e}
                  </span>
                ))}
              </div>

              {expandedId === hook.id ? (
                <div className="border-t p-4">
                  <DeliveriesTable webhookId={hook.id} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <AddWebhookModal
          orgId={orgId ?? null}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            void queryClient.invalidateQueries({ queryKey: ['webhooks', orgId] })
          }}
        />
      ) : null}
    </div>
  )
}

function DeliveriesTable({ webhookId }: { webhookId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['webhook-deliveries', webhookId],
    queryFn: async () => {
      const { data } = await api.get<{ items: Delivery[] }>(
        `/webhooks/${webhookId}/deliveries`,
      )
      return data.items
    },
  })

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading deliveries…</p>

  if (!data || data.length === 0)
    return <p className="text-sm text-muted-foreground">No deliveries yet.</p>

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Timestamp</th>
            <th className="px-4 py-2 font-medium">Event</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Code</th>
            <th className="px-4 py-2 font-medium">Response time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="px-4 py-2 text-muted-foreground">
                {new Date(d.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-2 font-mono text-xs">{d.event}</td>
              <td className="px-4 py-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    d.status === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {d.status}
                </span>
              </td>
              <td className="px-4 py-2">{d.statusCode}</td>
              <td className="px-4 py-2 text-muted-foreground">
                {d.responseTimeMs}ms
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AddWebhookModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string | null
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/webhooks', { name, url, events })
    },
    onSuccess: () => {
      toast.success('Webhook created')
      onCreated()
    },
    onError: () => toast.error('Could not create webhook'),
  })

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto card-elevated p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add webhook</h3>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ops notifications"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Endpoint URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/hooks/learnhub"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Events
            </label>
            <div className="mt-2 space-y-4">
              {EVENT_GROUPS.map((group) => (
                <div key={group.category}>
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">
                    {group.category}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.events.map((event) => (
                      <label
                        key={event}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={events.includes(event)}
                          onChange={() => toggleEvent(event)}
                          className="h-4 w-4 rounded border"
                        />
                        {event}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={
              !orgId ||
              !name ||
              !url ||
              events.length === 0 ||
              createMutation.isPending
            }
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
