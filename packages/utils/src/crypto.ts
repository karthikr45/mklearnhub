import { randomBytes } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function generateToken(length = 32): string {
  return randomBytes(length).toString('hex')
}

export function generateShortId(): string {
  return nanoid()
}
