import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function resolveKey(key?: string): Buffer {
  const raw = key ?? process.env.ENCRYPTION_KEY
  if (!raw) {
    throw new Error('ENCRYPTION_KEY is not configured (expected 32-byte hex)')
  }
  const buf = Buffer.from(raw, 'hex')
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string')
  }
  return buf
}

/**
 * AES-256-GCM encrypt. Returns a single base64 string encoding iv|tag|ciphertext
 * so it can be stored in one DB column.
 */
export function encrypt(text: string, key?: string): string {
  const k = resolveKey(key)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, k, iv)
  const ciphertext = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext]).toString('base64')
}

export function decrypt(encoded: string, key?: string): string {
  const k = resolveKey(key)
  const data = Buffer.from(encoded, 'base64')
  const iv = data.subarray(0, IV_LENGTH)
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + 16)
  const ciphertext = data.subarray(IV_LENGTH + 16)
  const decipher = createDecipheriv(ALGORITHM, k, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8')
}

/** One-way SHA-256 hash for deterministic lookups (e.g. email search index). */
export function hashPii(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}
