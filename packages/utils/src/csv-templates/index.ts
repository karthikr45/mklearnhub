/**
 * CSV template definitions and row validation for bulk import jobs.
 * Kept side-effect free so it can be safely compiled to dist and consumed
 * as a runtime dependency.
 */

export type CsvTemplateType = 'USERS' | 'ENROLLMENTS' | 'GRADES' | 'ATTENDANCE'

export interface CsvTemplate {
  headers: string[]
  required: string[]
}

export const CSV_TEMPLATES: Record<CsvTemplateType, CsvTemplate> = {
  USERS: {
    headers: [
      'email',
      'firstName',
      'lastName',
      'role',
      'department',
      'employeeId',
      'branchCode',
      'phone',
      'password',
    ],
    required: ['email', 'firstName', 'lastName'],
  },
  ENROLLMENTS: {
    headers: ['userEmail', 'courseSlug', 'enrolledAt', 'expiresAt'],
    required: ['userEmail', 'courseSlug'],
  },
  GRADES: {
    headers: ['userEmail', 'subject', 'score', 'maxScore', 'term', 'academicYear'],
    required: ['userEmail', 'subject', 'score', 'maxScore'],
  },
  ATTENDANCE: {
    headers: ['userEmail', 'batchName', 'date', 'status'],
    required: ['userEmail', 'batchName', 'date', 'status'],
  },
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

function isNumeric(value: string): boolean {
  return value.trim() !== '' && !Number.isNaN(Number(value))
}

/**
 * Validate a single CSV row for a given import type. Checks that required
 * fields are present and applies basic format checks (email, date, numeric,
 * status enum). Returns `valid` plus a list of human-readable errors.
 */
export function validateRow(
  type: CsvTemplateType,
  row: Record<string, string>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const template = CSV_TEMPLATES[type]

  for (const field of template.required) {
    const value = row[field]
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // Email format checks (field name differs per template).
  const emailField = type === 'USERS' ? 'email' : 'userEmail'
  const emailValue = row[emailField]
  if (emailValue && !EMAIL_RE.test(emailValue.trim())) {
    errors.push(`Invalid email format: ${emailField}`)
  }

  if (type === 'GRADES') {
    if (row.score !== undefined && row.score.trim() !== '' && !isNumeric(row.score)) {
      errors.push('score must be numeric')
    }
    if (
      row.maxScore !== undefined &&
      row.maxScore.trim() !== '' &&
      !isNumeric(row.maxScore)
    ) {
      errors.push('maxScore must be numeric')
    }
  }

  if (type === 'ATTENDANCE') {
    if (row.date && !DATE_RE.test(row.date.trim())) {
      errors.push('date must be in YYYY-MM-DD format')
    }
    if (row.status && !ATTENDANCE_STATUSES.includes(row.status.trim().toUpperCase())) {
      errors.push(`status must be one of ${ATTENDANCE_STATUSES.join('/')}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/** Return a header-only CSV string for the given import type (a downloadable template). */
export function generateTemplateCsv(type: CsvTemplateType): string {
  return `${CSV_TEMPLATES[type].headers.join(',')}\n`
}
