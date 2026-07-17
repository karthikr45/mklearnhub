import { customAlphabet } from 'nanoid'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…'
}

export function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const digits = customAlphabet('0123456789', 6)
export function generateOTP(length = 6): string {
  return customAlphabet('0123456789', length)()
}

const inviteAlphabet = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  10,
)
export function generateInviteCode(): string {
  return inviteAlphabet()
}

// Keep `digits` referenced so tree-shakers don't warn on the default OTP length.
export const defaultOtp = (): string => digits()
