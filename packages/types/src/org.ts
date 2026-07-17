import { z } from 'zod'

import { OrgType, UserRole } from './enums'

export interface OrgSettings {
  features: {
    knowledgeBase: boolean
    lms: boolean
    school: boolean
    portals: boolean
  }
  limits: {
    maxUsers: number
    maxCourses: number
    maxStorageGb: number
  }
  branding: {
    primaryColor?: string
    logoUrl?: string
  }
}

export interface Organization {
  id: string
  name: string
  slug: string
  type: OrgType
  logoUrl?: string | null
  domain?: string | null
  plan: string
  isActive: boolean
  settings: OrgSettings | Record<string, unknown>
  maxUsers: number
  maxCourses: number
  createdAt: Date
  updatedAt: Date
}

export const createOrgSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  type: z.nativeEnum(OrgType).default(OrgType.BUSINESS),
})
export type CreateOrgDto = z.infer<typeof createOrgSchema>

export const updateOrgSchema = createOrgSchema.partial().extend({
  logoUrl: z.string().url().optional(),
  domain: z.string().optional(),
})
export type UpdateOrgDto = z.infer<typeof updateOrgSchema>

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
})
export type InviteUserDto = z.infer<typeof inviteUserSchema>
