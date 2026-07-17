export { sendEmail } from './send';
export type { SendEmailOptions, SendEmailResult } from './send';

export { default as WelcomeEmail } from './templates/WelcomeEmail';
export type { WelcomeEmailProps } from './templates/WelcomeEmail';

export { default as EmailVerificationEmail } from './templates/EmailVerificationEmail';
export type { EmailVerificationEmailProps } from './templates/EmailVerificationEmail';

export { default as PasswordResetEmail } from './templates/PasswordResetEmail';
export type { PasswordResetEmailProps } from './templates/PasswordResetEmail';

export { default as InviteEmail } from './templates/InviteEmail';
export type { InviteEmailProps } from './templates/InviteEmail';

export { default as CourseEnrollmentEmail } from './templates/CourseEnrollmentEmail';
export type { CourseEnrollmentEmailProps } from './templates/CourseEnrollmentEmail';

export { default as CertificateEmail } from './templates/CertificateEmail';
export type { CertificateEmailProps } from './templates/CertificateEmail';

export { default as DailyDigestEmail } from './templates/DailyDigestEmail';
export type {
  DailyDigestEmailProps,
  DailyDigestItem,
} from './templates/DailyDigestEmail';
