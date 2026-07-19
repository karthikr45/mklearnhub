'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { Fragment, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  rateLimit: number
  lastUsedAt?: string | null
  createdAt: string
}

interface UsagePoint {
  date: string
  requests: number
}

const SCOPES = [
  'read:users',
  'write:users',
  'read:courses',
  'write:enrollments',
  'read:analytics',
] as const
type Scope = (typeof SCOPES)[number]

export default function ApiKeysPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)
  const queryClient = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys', orgId],
    queryFn: async () => {
      const { data } = await api.get<{ items: ApiKey[] }>('/api-keys')
      return data.items
    },
    enabled: Boolean(orgId),
  })

  const rotateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put<{ key: string }>(`/api-keys/${id}/rotate`)
      return data.key
    },
    onSuccess: (key) => {
      setRawKey(key)
      void queryClient.invalidateQueries({ queryKey: ['api-keys', orgId] })
    },
    onError: () => toast.error('Could not rotate key'),
  })

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`)
    },
    onSuccess: () => {
      toast.success('Key revoked')
      void queryClient.invalidateQueries({ queryKey: ['api-keys', orgId] })
    },
    onError: () => toast.error('Could not revoke key'),
  })

  const handleRevoke = (id: string) => {
    if (window.confirm('Revoke this key? Any client using it will stop working.'))
      revokeMutation.mutate(id)
  }

  const handleRotate = (id: string) => {
    if (window.confirm('Rotate this key? The old secret will stop working.'))
      rotateMutation.mutate(id)
  }

  return (
    <div>
      <PageHeader
        title="API Keys"
        description="Programmatic access to the LearnHub API."
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create key
          </button>
        }
      />

      {!orgId ? (
        <p className="text-sm text-muted-foreground">
          You are not part of an organization yet.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !keys || keys.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No API keys yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Prefix</th>
                <th className="px-4 py-3 font-medium">Scopes</th>
                <th className="px-4 py-3 font-medium">Rate limit</th>
                <th className="px-4 py-3 font-medium">Last used</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <Fragment key={key.id}>
                  <tr
                    className="cursor-pointer border-t hover:bg-muted/30"
                    onClick={() =>
                      setExpandedId((prev) => (prev === key.id ? null : key.id))
                    }
                  >
                    <td className="px-4 py-3 font-medium">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {key.prefix}…
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{key.rateLimit}/min</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleRotate(key.id)}
                          disabled={rotateMutation.isPending}
                          className="rounded-md p-1.5 hover:bg-muted"
                          title="Rotate"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRevoke(key.id)}
                          disabled={revokeMutation.isPending}
                          className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                          title="Revoke"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === key.id ? (
                    <tr className="border-t bg-muted/20">
                      <td colSpan={7} className="px-4 py-4">
                        <UsagePanel keyId={key.id} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate ? (
        <CreateKeyModal
          orgId={orgId ?? null}
          onClose={() => setShowCreate(false)}
          onCreated={(key) => {
            setShowCreate(false)
            setRawKey(key)
            void queryClient.invalidateQueries({ queryKey: ['api-keys', orgId] })
          }}
        />
      ) : null}

      {rawKey !== null ? (
        <RawKeyModal rawKey={rawKey} onClose={() => setRawKey(null)} />
      ) : null}
    </div>
  )
}

function UsagePanel({ keyId }: { keyId: string }) {
  const placeholder: UsagePoint[] = [
    { date: 'Mon', requests: 120 },
    { date: 'Tue', requests: 210 },
    { date: 'Wed', requests: 180 },
    { date: 'Thu', requests: 260 },
    { date: 'Fri', requests: 320 },
    { date: 'Sat', requests: 90 },
    { date: 'Sun', requests: 140 },
  ]

  const { data } = useQuery({
    queryKey: ['api-key-usage', keyId],
    queryFn: async () => {
      const { data } = await api.get<{ series: UsagePoint[] }>(
        `/api-keys/${keyId}/usage`,
      )
      return data.series
    },
    retry: false,
  })

  const series = data && data.length > 0 ? data : placeholder

  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="mb-3 text-sm font-semibold">Requests over time</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="requests"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CreateKeyModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string | null
  onClose: () => void
  onCreated: (rawKey: string) => void
}) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<Scope[]>(['read:users'])
  const [rateLimit, setRateLimit] = useState(60)
  const [ipAllowlist, setIpAllowlist] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: {
        name: string
        scopes: Scope[]
        rateLimit: number
        ipAllowlist?: string[]
        expiresAt?: string
      } = { name, scopes, rateLimit }
      const ips = ipAllowlist
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
      if (ips.length > 0) payload.ipAllowlist = ips
      if (expiresAt) payload.expiresAt = expiresAt
      const { data } = await api.post<{ key: string }>('/api-keys', payload)
      return data.key
    },
    onSuccess: (key) => onCreated(key),
    onError: () => toast.error('Could not create key'),
  })

  const toggleScope = (scope: Scope) => {
    setScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope],
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create API key</h3>
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
              placeholder="Production server"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Scopes
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SCOPES.map((scope) => (
                <label
                  key={scope}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="h-4 w-4 rounded border"
                  />
                  {scope}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Rate limit (requests/min)
            </label>
            <input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              min={1}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              IP allowlist (one per line, optional)
            </label>
            <textarea
              value={ipAllowlist}
              onChange={(e) => setIpAllowlist(e.target.value)}
              rows={3}
              placeholder="203.0.113.0&#10;198.51.100.24"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Expiry date (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
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
              !orgId || !name || scopes.length === 0 || createMutation.isPending
            }
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

function RawKeyModal({
  rawKey,
  onClose,
}: {
  rawKey: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rawKey)
      setCopied(true)
    } catch {
      toast.error('Copy failed')
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Your new API key</h3>
            <p className="text-sm text-destructive">
              Copy it now — it will never be shown again.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <code className="flex-1 break-all rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs">
            {rawKey}
          </code>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
