# LearnHub Enterprise Setup Guide

This guide covers the integrations and controls available to enterprise and
education customers: single sign-on, HRMS provisioning, SCORM, the public API,
outbound webhooks, on-premise deployment, and the security/compliance posture.

Throughout, replace `{orgSlug}` with your organization's slug and
`app.learnhub.com` with your instance host (dedicated instances use
`<subdomain>.learnhub.com`).

---

## 1. Single Sign-On (SAML 2.0)

LearnHub acts as a **SAML Service Provider (SP)**. Your identity provider (IdP)
supplies assertions; LearnHub matches or just-in-time provisions the user within
your organization.

### Service Provider endpoints

| Field                       | Value                                                        |
| --------------------------- | ------------------------------------------------------------ |
| SP Entity ID / Audience     | `https://app.learnhub.com/sso/metadata`                      |
| ACS (Assertion Consumer) URL| `https://app.learnhub.com/api/v1/sso/{orgSlug}/callback`     |
| SP metadata URL             | `https://app.learnhub.com/api/v1/sso/{orgSlug}/metadata`     |
| NameID format               | `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`     |
| Binding                     | HTTP-POST                                                    |

These come from `SAML_SP_ENTITY_ID` and `SAML_SP_BASE_URL` in the API env.

### Metadata URL vs. XML

You can register the IdP in LearnHub two ways:

- **Metadata URL** (preferred): paste the IdP's federation metadata URL. LearnHub
  fetches signing certs and endpoints and **auto-rotates** when the IdP rolls its
  certificate. Best for Azure AD / Okta, which publish a stable metadata URL.
- **Metadata XML**: upload a static XML file. Use this for air-gapped IdPs or
  when the metadata URL is not reachable from the instance. You must re-upload on
  certificate rotation.

### Attribute mapping

LearnHub reads these assertion attributes (configurable per org in Admin → SSO):

| LearnHub field | Default SAML attribute                                                  |
| -------------- | ---------------------------------------------------------------------- |
| email          | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`   |
| firstName      | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname`      |
| lastName       | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname`        |
| groups / role  | `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`         |

### Azure AD (Microsoft Entra ID) — step by step

1. Entra admin center → **Enterprise applications** → **New application** →
   **Create your own application** → *Integrate any other application (non-gallery)*.
2. **Single sign-on** → **SAML**.
3. **Basic SAML Configuration**:
   - Identifier (Entity ID): `https://app.learnhub.com/sso/metadata`
   - Reply URL (ACS): `https://app.learnhub.com/api/v1/sso/{orgSlug}/callback`
4. **Attributes & Claims**: ensure `emailaddress`, `givenname`, `surname`, and a
   `role` (or group) claim are emitted.
5. Copy the **App Federation Metadata Url** from *SAML Signing Certificate*.
6. In LearnHub: Admin → SSO → **Add IdP** → paste the metadata URL, set `{orgSlug}`,
   map attributes, **Enable**.
7. Assign users/groups to the app in Entra, then test at
   `https://app.learnhub.com/api/v1/sso/{orgSlug}/login`.

### Okta — step by step

1. Okta Admin → **Applications** → **Create App Integration** → **SAML 2.0**.
2. **General**: name it "LearnHub".
3. **Configure SAML**:
   - Single sign-on URL (ACS): `https://app.learnhub.com/api/v1/sso/{orgSlug}/callback`
   - Audience URI (SP Entity ID): `https://app.learnhub.com/sso/metadata`
   - Name ID format: `EmailAddress`
   - Attribute statements: `email → user.email`, `firstName → user.firstName`,
     `lastName → user.lastName`; add a group attribute (`groups`, filter as needed).
4. Finish, then open **Sign On** → copy the **Identity Provider metadata** URL.
5. In LearnHub: Admin → SSO → **Add IdP** → paste the metadata URL for `{orgSlug}`.
6. Assign people/groups in Okta and test.

> **SP-initiated vs. IdP-initiated**: both are supported. IdP-initiated posts an
> unsolicited assertion to the ACS URL. SP-initiated starts at
> `.../sso/{orgSlug}/login`.

---

## 2. HRMS webhook setup (auto-provisioning)

Keep LearnHub's user directory in sync with your HR system. LearnHub exposes an
inbound webhook that consumes lifecycle events and creates/updates/deactivates
users and their org/department assignments.

- **Endpoint**: `POST https://app.learnhub.com/api/v1/hrms/{orgSlug}/events`
- **Signature header**: `x-hrms-signature: sha256=<hex>` — HMAC-SHA256 of the raw
  request body using the shared secret from Admin → Integrations → HRMS.

### Event types

| Event                  | Effect in LearnHub                                              |
| ---------------------- | -------------------------------------------------------------- |
| `employee.created`     | JIT-provision the user, assign org/department, send invite.    |
| `employee.updated`     | Update profile, department, manager, job title.                |
| `employee.terminated`  | Deactivate the user, revoke sessions + API keys, unenroll.     |
| `employee.transferred` | Move the user to a new department/org unit; re-evaluate access.|

### SAP SuccessFactors example

1. In LearnHub: Admin → Integrations → **HRMS** → **SuccessFactors** → generate
   the signing secret and copy the endpoint URL.
2. In SuccessFactors: **Admin Center → Intelligent Services** → subscribe an
   external HTTP flow to *Employee Hire / Change / Termination* events.
3. Configure the destination:
   - URL: `https://app.learnhub.com/api/v1/hrms/{orgSlug}/events`
   - Method: `POST`, Content-Type: `application/json`
   - Add header `x-hrms-signature` computed as HMAC-SHA256(body, secret).
4. Map SuccessFactors fields to the LearnHub payload:

```json
{
  "event": "employee.created",
  "occurredAt": "2026-07-17T09:00:00Z",
  "employee": {
    "externalId": "SF-100234",
    "email": "asha.rao@acmecorp.com",
    "firstName": "Asha",
    "lastName": "Rao",
    "department": "Engineering",
    "managerExternalId": "SF-100001",
    "jobTitle": "Software Engineer",
    "status": "active"
  }
}
```

5. Send a test event and confirm a `2xx`. LearnHub rejects requests with a bad or
   missing `x-hrms-signature` (HTTP 401) and is idempotent on `externalId`.

Verifying the signature (LearnHub side, for reference):

```js
import { createHmac, timingSafeEqual } from 'node:crypto'

function verifyHrms(rawBody, header, secret) {
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(header ?? '')
  return a.length === b.length && timingSafeEqual(a, b)
}
```

---

## 3. SCORM packages

LearnHub imports SCORM 1.2 and SCORM 2004 (3rd/4th edition) packages and plays
them through an embedded runtime that reports completion/score back to the LMS.

### Package requirements

- A **ZIP** archive with `imsmanifest.xml` at the root.
- Launch resource declared in the manifest (`<resource>` with an
  `adlcp:scormtype="sco"` and an `href` entry point).
- Max upload size **512 MB** (raise via ingress/proxy `proxy-body-size` for
  larger courses).
- No absolute URLs to external hosts for scored content (breaks sequencing).
- Supported runtime API: `LMSInitialize`/`Initialize`, `LMSSetValue`/`SetValue`
  for `cmi.core.lesson_status`, `cmi.score.raw`, `cmi.completion_status`,
  `cmi.success_status`, `cmi.suspend_data`.

### Upload

1. Admin/Instructor → Course → **Add content** → **SCORM package** → upload the ZIP.
2. LearnHub validates the manifest, extracts assets to storage, and serves them
   from `SCORM_CDN_URL` (`https://cdn.learnhub.com`).
3. Learner progress is written via `POST /v1/scorm/statements` (see API reference)
   and surfaced in analytics/certificates.

---

## 4. API key authentication

Enterprise integrations authenticate to the public `/v1/` API with an API key.

- Create keys in Admin → **API keys**. A key is shown **once** at creation:
  `lh_live_xxxxxxxxxxxxxxxxxxxxxxxx` (test keys use `lh_test_`).
- Present it on every request either as a bearer token or the `X-API-Key` header.
- Keys carry **scopes** (e.g. `users:read`, `enrollments:write`) and optional
  IP allowlists and rate limits (see [SECURITY.md](./SECURITY.md)).

```bash
# curl — bearer
curl https://app.learnhub.com/api/v1/users \
  -H "Authorization: Bearer lh_live_xxxxxxxxxxxxxxxxxxxxxxxx"

# curl — X-API-Key
curl https://app.learnhub.com/api/v1/users \
  -H "X-API-Key: lh_live_xxxxxxxxxxxxxxxxxxxxxxxx"
```

```js
// Node (fetch)
const res = await fetch('https://app.learnhub.com/api/v1/users', {
  headers: { Authorization: `Bearer ${process.env.LEARNHUB_API_KEY}` },
})
const { data, meta, requestId } = await res.json()
```

```python
# Python (requests)
import os, requests

r = requests.get(
    "https://app.learnhub.com/api/v1/users",
    headers={"Authorization": f"Bearer {os.environ['LEARNHUB_API_KEY']}"},
)
r.raise_for_status()
payload = r.json()  # { "data": [...], "meta": {...}, "requestId": "..." }
```

Full endpoint reference: [API_REFERENCE.md](./API_REFERENCE.md).

---

## 5. Outbound webhooks

LearnHub can push events to your systems (enrollment completed, certificate
issued, course published, etc.). Configure endpoints in Admin → **Webhooks**.

### Payload

```json
{
  "id": "evt_01HZY8...",
  "event": "enrollment.completed",
  "createdAt": "2026-07-17T09:00:00Z",
  "data": {
    "enrollmentId": "enr_123",
    "userId": "usr_456",
    "courseId": "crs_789",
    "completedAt": "2026-07-17T08:59:00Z"
  }
}
```

### Signature verification

Every delivery includes `X-LearnHub-Signature: sha256=<hex>`, an HMAC-SHA256 of
the raw request body using your webhook signing secret (`WEBHOOK_SIGNING_KEY`).
Always verify before trusting the payload:

```js
import { createHmac, timingSafeEqual } from 'node:crypto'
import express from 'express'

const app = express()

// Capture the RAW body — do not verify against re-serialized JSON.
app.use('/webhooks/learnhub', express.raw({ type: 'application/json' }))

app.post('/webhooks/learnhub', (req, res) => {
  const signature = req.header('X-LearnHub-Signature') ?? ''
  const expected =
    'sha256=' +
    createHmac('sha256', process.env.LEARNHUB_WEBHOOK_SECRET)
      .update(req.body) // Buffer of the raw bytes
      .digest('hex')

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).send('invalid signature')
  }

  const payload = JSON.parse(req.body.toString('utf8'))
  // ... handle payload.event ...
  res.sendStatus(200) // ack within 5s; non-2xx triggers retries with backoff
})
```

Deliveries retry with exponential backoff for ~24h on non-2xx responses.
Endpoints should be idempotent on `id`.

---

## 6. On-premise deployment

For self-hosted / air-gapped installations, LearnHub ships a self-contained
Docker Compose stack (api, web, admin, Postgres, Redis, Elasticsearch, MinIO):

- Compose file & guide: [`infra/docker/`](../infra/docker/README.md)
- Kubernetes (Helm) chart: [`infra/helm/`](../infra/helm/README.md)
- AWS reference architecture (Terraform): [`infra/terraform/`](../infra/terraform/)

Dedicated single-tenant instances (isolated DB + bucket + subdomain) are
provisioned with [`infra/scripts/`](../infra/scripts/README.md).

---

## 7. Data residency & security controls

- **Regions**: choose India (`ap-south-1`) or EU (`eu-central-1`) hosting. All
  primary data, backups, and search indices stay in the selected region.
- **Isolation**: shared instances enforce row-level tenant isolation by
  `organizationId`; dedicated instances give a physically separate database and
  storage bucket per organization.
- **Encryption**: AES-256-GCM for PII at rest, TLS 1.2+ in transit. See
  [SECURITY.md](./SECURITY.md).
- **Access control**: RBAC (`RolesGuard`), scoped API keys, optional IP
  allowlists, SSO-enforced login, and session/API-key revocation on HR
  termination events.
- **Auditing**: authentication, admin actions, and data exports are logged.

Details and threat model: [SECURITY.md](./SECURITY.md).

---

## 8. ISO 27001 control mapping

LearnHub maintains an ISO/IEC 27001 Annex A control register in
[`packages/compliance`](../packages/compliance/src/iso27001-checklist.ts)
(`ISO_27001_CONTROLS`), surfaced in the admin compliance tracker. Representative
mappings:

| Annex A control | LearnHub implementation                                             |
| --------------- | ------------------------------------------------------------------ |
| A.9.1.1 Access control policy | JWT + `RolesGuard` + scoped API keys              |
| A.9.4.1 Information access restriction | Row-level tenant scoping by `organizationId` |
| A.9.2.1 User registration/de-registration | HRMS `employee.terminated` → deactivate + revoke |
| A.9.4.3 Password management | `password-policy` engine + bcrypt hashing          |
| A.10.1.1 Cryptographic controls | AES-256-GCM (`packages/compliance/encryption.ts`) |
| A.12.4 Logging & monitoring | Audit logs + CloudWatch/container logs             |
| A.18.1.4 Privacy & PII protection | PII scrubber + encryption + data residency        |

The register tracks each control's status (`implemented` / `partial` /
`planned` / `na`); extend it as the ISMS matures.
