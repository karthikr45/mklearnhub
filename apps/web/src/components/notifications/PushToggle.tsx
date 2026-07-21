'use client'

import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  currentSubscription,
  disablePush,
  enablePush,
  pushSupported,
} from '@/lib/push'

export function PushToggle() {
  const [supported, setSupported] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!pushSupported()) {
      setSupported(false)
      setReady(true)
      return
    }
    currentSubscription()
      .then((sub) => setEnabled(Boolean(sub)))
      .finally(() => setReady(true))
  }, [])

  if (ready && !supported) {
    return (
      <div className="card-elevated p-5">
        <h3 className="text-sm font-semibold">Push notifications</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This browser doesn&apos;t support push notifications.
        </p>
      </div>
    )
  }

  const toggle = async () => {
    setBusy(true)
    try {
      if (enabled) {
        await disablePush()
        setEnabled(false)
        toast.success('Push notifications turned off')
      } else {
        const ok = await enablePush()
        if (ok) {
          setEnabled(true)
          toast.success('Push notifications enabled')
        } else {
          toast.error(
            'Could not enable push. Notifications may be blocked, or push isn’t configured on this server.',
          )
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card-elevated flex items-center justify-between p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </span>
        <div>
          <h3 className="text-sm font-semibold">Push notifications</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Get alerts for answered doubts, quiz battles, and class updates —
            even when LearnHub isn&apos;t open.
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={busy || !ready}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
          enabled
            ? 'border'
            : 'mk-brand-bg text-white'
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {enabled ? 'Turn off' : 'Enable'}
      </button>
    </div>
  )
}
