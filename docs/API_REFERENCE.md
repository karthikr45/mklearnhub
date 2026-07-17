# LearnHub Public API Reference (`/v1`)

Base URL: `https://app.learnhub.com/api/v1`
(dedicated instances: `https://<subdomain>.learnhub.com/api/v1`)

All requests and responses are JSON (`Content-Type: application/json`). This
reference covers the **public, API-key-authenticated** `/v1` surface intended for
server-to-server integrations. Interactive Swagger docs are also served at
`/api/docs`.

---

## Authentication

Every request must present an API key (create one in Admin → API keys), as either
a bearer token or the `X-API-Key` header:

```
Authorization: Bearer lh_live_xxxxxxxxxxxxxxxxxxxxxxxx
# or
X-API-Key: lh_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

Keys are scoped (e.g. `users:read`, `users:write`, `enrollments:write`,
`analytics:read`, `scorm:write`, `certificates:read`), may be IP-allowlisted, and
are rate-limited per key. See [SECURITY.md](./SECURITY.md#4-api-key-security-model).

## Response envelope

All successful responses share one envelope:

```json
{
  "data": { },
  "meta": { "requestId": "req_01HZY...", "page": 1, "pageSize": 20, "total": 137 },
  "requestId": "req_01HZY..."
}
```

- `data` — the resource or array of resources.
- `meta` — pagination and contextual metadata (pagination fields present only on
  list endpoints).
- `requestId` — echo of the request id (also returned as the `X-Request-Id`
  header); include it in support tickets.

## Errors

Errors use a matching envelope with an `error` object:

```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "email must be a valid email", "details": [] },
  "requestId": "req_01HZY..."
}
```

| HTTP | code                  | Meaning                                             |
| ---- | --------------------- | --------------------------------------------------- |
| 400  | `VALIDATION_ERROR`    | Malformed request / failed DTO validation.          |
| 401  | `UNAUTHORIZED`        | Missing/invalid/revoked API key.                    |
| 403  | `FORBIDDEN`           | Key lacks the required scope, or IP not allowlisted.|
| 404  | `NOT_FOUND`           | Resource does not exist in your organization.       |
| 429  | `RATE_LIMITED`        | Rate limit exceeded; see `Retry-After`.             |
| 500  | `INTERNAL_ERROR`      | Unexpected server error (transient; retry w/ backoff).|

## Pagination

List endpoints accept `?page` (default 1) and `?pageSize` (default 20, max 100).
Totals are returned in `meta`.

## Rate limits

Default limits (per API key). Exceeding a limit returns `429` with `Retry-After`
and `X-RateLimit-Remaining` headers.

| Endpoint group            | Limit               |
| ------------------------- | ------------------- |
| Reads (`GET`)             | 600 req / min       |
| Writes (`POST`)           | 120 req / min       |
| Bulk (`/users/bulk`)      | 10 req / min        |
| Analytics                 | 60 req / min        |

---

## Endpoints

### List users — `GET /v1/users`

Scope: `users:read`. Query: `page`, `pageSize`, `search`, `role`, `status`.

**Response** `200`

```json
{
  "data": [
    { "id": "usr_123", "email": "asha@acme.com", "firstName": "Asha",
      "lastName": "Rao", "role": "STUDENT", "status": "active",
      "createdAt": "2026-07-01T10:00:00Z" }
  ],
  "meta": { "requestId": "req_...", "page": 1, "pageSize": 20, "total": 137 },
  "requestId": "req_..."
}
```

### Create user — `POST /v1/users`

Scope: `users:write`. Rate limit: writes.

**Request**

```json
{
  "email": "asha@acme.com",
  "firstName": "Asha",
  "lastName": "Rao",
  "role": "STUDENT",
  "departmentId": "dep_1",
  "sendInvite": true
}
```

**Response** `201` — `data` is the created user object (as above).

### Get user — `GET /v1/users/:id`

Scope: `users:read`.

**Response** `200` — `data` is the user object. `404` if the id is not in your org.

### Bulk upsert users — `POST /v1/users/bulk`

Scope: `users:write`. Rate limit: bulk (10/min). Upserts up to **1000** users per
call, keyed by `email` (or `externalId`).

**Request**

```json
{
  "users": [
    { "email": "a@acme.com", "firstName": "A", "lastName": "One", "role": "STUDENT" },
    { "email": "b@acme.com", "firstName": "B", "lastName": "Two", "role": "INSTRUCTOR" }
  ]
}
```

**Response** `200`

```json
{
  "data": { "created": 1, "updated": 1, "failed": 0, "errors": [] },
  "meta": { "requestId": "req_..." },
  "requestId": "req_..."
}
```

### List courses — `GET /v1/courses`

Scope: `courses:read`. Query: `page`, `pageSize`, `search`, `status`, `categoryId`.

**Response** `200`

```json
{
  "data": [
    { "id": "crs_789", "title": "Onboarding 101", "slug": "onboarding-101",
      "status": "published", "lessonCount": 12, "durationSecs": 5400,
      "updatedAt": "2026-07-10T12:00:00Z" }
  ],
  "meta": { "requestId": "req_...", "page": 1, "pageSize": 20, "total": 42 },
  "requestId": "req_..."
}
```

### Create enrollment — `POST /v1/enrollments`

Scope: `enrollments:write`. Enrolls a user in a course.

**Request**

```json
{ "userId": "usr_123", "courseId": "crs_789", "dueAt": "2026-08-01T00:00:00Z" }
```

**Response** `201`

```json
{
  "data": { "id": "enr_555", "userId": "usr_123", "courseId": "crs_789",
            "status": "enrolled", "progress": 0, "dueAt": "2026-08-01T00:00:00Z",
            "enrolledAt": "2026-07-17T09:00:00Z" },
  "meta": { "requestId": "req_..." },
  "requestId": "req_..."
}
```

### List a user's enrollments — `GET /v1/enrollments/:userId`

Scope: `enrollments:read`. Query: `status`, `page`, `pageSize`.

**Response** `200`

```json
{
  "data": [
    { "id": "enr_555", "courseId": "crs_789", "courseTitle": "Onboarding 101",
      "status": "in_progress", "progress": 45, "dueAt": "2026-08-01T00:00:00Z",
      "completedAt": null }
  ],
  "meta": { "requestId": "req_...", "page": 1, "pageSize": 20, "total": 3 },
  "requestId": "req_..."
}
```

### Analytics summary — `GET /v1/analytics/summary`

Scope: `analytics:read`. Rate limit: analytics. Query: `from`, `to`, `departmentId`.

**Response** `200`

```json
{
  "data": {
    "activeUsers": 512,
    "enrollments": 1840,
    "completions": 1203,
    "completionRate": 0.65,
    "avgScore": 82.4,
    "certificatesIssued": 1180
  },
  "meta": { "requestId": "req_...", "from": "2026-07-01", "to": "2026-07-17" },
  "requestId": "req_..."
}
```

### Submit SCORM statements — `POST /v1/scorm/statements`

Scope: `scorm:write`. Records SCORM runtime progress/score for a learner.

**Request**

```json
{
  "userId": "usr_123",
  "courseId": "crs_789",
  "lessonId": "les_42",
  "statements": [
    { "key": "cmi.completion_status", "value": "completed" },
    { "key": "cmi.score.raw", "value": "88" },
    { "key": "cmi.success_status", "value": "passed" }
  ]
}
```

**Response** `202`

```json
{
  "data": { "accepted": 3, "progress": 100, "status": "completed" },
  "meta": { "requestId": "req_..." },
  "requestId": "req_..."
}
```

### Get a user's certificates — `GET /v1/certificates/:userId`

Scope: `certificates:read`.

**Response** `200`

```json
{
  "data": [
    { "id": "cert_9001", "courseId": "crs_789", "courseTitle": "Onboarding 101",
      "serial": "LH-2026-000123", "issuedAt": "2026-07-15T10:00:00Z",
      "url": "https://cdn.learnhub.com/certs/cert_9001.pdf" }
  ],
  "meta": { "requestId": "req_...", "total": 1 },
  "requestId": "req_..."
}
```

---

## Code examples

The examples create an enrollment; swap the path/method/body for other endpoints.

### curl

```bash
curl -X POST https://app.learnhub.com/api/v1/enrollments \
  -H "Authorization: Bearer $LEARNHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "userId": "usr_123", "courseId": "crs_789" }'
```

### Node (fetch)

```js
const res = await fetch('https://app.learnhub.com/api/v1/enrollments', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.LEARNHUB_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId: 'usr_123', courseId: 'crs_789' }),
})

if (res.status === 429) {
  const retryAfter = res.headers.get('Retry-After')
  throw new Error(`rate limited; retry after ${retryAfter}s`)
}
if (!res.ok) {
  const { error, requestId } = await res.json()
  throw new Error(`${error.code}: ${error.message} (requestId=${requestId})`)
}

const { data } = await res.json()
console.log('enrollment', data.id)
```

### Python (requests)

```python
import os, requests

resp = requests.post(
    "https://app.learnhub.com/api/v1/enrollments",
    headers={
        "Authorization": f"Bearer {os.environ['LEARNHUB_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={"userId": "usr_123", "courseId": "crs_789"},
    timeout=30,
)

if resp.status_code == 429:
    raise RuntimeError(f"rate limited; retry after {resp.headers.get('Retry-After')}s")
resp.raise_for_status()

body = resp.json()  # { "data": {...}, "meta": {...}, "requestId": "..." }
print("enrollment", body["data"]["id"])
```
