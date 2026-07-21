import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — LearnHub',
  description: 'The terms governing your use of LearnHub.',
}

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: '1. Acceptance of terms',
    p: [
      'By creating a LearnHub account or using the platform, you agree to these Terms of Service and our Privacy Policy. If you are registering on behalf of an organization, you confirm you are authorized to bind that organization.',
    ],
  },
  {
    h: '2. Who can use LearnHub',
    p: [
      'LearnHub is used by schools, coaching institutes, businesses, teachers, students, and parents. Students under 18 may register only with the consent of a parent or legal guardian, as required by the Digital Personal Data Protection Act, 2023.',
    ],
  },
  {
    h: '3. Your account',
    p: [
      'You are responsible for keeping your login credentials secure and for all activity under your account. Notify us promptly of any unauthorized use. Organizations are responsible for the accounts they create for their members.',
    ],
  },
  {
    h: '4. Acceptable use',
    p: [
      'You agree not to misuse the platform: no unlawful, harmful, or infringing content; no harassment or bullying; no attempts to disrupt or gain unauthorized access to the service. Student study spaces are monitored for safety, and content that violates these rules may be removed.',
    ],
  },
  {
    h: '5. Content and intellectual property',
    p: [
      'Course materials, assessments, and notes you create remain yours; you grant LearnHub and your organization a licence to host and display them to deliver the service. LearnHub’s own software, design, and branding remain the property of LearnHub and MK Tech Monk.',
    ],
  },
  {
    h: '6. Payments',
    p: [
      'Paid plans are billed in advance for the stated period. Fees are non-refundable except where required by law. You can cancel at any time; access continues until the end of the current billing period.',
    ],
  },
  {
    h: '7. Availability and changes',
    p: [
      'We work to keep LearnHub available and secure, but we do not guarantee uninterrupted service. We may update these terms; material changes will be communicated, and continued use after changes means you accept them.',
    ],
  },
  {
    h: '8. Contact',
    p: [
      'Questions about these terms can be sent to support@learnhub.com.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
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
