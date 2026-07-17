export type ControlStatus = 'implemented' | 'partial' | 'planned' | 'na'

export interface Iso27001Control {
  id: string
  domain: string
  control: string
  status: ControlStatus
  notes?: string
}

/**
 * ISO/IEC 27001 Annex A control checklist (representative subset across the
 * 14 domains of the 2013 structure). Extend this list toward the full 114
 * controls as the ISMS matures. Consumed by the admin compliance tracker.
 */
export const ISO_27001_CONTROLS: Iso27001Control[] = [
  // A.5 Information security policies
  { id: 'A.5.1.1', domain: 'Information Security Policies', control: 'Policies for information security', status: 'implemented', notes: 'SECURITY.md documents the policy set' },
  { id: 'A.5.1.2', domain: 'Information Security Policies', control: 'Review of the policies', status: 'planned' },

  // A.6 Organization of information security
  { id: 'A.6.1.1', domain: 'Organization of Information Security', control: 'Information security roles and responsibilities', status: 'partial' },
  { id: 'A.6.1.2', domain: 'Organization of Information Security', control: 'Segregation of duties', status: 'partial', notes: 'Role-based access via RolesGuard' },
  { id: 'A.6.2.1', domain: 'Organization of Information Security', control: 'Mobile device policy', status: 'planned' },

  // A.7 Human resource security
  { id: 'A.7.2.2', domain: 'Human Resource Security', control: 'Information security awareness, education and training', status: 'planned' },

  // A.8 Asset management
  { id: 'A.8.1.1', domain: 'Asset Management', control: 'Inventory of assets', status: 'partial' },
  { id: 'A.8.2.1', domain: 'Asset Management', control: 'Classification of information', status: 'partial', notes: 'PII scrubber classifies sensitive fields' },

  // A.9 Access control
  { id: 'A.9.1.1', domain: 'Access Control', control: 'Access control policy', status: 'implemented', notes: 'JWT + RolesGuard + API key scopes' },
  { id: 'A.9.2.1', domain: 'Access Control', control: 'User registration and de-registration', status: 'implemented', notes: 'HRMS terminate → deactivate + revoke sessions' },
  { id: 'A.9.2.3', domain: 'Access Control', control: 'Management of privileged access rights', status: 'partial' },
  { id: 'A.9.4.1', domain: 'Access Control', control: 'Information access restriction', status: 'implemented', notes: 'Row-level tenant scoping by organizationId' },
  { id: 'A.9.4.3', domain: 'Access Control', control: 'Password management system', status: 'implemented', notes: 'password-policy engine + bcrypt' },

  // A.10 Cryptography
  { id: 'A.10.1.1', domain: 'Cryptography', control: 'Policy on the use of cryptographic controls', status: 'implemented', notes: 'AES-256-GCM for PII, TLS in transit' },
  { id: 'A.10.1.2', domain: 'Cryptography', control: 'Key management', status: 'partial', notes: 'ENCRYPTION_KEY via env/secret manager' },

  // A.11 Physical and environmental security
  { id: 'A.11.1.1', domain: 'Physical and Environmental Security', control: 'Physical security perimeter', status: 'na', notes: 'Cloud-hosted; inherited from provider (AWS/Neon)' },

  // A.12 Operations security
  { id: 'A.12.1.1', domain: 'Operations Security', control: 'Documented operating procedures', status: 'partial' },
  { id: 'A.12.3.1', domain: 'Operations Security', control: 'Information backup', status: 'planned' },
  { id: 'A.12.4.1', domain: 'Operations Security', control: 'Event logging', status: 'implemented', notes: 'AuditLog + audit interceptor' },
  { id: 'A.12.4.3', domain: 'Operations Security', control: 'Administrator and operator logs', status: 'implemented' },
  { id: 'A.12.6.1', domain: 'Operations Security', control: 'Management of technical vulnerabilities', status: 'partial', notes: 'Dependabot / pnpm audit' },

  // A.13 Communications security
  { id: 'A.13.1.1', domain: 'Communications Security', control: 'Network controls', status: 'partial' },
  { id: 'A.13.2.1', domain: 'Communications Security', control: 'Information transfer policies and procedures', status: 'partial', notes: 'Webhook HMAC signing' },

  // A.14 System acquisition, development and maintenance
  { id: 'A.14.1.2', domain: 'System Development', control: 'Securing application services on public networks', status: 'implemented', notes: 'Helmet, CORS, rate limiting' },
  { id: 'A.14.2.1', domain: 'System Development', control: 'Secure development policy', status: 'partial' },
  { id: 'A.14.2.5', domain: 'System Development', control: 'Secure system engineering principles', status: 'partial' },

  // A.15 Supplier relationships
  { id: 'A.15.1.1', domain: 'Supplier Relationships', control: 'Information security policy for supplier relationships', status: 'planned' },

  // A.16 Information security incident management
  { id: 'A.16.1.1', domain: 'Incident Management', control: 'Responsibilities and procedures', status: 'partial', notes: 'Incident response in SECURITY.md' },
  { id: 'A.16.1.5', domain: 'Incident Management', control: 'Response to information security incidents', status: 'planned' },

  // A.17 Business continuity
  { id: 'A.17.1.1', domain: 'Business Continuity', control: 'Planning information security continuity', status: 'planned' },

  // A.18 Compliance
  { id: 'A.18.1.1', domain: 'Compliance', control: 'Identification of applicable legislation', status: 'implemented', notes: 'DPDP Act 2023, GDPR mapped' },
  { id: 'A.18.1.3', domain: 'Compliance', control: 'Protection of records', status: 'implemented', notes: 'Audit logs retained + anonymized on deletion' },
  { id: 'A.18.1.4', domain: 'Compliance', control: 'Privacy and protection of PII', status: 'implemented', notes: 'DSR export/delete flow' },
]

export function getControlsByStatus(): Record<ControlStatus, number> {
  return ISO_27001_CONTROLS.reduce(
    (acc, c) => {
      acc[c.status] += 1
      return acc
    },
    { implemented: 0, partial: 0, planned: 0, na: 0 } as Record<
      ControlStatus,
      number
    >,
  )
}
