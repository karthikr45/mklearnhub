# LearnHub Security

This document describes LearnHub's security architecture, cryptographic
controls, authentication model, testing checklist, incident response, and
regulatory compliance posture. Security primitives referenced here live in
[`packages/compliance`](../packages/compliance/).

To report a vulnerability, see [Vulnerability disclosure](#7-vulnerability-disclosure-policy).

---

## 1. Security architecture overview

LearnHub is a multi-tenant SaaS with an optional single-tenant (dedicated)
deployment mode. Defense in depth spans the edge, application, and data tiers.

```
Internet
  │  TLS 1.2+ (CloudFront / nginx ingress, cert-manager)
  ▼
Edge / WAF ── rate limiting, IP allowlists (per API key)
  │
  ▼
apps/api (NestJS/Fastify)
  │  global ValidationPipe (class-validator DTOs)
  │  JwtAuthGuard → RolesGuard → tenant scoping (organizationId)
  ▼
PostgreSQL (encrypted at rest)   Redis (TLS)   S3/R2 (SSE, private)
```

Key principles:

- **Tenant isolation** — every tenant-scoped row carries `organizationId`;
  services derive it from the authenticated principal and never trust a
  client-supplied org id (see [ARCHITECTURE.md](./ARCHITECTURE.md)).
- **Least privilege** — RBAC roles, scoped API keys, IAM task roles limited to
  the app's own bucket.
- **Secure by default / graceful degradation** — only `DATABASE_URL` is
  required; every integration is opt-in.
- **Input validation everywhere** — a global `ValidationPipe` rejects malformed
  request bodies before they reach services.

---

## 2. Encryption

### At rest

- **PII fields** are encrypted with **AES-256-GCM** via
  [`packages/compliance/src/encryption.ts`](../packages/compliance/src/encryption.ts).
  The stored value is a single base64 blob encoding `iv | authTag | ciphertext`,
  so it fits one DB column and is tamper-evident (GCM auth tag).
  - `ENCRYPTION_KEY` is a 32-byte hex key (`openssl rand -hex 32`).
  - `hashPii()` provides a deterministic SHA-256 for equality lookups (e.g.
    searching by email) without decrypting.
- **Database & storage**: RDS storage encryption (KMS), S3 SSE-KMS with
  `bucket_key_enabled`, ElastiCache at-rest encryption — all enabled in the
  Terraform reference.

### In transit

- TLS 1.2+ everywhere (TLS 1.3 preferred). CloudFront uses
  `TLSv1.2_2021`; the ALB uses `ELBSecurityPolicy-TLS13-1-2-2021-06`.
- Redis uses `rediss://` (transit encryption) in AWS; Postgres uses
  `sslmode=require` / `rds.force_ssl=1`.
- HSTS and other hardening headers come from
  [`packages/compliance/src/security-headers.ts`](../packages/compliance/src/security-headers.ts).

---

## 3. Authentication & session management

- **Passwords** are hashed with **bcrypt**; complexity is enforced by the
  [`password-policy`](../packages/compliance/src/password-policy.ts) engine.
- **JWT access tokens** are short-lived (**15 min**, `JWT_EXPIRES_IN`).
- **Refresh tokens** live **7 days** (`JWT_REFRESH_EXPIRES_IN`), are stored in the
  `sessions` table, and are **rotated** on every `POST /auth/refresh` — the old
  token is invalidated (refresh-token reuse detection).
- Protected routes use a Passport JWT strategy (`JwtAuthGuard`); authorization is
  enforced with `@Roles(...)` + `RolesGuard`.
- **Session revocation**: logout, password change, and HRMS `employee.terminated`
  events revoke sessions (and API keys) immediately.
- **SSO**: SAML-enforced login can be required per org; JIT provisioning maps IdP
  attributes to LearnHub roles.

---

## 4. API key security model

- **Storage**: API keys are **bcrypt-hashed** at rest — the plaintext
  (`lh_live_...`) is shown once at creation and never persisted.
- **Prefix lookup**: a short, non-secret key prefix is indexed so verification is
  a single-row lookup + one bcrypt compare (no full-table scan).
- **Scopes**: each key is limited to explicit scopes (e.g. `users:read`,
  `users:write`, `enrollments:write`, `analytics:read`). Requests outside a key's
  scopes return `403`.
- **IP allowlist**: optionally bind a key to CIDR ranges; off-list requests are
  rejected.
- **Rate limits**: per-key limits enforced via Redis
  ([`rate-limit-configs`](../packages/compliance/src/rate-limit-configs.ts)); a
  PostgreSQL fallback applies when Redis is disabled. Exceeding a limit returns
  `429` with `Retry-After`.
- **Rotation & revocation**: keys can be rotated or revoked instantly from Admin;
  revocation takes effect on the next request.

---

## 5. Penetration-test checklist (OWASP Top 10 2021)

| OWASP category                          | LearnHub control / test                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| A01 Broken Access Control               | Verify tenant scoping (`organizationId`), `RolesGuard`, API-key scopes; test IDOR on `/v1/users/:id`, `/v1/enrollments/:userId`. |
| A02 Cryptographic Failures              | Confirm AES-256-GCM for PII, TLS 1.2+, SSE-KMS, no secrets in logs.             |
| A03 Injection                           | Prisma parameterized queries; global `ValidationPipe`; test SQLi/NoSQLi, XSS on rich-text, SCORM manifest XXE. |
| A04 Insecure Design                     | Threat-model new features; enforce refresh-token rotation & reuse detection.    |
| A05 Security Misconfiguration           | Security headers, disabled dir listing, least-priv IAM, no default creds in prod.|
| A06 Vulnerable & Outdated Components    | `pnpm audit` in CI; Dependabot; pin base images.                                |
| A07 Identification & Auth Failures      | bcrypt, lockout/backoff, short JWT TTL, MFA/SSO enforcement, session revocation. |
| A08 Software & Data Integrity Failures  | Webhook HMAC signatures; signed images; verify SCORM package integrity.          |
| A09 Logging & Monitoring Failures       | Audit auth/admin/export events; alert on anomalies; retain per policy.           |
| A10 Server-Side Request Forgery (SSRF)  | Validate/deny-list outbound URLs (SSO metadata, webhooks, media fetch).          |

Run authenticated and unauthenticated scans against a staging instance; never
against production without a signed authorization window.

---

## 6. Incident response

1. **Detect & report** — alerts, user reports, or the disclosure inbox open an
   incident. Severity is triaged (SEV1–SEV4).
2. **Contain** — revoke affected credentials/sessions/API keys, isolate hosts,
   block source IPs, rotate `ENCRYPTION_KEY`/JWT secrets if exposure is suspected.
3. **Eradicate** — patch the root cause, remove persistence/backdoors.
4. **Recover** — restore from clean backups, validate integrity, monitor closely.
5. **Notify** — regulator and data-subject notification within statutory
   windows (see compliance below); customer comms per contractual SLAs.
6. **Post-incident review** — blameless RCA, corrective actions, control updates,
   and register/checklist revisions in `packages/compliance`.

Target first-response times: SEV1 ≤ 30 min, SEV2 ≤ 2 h, SEV3 ≤ 1 business day.

---

## 7. Vulnerability disclosure policy

We welcome good-faith security research.

- **Report to**: `security@learnhub.com` (PGP available on request). Include steps
  to reproduce, impact, and affected endpoints.
- **Safe harbor**: testing that respects this policy will not be pursued legally.
  Do **not** access, modify, or exfiltrate other tenants' data, degrade service,
  run automated high-volume scans against production, or use social engineering.
- **Our commitment**: acknowledge within **2 business days**, provide a
  remediation timeline, and credit reporters (opt-in) once fixed.
- **Scope**: `*.learnhub.com` application endpoints and official mobile apps.
  Out of scope: third-party services, volumetric DoS, best-practice-only findings
  with no demonstrable impact.

---

## 8. Compliance

| Regulation | Scope | How LearnHub supports it |
| ---------- | ----- | ------------------------ |
| **DPDP Act 2023 (India)** | Processing of Indian data principals' personal data | India (`ap-south-1`) data residency; consent capture; data-principal rights (access/correction/erasure); breach notification to the Data Protection Board; PII encryption + scrubbing. |
| **GDPR (EU/EEA)** | Personal data of EU data subjects | EU (`eu-central-1`) residency; lawful-basis & consent records; DSAR export/erasure; DPA + SCCs for transfers; 72-hour breach notification; privacy-by-design (encryption, minimization). |
| **RBI IT / Cybersecurity guidelines** | Regulated financial-sector customers (India) | Data localization in India, encryption at rest/in transit, RBAC + audit trails, incident reporting, periodic VAPT, and access reviews. |

Supporting artifacts:

- ISO/IEC 27001 Annex A register:
  [`packages/compliance/src/iso27001-checklist.ts`](../packages/compliance/src/iso27001-checklist.ts)
- PII handling:
  [`packages/compliance/src/pii-scrubber.ts`](../packages/compliance/src/pii-scrubber.ts)
- Encryption:
  [`packages/compliance/src/encryption.ts`](../packages/compliance/src/encryption.ts)
