'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, KeyRound, Loader2, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { BulkImport } from '@learnhub/ui'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

type HrmsProvider =
  | 'SAP_SF'
  | 'ORACLE_HCM'
  | 'WORKDAY'
  | 'DARWINBOX'
  | 'ZOHO_PEOPLE'
  | 'CUSTOM'

const HRMS_PROVIDERS: { id: HrmsProvider; name: string }[] = [
  { id: 'SAP_SF', name: 'SAP SuccessFactors' },
  { id: 'ORACLE_HCM', name: 'Oracle HCM' },
  { id: 'WORKDAY', name: 'Workday' },
  { id: 'DARWINBOX', name: 'Darwinbox' },
  { id: 'ZOHO_PEOPLE', name: 'Zoho People' },
  { id: 'CUSTOM', name: 'Custom' },
]

const FIELD_MAP_ROWS = [
  'employeeId',
  'email',
  'firstName',
  'lastName',
  'department',
  'manager',
]

type ImportType = 'USERS' | 'ENROLLMENTS' | 'GRADES' | 'ATTENDANCE'

const TEMPLATE_COLUMNS: Record<ImportType, string[]> = {
  USERS: ['email', 'firstName', 'lastName', 'role'],
  ENROLLMENTS: ['email', 'courseCode', 'enrolledAt'],
  GRADES: ['email', 'courseCode', 'score'],
  ATTENDANCE: ['email', 'sessionCode', 'status', 'date'],
}

interface HrmsConfig {
  provider?: HrmsProvider
  webhookUrl?: string
  fieldMapping?: Record<string, string>
  lastSyncAt?: string
  lastSyncStatus?: 'SUCCESS' | 'FAILED' | 'PENDING'
}

interface SyncLog {
  id: string
  startedAt: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  recordsProcessed: number
  message?: string
}

export default function IntegrationsPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)
  const queryClient = useQueryClient()

  const [provider, setProvider] = useState<HrmsProvider>('WORKDAY')
  const [copied, setCopied] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [importType, setImportType] = useState<ImportType>('USERS')

  const { data: config } = useQuery({
    queryKey: ['hrms-config', orgId],
    queryFn: async () => {
      const { data } = await api.get<HrmsConfig>('/hrms/config')
      return data
    },
    enabled: Boolean(orgId),
  })

  const { data: logs } = useQuery({
    queryKey: ['hrms-logs', orgId],
    queryFn: async () => {
      const { data } = await api.get<{ items: SyncLog[] }>('/hrms/sync/logs')
      return data.items
    },
    enabled: Boolean(orgId),
  })

  const webhookUrl =
    config?.webhookUrl ??
    `https://api.learnhub.com/api/v1/hrms/webhook/${orgId ?? 'org'}`

  const generateSecret = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ secret: string }>('/hrms/configure', {
        provider,
      })
      return data.secret
    },
    onSuccess: (value) => {
      setSecret(value)
      void queryClient.invalidateQueries({ queryKey: ['hrms-config', orgId] })
    },
    onError: () => toast.error('Could not generate secret'),
  })

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Sync your HRMS and import data in bulk."
      />

      <section className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">HRMS sync</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Connect your HR system to keep members in sync.
        </p>

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as HrmsProvider)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {HRMS_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Webhook endpoint
            </label>
            <div className="mt-1 flex gap-2">
              <input
                readOnly
                value={webhookUrl}
                className="flex-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs"
              />
              <button
                onClick={copyWebhook}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => generateSecret.mutate()}
            disabled={generateSecret.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {generateSecret.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Generate secret
          </button>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">Field mapping</h3>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">LearnHub field</th>
                  <th className="px-4 py-2 font-medium">HRMS field</th>
                </tr>
              </thead>
              <tbody>
                {FIELD_MAP_ROWS.map((field) => (
                  <tr key={field} className="border-t">
                    <td className="px-4 py-2 font-medium">{field}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {config?.fieldMapping?.[field] ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">Recent syncs</h3>
          {config?.lastSyncAt ? (
            <p className="mb-2 text-xs text-muted-foreground">
              Last sync {new Date(config.lastSyncAt).toLocaleString()} —{' '}
              {config.lastSyncStatus ?? 'UNKNOWN'}
            </p>
          ) : null}
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Records</th>
                  <th className="px-4 py-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="px-4 py-2">
                        {new Date(log.startedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <SyncStatus status={log.status} />
                      </td>
                      <td className="px-4 py-2">{log.recordsProcessed}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {log.message ?? '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      No syncs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Bulk CSV import</h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Upload a CSV to import records in bulk.
        </p>

        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground">
            Import type
          </label>
          <div className="mt-2 inline-flex flex-wrap gap-2">
            {(Object.keys(TEMPLATE_COLUMNS) as ImportType[]).map((t) => (
              <button
                key={t}
                onClick={() => setImportType(t)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm font-medium',
                  importType === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:bg-muted',
                )}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <BulkImport
          importType={importType}
          templateColumns={TEMPLATE_COLUMNS[importType]}
          onComplete={(result) =>
            toast.success(
              `Imported ${result.success} rows (${result.failed} skipped)`,
            )
          }
        />
      </section>

      {secret !== null ? (
        <SecretModal secret={secret} onClose={() => setSecret(null)} />
      ) : null}
    </div>
  )
}

function SyncStatus({ status }: { status: SyncLog['status'] }) {
  const map: Record<SyncLog['status'], string> = {
    SUCCESS: 'bg-emerald-500/10 text-emerald-600',
    FAILED: 'bg-destructive/10 text-destructive',
    PENDING: 'bg-amber-500/10 text-amber-600',
  }
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        map[status],
      )}
    >
      {status}
    </span>
  )
}

function SecretModal({
  secret,
  onClose,
}: {
  secret: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret)
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
            <h3 className="text-lg font-semibold">Webhook secret</h3>
            <p className="text-sm text-muted-foreground">
              Copy this now — it will never be shown again.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <code className="flex-1 break-all rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs">
            {secret}
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
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
