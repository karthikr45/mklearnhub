/**
 * These mirror the Prisma enums in `@learnhub/db`. They are declared as
 * `const` objects plus a derived union type (rather than `enum`) so that a
 * value produced by Prisma — whose enums are themselves string-literal unions —
 * is structurally assignable to these shared types without casting.
 */

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  LEARNER: 'LEARNER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const OrgType = {
  BUSINESS: 'BUSINESS',
  SCHOOL: 'SCHOOL',
  INSTITUTE: 'INSTITUTE',
  COACHING_CENTER: 'COACHING_CENTER',
} as const
export type OrgType = (typeof OrgType)[keyof typeof OrgType]

export const CourseStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus]

export const LessonType = {
  VIDEO: 'VIDEO',
  TEXT: 'TEXT',
  EMBED: 'EMBED',
  SCORM: 'SCORM',
  QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT',
} as const
export type LessonType = (typeof LessonType)[keyof typeof LessonType]

export const EnrollmentStatus = {
  ENROLLED: 'ENROLLED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DROPPED: 'DROPPED',
} as const
export type EnrollmentStatus =
  (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus]

export const PortalType = {
  INTERNAL: 'INTERNAL',
  CUSTOMER: 'CUSTOMER',
  PARTNER: 'PARTNER',
  PUBLIC: 'PUBLIC',
} as const
export type PortalType = (typeof PortalType)[keyof typeof PortalType]

export const QuestionType = {
  MCQ: 'MCQ',
  MSQ: 'MSQ',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  ESSAY: 'ESSAY',
} as const
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType]
