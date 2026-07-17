'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/api'

const STEPS = ['Organization', 'Type', 'Branding', 'Done'] as const

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [type, setType] = useState('BUSINESS')

  const finish = async () => {
    try {
      await api.post('/organizations', { name, type })
      toast.success('Organization created')
      router.push('/dashboard')
    } catch {
      toast.error('Could not create organization')
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                i <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-8">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Name your organization</h2>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">What kind of organization?</h2>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="BUSINESS">Business</option>
              <option value="SCHOOL">School</option>
              <option value="INSTITUTE">Institute</option>
              <option value="COACHING_CENTER">Coaching Center</option>
            </select>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Branding</h2>
            <p className="text-sm text-muted-foreground">
              You can configure your logo and colors later in Settings.
            </p>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">All set!</h2>
            <p className="text-sm text-muted-foreground">
              Create <strong>{name || 'your organization'}</strong> and head to
              the dashboard.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              disabled={step === 0 && !name}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={finish}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Create
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
