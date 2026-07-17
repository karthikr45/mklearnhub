import { z } from 'zod'

import { UserRole } from './enums'

export interface JwtPayload {
  sub: string
  email: string
  orgId: string | null
  role: UserRole
  sessionId: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  orgId: string | null
  avatarUrl?: string
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
export type LoginDto = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  name: z.string().min(1),
  orgName: z.string().min(1).optional(),
  inviteToken: z.string().optional(),
})
export type RegisterDto = z.infer<typeof registerSchema>

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}
