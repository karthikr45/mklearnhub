import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — LearnHub',
  description: 'How LearnHub collects, uses, and protects your data.',
}

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: '1. Data we collect',
    p: [
      'Account details (name, email, role), the organization or class you belong to, and the learning activity you generate — enrolments, assessment attempts, notes, messages in study groups, and progress. For paid plans we process payment references (but never store full card details — payments are handled by our payment provider).',
    ],
  },
  {
    h: '2. How we use your data',
    p: [
      'To provide the service: deliver courses, run assessments, show progress and analytics to you and your school, enable study groups, and send transactional notifications. We do not sell your personal data.',
    ],
  },
  {
    h: '3. Children and parental consent',
    p: [
      'For students under 18, we collect and process personal data only with verifiable parental or guardian consent, in line with the Digital Personal Data Protection Act, 2023. Student study spaces are moderated for safety, and parents can view their child’s activity. We do not use children’s data for behavioural advertising.',
    ],
  },
  {
    h: '4. Sharing',
    p: [
      'Your data is visible to your organization (school/institute) and its administrators and teachers, as needed to deliver education. We use trusted processors (hosting, email, payments, optional video/search) who are bound to protect your data and process it only on our instructions.',
    ],
  },
  {
    h: '5. Security',
    p: [
      'We protect data with encryption in transit, access controls, audit logging, and PII-minimizing practices. No system is perfectly secure, but we work continuously to safeguard your information.',
    ],
  },
  {
    h: '6. Your rights',
    p: [
      'You can access, correct, or request deletion of your personal data, and download a copy, from your profile settings. Parents may exercise these rights on behalf of their children. Contact us if you need help.',
    ],
  },
  {
    h: '7. Retention',
    p: [
      'We keep your data while your account is active and as required to provide the service and meet legal obligations. When you delete your account, we remove or anonymize your personal data, subject to legal retention requirements.',
    ],
  },
  {
    h: '8. Contact',
    p: [
      'For privacy questions or to exercise your rights, contact privacy@learnhub.com.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: 21 July 2026
      </p>
      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="mt-2 text-sm leading-7 text-muted-foreground">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
