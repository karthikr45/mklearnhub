'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Download,
  Loader2,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

interface DataSubjectRequest {
  id: string
  userName: string
  userEmail: string
  type: 'EXPORT' | 'DELETE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requestedAt: string
}

export default function PrivacyPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)
  const queryClient = useQueryClient()

  const [confirmDelete, setConfirmDelete] = useState(false)

  // Retention settings (local state only for this demo).
  const [completedEnrollmentDays, setCompletedEnrollmentDays] = useState(1095)
  const [auditLogDays, setAuditLogDays] = useState(365)
  const [autoDeactivate, setAutoDeactivate] = useState(false)
  const [inactiveDays, setInactiveDays] = useState(180)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['privacy-requests', orgId],
    queryFn: async () => {
      const { data } = await api.get<{ items: DataSubjectRequest[] }>(
        '/privacy/admin/requests',
      )
      return data.items
    },
    enabled: Boolean(orgId),
  })

  const decideMutation = useMutation({
    mutationFn: async (payload: {
      id: string
      decision: 'APPROVED' | 'REJECTED'
    }) => {
      await api.put(`/privacy/admin/requests/${payload.id}`, {
        status: payload.decision,
      })
    },
    onSuccess: () => {
      toast.success('Request updated')
      void queryClient.invalidateQueries({
        queryKey: ['privacy-requests', orgId],
      })
    },
    onError: () => toast.error('Could not update request'),
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      await api.post('/privacy/export-request')
    },
    onSuccess: () =>
      toast.success('Export requested — you will receive an email shortly'),
    onError: () => toast.error('Could not request export'),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.post('/privacy/delete-request')
    },
    onSuccess: () => {
      toast.success('Account deletion requested')
      setConfirmDelete(false)
    },
    onError: () => toast.error('Could not request deletion'),
  })

  const saveRetention = () => {
    // Persisting retention policy would POST here; local-only for the demo.
    toast.success('Retention settings saved')
  }

  return (
    <div>
      <PageHeader
        title="Privacy & Data"
        description="Manage data-subject requests, your personal data, and retention."
      />

      <section className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Data subject requests</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Review export and deletion requests from members.
        </p>

        {!orgId ? (
          <p className="text-sm text-muted-foreground">
            You are not part of an organization yet.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !requests || requests.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No pending requests.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Requested</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="font-medium">{req.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {req.userEmail}
                      </div>
                    </td>
                    <td className="px-4 py-2">{req.type}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : req.status === 'REJECTED'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-500/10 text-amber-600',
                        )}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {req.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              decideMutation.mutate({
                                id: req.id,
                                decision: 'APPROVED',
                              })
                            }
                            disabled={decideMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() =>
                              decideMutation.mutate({
                                id: req.id,
                                decision: 'REJECTED',
                              })
                            }
                            disabled={decideMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Your data</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Download a copy of your data or delete your account.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download my data
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Data retention</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Control how long different kinds of data are kept.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Completed enrollments (days)
            </label>
            <input
              type="number"
              min={1}
              value={completedEnrollmentDays}
              onChange={(e) =>
                setCompletedEnrollmentDays(Number(e.target.value))
              }
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Audit logs (days, min 90)
            </label>
            <input
              type="number"
              min={90}
              value={auditLogDays}
              onChange={(e) =>
                setAuditLogDays(Math.max(90, Number(e.target.value)))
              }
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoDeactivate}
              onChange={(e) => setAutoDeactivate(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            Auto-deactivate inactive users
          </label>
          {autoDeactivate ? (
            <label className="flex items-center gap-2 text-sm">
              After
              <input
                type="number"
                min={1}
                value={inactiveDays}
                onChange={(e) => setInactiveDays(Number(e.target.value))}
                className="w-24 rounded-md border bg-background px-3 py-1.5 text-sm"
              />
              days
            </label>
          ) : null}
        </div>

        <div className="mt-6">
          <button
            onClick={saveRetention}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Save retention settings
          </button>
        </div>
      </section>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Delete your account?</h3>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              This will submit a request to permanently delete your account and
              associated data. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete account
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
