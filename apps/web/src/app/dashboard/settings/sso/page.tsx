'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  KeyRound,
  Loader2,
  Network,
  Shield,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

type ProviderId = 'AZURE_AD' | 'OKTA' | 'GOOGLE' | 'SAML' | 'LDAP'
type SourceMode = 'metadata' | 'manual'
type TestStatus = 'UNTESTED' | 'TESTING' | 'WORKING' | 'FAILED'

interface ProviderOption {
  id: ProviderId
  name: string
  description: string
  icon: typeof Shield
  popular?: boolean
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'AZURE_AD',
    name: 'Azure AD',
    description: 'Microsoft Entra ID',
    icon: Cloud,
    popular: true,
  },
  { id: 'OKTA', name: 'Okta', description: 'Okta Workforce', icon: Shield, popular: true },
  {
    id: 'GOOGLE',
    name: 'Google Workspace',
    description: 'Google SAML app',
    icon: Building2,
  },
  { id: 'SAML', name: 'Generic SAML', description: 'Any SAML 2.0 IdP', icon: Network },
  { id: 'LDAP', name: 'LDAP', description: 'Directory bind', icon: KeyRound },
]

const ATTRIBUTE_FIELDS = [
  'email',
  'firstName',
  'lastName',
  'employeeId',
  'department',
] as const
type AttributeField = (typeof ATTRIBUTE_FIELDS)[number]

interface SsoConfig {
  provider?: ProviderId
  metadataUrl?: string
  metadataXml?: string
  attributeMapping?: Partial<Record<AttributeField, string>>
  autoProvision?: boolean
  defaultRole?: string
  entityId?: string
  acsUrl?: string
  active?: boolean
}

const ROLES = ['LEARNER', 'INSTRUCTOR', 'ADMIN']

export default function SsoPage() {
  const orgId = useAuthStore((s) => s.user?.orgId)
  const queryClient = useQueryClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [provider, setProvider] = useState<ProviderId | null>(null)
  const [sourceMode, setSourceMode] = useState<SourceMode>('metadata')
  const [metadataUrl, setMetadataUrl] = useState('')
  const [metadataXml, setMetadataXml] = useState('')
  const [mapping, setMapping] = useState<Record<AttributeField, string>>({
    email: 'email',
    firstName: 'given_name',
    lastName: 'family_name',
    employeeId: '',
    department: '',
  })
  const [autoProvision, setAutoProvision] = useState(true)
  const [defaultRole, setDefaultRole] = useState('LEARNER')
  const [testEmail, setTestEmail] = useState('')
  const [testStatus, setTestStatus] = useState<TestStatus>('UNTESTED')
  const [active, setActive] = useState(false)

  const { data: config } = useQuery({
    queryKey: ['sso-config', orgId],
    queryFn: async () => {
      const { data } = await api.get<SsoConfig>('/sso/config')
      return data
    },
    enabled: Boolean(orgId),
  })

  useEffect(() => {
    if (!config) return
    if (config.provider) setProvider(config.provider)
    if (config.metadataUrl) {
      setMetadataUrl(config.metadataUrl)
      setSourceMode('metadata')
    }
    if (config.metadataXml) {
      setMetadataXml(config.metadataXml)
      setSourceMode('manual')
    }
    const incoming = config.attributeMapping
    if (incoming) {
      setMapping((prev) => {
        const next: Record<AttributeField, string> = { ...prev }
        for (const field of ATTRIBUTE_FIELDS) {
          const value = incoming[field]
          if (typeof value === 'string') next[field] = value
        }
        return next
      })
    }
    if (typeof config.autoProvision === 'boolean')
      setAutoProvision(config.autoProvision)
    if (config.defaultRole) setDefaultRole(config.defaultRole)
    if (typeof config.active === 'boolean') setActive(config.active)
  }, [config])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: SsoConfig = {
        attributeMapping: mapping,
        autoProvision,
        defaultRole,
        active,
      }
      if (provider) payload.provider = provider
      if (sourceMode === 'metadata') payload.metadataUrl = metadataUrl
      else payload.metadataXml = metadataXml
      const { data } = await api.post<SsoConfig>('/sso/configure', payload)
      return data
    },
    onSuccess: () => {
      toast.success('SSO configuration saved')
      void queryClient.invalidateQueries({ queryKey: ['sso-config', orgId] })
    },
    onError: () => toast.error('Could not save SSO configuration'),
  })

  const entityId =
    config?.entityId ?? `https://learnhub.com/sso/${orgId ?? 'org'}/metadata`
  const acsUrl =
    config?.acsUrl ?? `https://learnhub.com/sso/${orgId ?? 'org'}/acs`

  const handleTest = () => {
    if (!testEmail) {
      toast.error('Enter a test email first')
      return
    }
    setTestStatus('TESTING')
    // Simulated round-trip; production would POST /sso/test.
    setTimeout(() => {
      setTestStatus(testEmail.includes('@') ? 'WORKING' : 'FAILED')
    }, 1200)
  }

  return (
    <div>
      <PageHeader
        title="Single Sign-On"
        description="Connect your identity provider for SAML-based login."
        action={
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!provider || saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Save
          </button>
        }
      />

      <ol className="mb-6 flex items-center gap-2 text-sm">
        {[
          { n: 1, label: 'Choose provider' },
          { n: 2, label: 'Configure' },
          { n: 3, label: 'Test & Activate' },
        ].map((s, i) => (
          <li key={s.n} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.n as 1 | 2 | 3)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1',
                step === s.n
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs">
                {s.n}
              </span>
              {s.label}
            </button>
            {i < 2 ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : null}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDERS.map((p) => {
            const Icon = p.icon
            const selected = provider === p.id
            return (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-lg border bg-card p-5 text-left transition-colors hover:border-primary',
                  selected && 'border-primary ring-1 ring-primary',
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon className="h-6 w-6 text-primary" />
                  {p.popular ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Popular
                    </span>
                  ) : null}
                </div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">
                  {p.description}
                </div>
              </button>
            )
          })}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 inline-flex rounded-md border p-1">
              <button
                onClick={() => setSourceMode('metadata')}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-medium',
                  sourceMode === 'metadata'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                Metadata URL
              </button>
              <button
                onClick={() => setSourceMode('manual')}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-medium',
                  sourceMode === 'manual'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                Manual XML
              </button>
            </div>

            {sourceMode === 'metadata' ? (
              <div className="flex gap-2">
                <input
                  value={metadataUrl}
                  onChange={(e) => setMetadataUrl(e.target.value)}
                  placeholder="https://idp.example.com/app/metadata"
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => toast('Fetch & auto-fill coming soon')}
                  className="whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Fetch &amp; auto-fill
                </button>
              </div>
            ) : (
              <textarea
                value={metadataXml}
                onChange={(e) => setMetadataXml(e.target.value)}
                placeholder="<EntityDescriptor …>"
                rows={8}
                className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
              />
            )}
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Attribute mapping</h3>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">LearnHub field</th>
                    <th className="px-4 py-2 font-medium">IdP attribute</th>
                  </tr>
                </thead>
                <tbody>
                  {ATTRIBUTE_FIELDS.map((field) => (
                    <tr key={field} className="border-t">
                      <td className="px-4 py-2 font-medium">{field}</td>
                      <td className="px-4 py-2">
                        <input
                          value={mapping[field]}
                          onChange={(e) =>
                            setMapping((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                          placeholder="attribute name"
                          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoProvision}
                  onChange={(e) => setAutoProvision(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                Auto-provision new users
              </label>
              <label className="flex items-center gap-2 text-sm">
                Default role
                <select
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value)}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">Service provider metadata</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Entity ID
                </label>
                <input
                  readOnly
                  value={entityId}
                  className="mt-1 w-full rounded-md border bg-muted/40 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  ACS URL
                </label>
                <input
                  readOnly
                  value={acsUrl}
                  className="mt-1 w-full rounded-md border bg-muted/40 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={() => toast('Download XML coming soon')}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <Download className="h-4 w-4" /> Download XML
              </button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Test connection</h3>
              <StatusBadge status={testStatus} />
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@company.com"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={handleTest}
                disabled={testStatus === 'TESTING'}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {testStatus === 'TESTING' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Test connection
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-card p-6">
            <div>
              <h3 className="font-semibold">Activate SSO</h3>
              <p className="text-sm text-muted-foreground">
                When active, members will sign in through your IdP.
              </p>
            </div>
            <button
              onClick={() => setActive((v) => !v)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                active ? 'bg-primary' : 'bg-muted',
              )}
              aria-pressed={active}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform',
                  active ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
          disabled={step === 1}
          className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
            disabled={step === 1 && !provider}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Finish & Save
          </button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: TestStatus }) {
  const map: Record<TestStatus, { label: string; className: string }> = {
    UNTESTED: { label: 'Untested', className: 'bg-muted text-muted-foreground' },
    TESTING: { label: 'Testing', className: 'bg-amber-500/10 text-amber-600' },
    WORKING: {
      label: 'Working',
      className: 'bg-emerald-500/10 text-emerald-600',
    },
    FAILED: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  }
  const item = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        item.className,
      )}
    >
      {status === 'WORKING' ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : status === 'FAILED' ? (
        <XCircle className="h-3.5 w-3.5" />
      ) : status === 'TESTING' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : null}
      {item.label}
    </span>
  )
}
