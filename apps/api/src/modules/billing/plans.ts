import { Plan } from '@learnhub/db'

export interface PlanCatalogEntry {
  plan: Plan
  name: string
  /** Monthly price in INR. `null` means "contact sales" (custom pricing). */
  priceInr: number | null
  interval: 'month'
  maxUsers: number
  maxCourses: number
  features: string[]
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    plan: Plan.FREE,
    name: 'Free',
    priceInr: 0,
    interval: 'month',
    maxUsers: 5,
    maxCourses: 5,
    features: [
      'Up to 5 members',
      'Up to 5 courses',
      'Community support',
      'Core knowledge base & LMS',
    ],
  },
  {
    plan: Plan.TEAMS,
    name: 'Teams',
    priceInr: 2999,
    interval: 'month',
    maxUsers: 50,
    maxCourses: 50,
    features: [
      'Up to 50 members',
      'Up to 50 courses',
      'Email support',
      'Advanced analytics',
      'Custom branding',
    ],
  },
  {
    plan: Plan.INSTITUTE,
    name: 'Institute',
    priceInr: 9999,
    interval: 'month',
    maxUsers: 500,
    maxCourses: 200,
    features: [
      'Up to 500 members',
      'Up to 200 courses',
      'Priority support',
      'School management suite',
      'SCORM / xAPI',
      'Audit logs',
    ],
  },
  {
    plan: Plan.ENTERPRISE,
    name: 'Enterprise',
    priceInr: null,
    interval: 'month',
    maxUsers: 100000,
    maxCourses: 100000,
    features: [
      'Unlimited members & courses',
      'SSO & HRMS sync',
      'API gateway & white-label',
      'Compliance (ISO 27001)',
      'Dedicated support & SLA',
    ],
  },
]

export function getPlan(plan: Plan): PlanCatalogEntry | undefined {
  return PLAN_CATALOG.find((entry) => entry.plan === plan)
}
