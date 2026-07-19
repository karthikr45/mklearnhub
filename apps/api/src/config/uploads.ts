import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

/** Where uploaded media is stored and served from (`/uploads/*`). */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads')

export function ensureUploadDir(): void {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}
