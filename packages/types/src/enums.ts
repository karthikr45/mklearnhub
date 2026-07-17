export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  LEARNER = 'LEARNER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum OrgType {
  BUSINESS = 'BUSINESS',
  SCHOOL = 'SCHOOL',
  INSTITUTE = 'INSTITUTE',
  COACHING_CENTER = 'COACHING_CENTER',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum LessonType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  EMBED = 'EMBED',
  SCORM = 'SCORM',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
}

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export enum PortalType {
  INTERNAL = 'INTERNAL',
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  PUBLIC = 'PUBLIC',
}

export enum QuestionType {
  MCQ = 'MCQ',
  MSQ = 'MSQ',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
}
