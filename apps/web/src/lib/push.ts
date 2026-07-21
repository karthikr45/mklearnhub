import { api } from '@/lib/api'

/** Web Push support requires SW + PushManager + Notification APIs. */
export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js')
  if (existing) return existing
  return navigator.serviceWorker.register('/sw.js')
}

/** True if this browser already has an active push subscription. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) return null
  return reg.pushManager.getSubscription()
}

/**
 * Fetch the server's VAPID key, subscribe this browser, and register the
 * subscription with the API. Returns false when push isn't configured/allowed.
 */
export async function enablePush(): Promise<boolean> {
  if (!pushSupported()) return false

  const { data } = await api.get<{ publicKey: string | null; configured: boolean }>(
    '/push/public-key',
  )
  if (!data.configured || !data.publicKey) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await registerServiceWorker()
  await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Uint8Array is a valid BufferSource at runtime; the cast sidesteps the
      // ArrayBufferLike/ArrayBuffer generic mismatch in newer TS lib types.
      applicationServerKey: urlBase64ToUint8Array(data.publicKey) as BufferSource,
    }))

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } }
  if (!json.endpoint || !json.keys) return false
  await api.post('/push/subscribe', { endpoint: json.endpoint, keys: json.keys })
  return true
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe().catch(() => undefined)
  await api.post('/push/unsubscribe', { endpoint }).catch(() => undefined)
}
