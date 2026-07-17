const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'webhooksecret',
  'apikey',
  'keyhash',
  'ssn',
  'aadhaar',
  'pan',
  'accountnumber',
  'cvv',
  'pin',
  'otp',
  'x509certificate',
]

const REDACTED = '[REDACTED]'

/** Deep-clone an object, masking any sensitive keys. Safe for logging. */
export function scrub<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) {
    return obj.map((item) => scrub(item)) as unknown as T
  }
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        out[key] = REDACTED
      } else if (value && typeof value === 'object') {
        out[key] = scrub(value)
      } else {
        out[key] = value
      }
    }
    return out as T
  }
  return obj
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return REDACTED
  const visible = local.slice(0, 1)
  return `${visible}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '****'
  const last4 = digits.slice(-4)
  const prefix = phone.trim().startsWith('+') ? `+${digits.slice(0, 2)} ` : ''
  return `${prefix}${'*'.repeat(Math.max(2, digits.length - 6))}${last4}`
}
