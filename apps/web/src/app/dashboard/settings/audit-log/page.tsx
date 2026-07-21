'use client'

import { useQuery } from '@tanstack/react-query'
import { Download, RefreshCw, Search, X } from 'lucide-react'
import { useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

interface AuditLog {
  id: string
  timestamp: string
  userName: string
  userEmail: string
  action: string
  resource: string
  status: 'SUCCESS' | 'FAILURE'
  ipAddress: string
  durationMs: number
  oldValue?: unknown
  newValue?: unknown
}

interface AuditResponse {
  items: AuditLog[]
  total: number
  page: number
  limit: number
}

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT']
const RESOURCES = ['user', 'course', 'enrollment', 'apiKey', 'webhook', 'org']

export default function AuditLogPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)

  const [userSearch, setUserSearch] = useState('')
  const [action, setAction] = useState('')
  const [resource, setResource] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page] = useState(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'audit-logs',
      orgId,
      userSearch,
      action,
      resource,
      from,
      to,
      page,
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 25 }
      if (userSearch) params.user = userSearch
      if (action) params.action = action
      if (resource) params.resource = resource
      if (from) params.from = from
      if (to) params.to = to
      const { data } = await api.get<AuditResponse>('/audit/logs', { params })
      return data
    },
    enabled: Boolean(orgId),
    refetchInterval: autoRefresh ? 30_000 : false,
  })

  const expanded = data?.items.find((l) => l.id === expandedId) ?? null

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="A record of security-relevant actions in your organization."
        action={
          <a
            href="/audit/logs/export"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 card-elevated p-4">
        <div className="min-w-[200px] flex-1">
          <label className="text-xs font-medium text-muted-foreground">
            User
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Action
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="mt-1 block rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Resource
          </label>
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="mt-1 block rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {RESOURCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="h-4 w-4 rounded border"
          />
          <RefreshCw
            className={cn(
              'h-4 w-4',
              autoRefresh && isFetching && 'animate-spin',
            )}
          />
          Auto-refresh
        </label>
      </div>

      {!orgId ? (
        <p className="text-sm text-muted-foreground">
          You are not part of an organization yet.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {data && data.items.length > 0 ? (
                data.items.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setExpandedId(log.id)}
                    className="cursor-pointer border-t hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{log.userName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3">{log.resource}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-destructive/10 text-destructive',
                        )}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {log.ipAddress}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.durationMs}ms
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No audit entries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {data.items.length} of {data.total} entries.
        </p>
      ) : null}

      {expanded ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md overflow-y-auto border-l bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{expanded.action}</h3>
                <p className="text-sm text-muted-foreground">
                  {expanded.resource} ·{' '}
                  {new Date(expanded.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setExpandedId(null)}
                className="text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">User</dt>
                <dd>{expanded.userEmail}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">IP address</dt>
                <dd className="font-mono text-xs">{expanded.ipAddress}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{expanded.status}</dd>
              </div>
            </dl>

            <div className="space-y-3">
              <div>
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  Old value
                </div>
                <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {JSON.stringify(expanded.oldValue ?? null, null, 2)}
                </pre>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  New value
                </div>
                <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {JSON.stringify(expanded.newValue ?? null, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
