export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge?: number
  preventReuse?: number
  preventCommonPasswords: boolean
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  preventCommonPasswords: true,
}

/**
 * A compact set of the most frequently breached passwords. In production this
 * would be backed by the full top-1000 (or a k-anonymity HIBP lookup); this
 * list keeps the check dependency-free and fast for local/dev use.
 */
export const COMMON_PASSWORDS = new Set<string>([
  '123456',
  '123456789',
  'password',
  'password1',
  'qwerty',
  'qwerty123',
  'abc123',
  '111111',
  '12345678',
  'iloveyou',
  'admin',
  'admin123',
  'welcome',
  'welcome1',
  'letmein',
  'monkey',
  'dragon',
  'football',
  'sunshine',
  'princess',
  'passw0rd',
  '1q2w3e4r',
  'changeme',
  'test1234',
])

export function validate(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < policy.minLength) {
    errors.push(`Must be at least ${policy.minLength} characters`)
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Must contain an uppercase letter')
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Must contain a lowercase letter')
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Must contain a number')
  }
  if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Must contain a special character')
  }
  if (
    policy.preventCommonPasswords &&
    COMMON_PASSWORDS.has(password.toLowerCase())
  ) {
    errors.push('This password is too common')
  }

  return { valid: errors.length === 0, errors }
}
