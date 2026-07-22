# Curriculum & Content Architecture (CBSE Grade 10 first)

Status: **design + phased build**. Scope now = generic architecture + CBSE Grade 10.
Everything is data-driven so Grades 1–9, Grade 11–12, State boards, Intermediate,
JEE/NEET/EAPCET, UPSC/SSC/Banking load later with **no schema redesign**.

---

## A. Existing application (what's already here)

| Area | What exists | Reuse? |
|---|---|---|
| Frontend | Next.js 15 App Router (`apps/web`), super-admin app (`apps/admin`), both React 18 + Tailwind + TanStack Query | Reuse; add Curriculum section to `apps/admin` |
| Backend | NestJS on Fastify (`apps/api`), controller→service→Prisma, class-validator DTOs, Swagger | Reuse; add `curriculum` + `content` modules |
| Database | PostgreSQL via Prisma (`packages/db`) | Reuse; **additive** migrations only |
| Storage | `StorageService` uses `@aws-sdk/client-s3`, lazy client, presigned up/down, delete, copy. Configured by `AWS_*` env. **No Azure.** | Refactor into a provider interface (Phase 4) |
| Auth | JWT access/refresh, `JwtAuthGuard`, `RolesGuard` + `@Roles`, `@CurrentUser` | Reuse |
| RBAC | `UserRole` = SUPER_ADMIN, ORG_ADMIN, INSTRUCTOR, LEARNER, STUDENT, PARENT | Reuse; content roles map onto these (see J) |
| Audit | `AuditService.log()` + query/export, audit interceptor | Reuse for all content mutations |
| Search | `SearchService` on Elasticsearch, **degrades to no-op** without `ELASTICSEARCH_URL` | Reuse; index curriculum + published content |
| Assessments | `Assessment` / `AssessmentQuestion` / `AssessmentAttempt` bank + attempt engine (global-capable, `organizationId` nullable) | **Reuse as the Question Bank + Test engine**; add curriculum mappings |
| Curriculum (thin) | `Subject` → `SyllabusChapter` → `Topic` (+ `examTrack`, string `grade`), used by study/practice | Kept working; new domain is the authoritative superset |
| Video | Upload/URL + gated HLS + hls.js/Plyr player | Reuse; `ContentAsset` video model supports the future pipeline |

## B. Reuse plan (do NOT rebuild)

- **Storage** → wrap, don't replace: `StorageService` becomes the `S3CompatibleStorageProvider` behind a `StorageProvider` interface.
- **Assessments/Questions** → the existing engine is the Question Bank + Test runner; add `QuestionCurriculumMapping` + status/license fields rather than a new engine.
- **Auth/RBAC/Audit/Search** → used as-is.
- **Admin app** → extend nav with a Curriculum manager; **student content UI** added to `apps/web`.

## C. Database design (new, additive)

Two strictly separated concerns — **curriculum metadata** ("what to learn") vs **content assets** ("resources that teach/assess"), joined by a **many-to-many mapping**.

**Curriculum hierarchy** (all generic; optional levels are nullable so different subjects differ):

```
Board (CBSE, TS_STATE, …)
 └─ AcademicYear (2026-27, …)              ← versioned, never overwritten
     └─ Grade (Grade 10, …)                 ← generic level (also for JEE/UPSC "levels")
         └─ CurriculumSubject (Science, …)
             ├─ Unit?           (optional)
             ├─ Book?           (optional)
             └─ CurriculumChapter
                 └─ CurriculumTopic
                     └─ Subtopic?           (optional)
                         └─ LearningObjective
```

Models: `Board`, `AcademicYear`, `Grade`, `CurriculumSubject`, `Unit`, `Book`,
`CurriculumChapter`, `CurriculumTopic`, `Subtopic`, `LearningObjective`.
Each node: `code`, `title`, `order`, `metadata Json`, timestamps, parent FK.
`Unit`/`Book`/`Subtopic` are optional links so hierarchies vary by subject.

**Content + provenance:**

- `ContentAsset` — the physical resource, stored **once**. Carries the full
  licensing/provenance block (Section 8), storage-neutral identity
  (`storageProvider`, `bucket`, `storageKey`, `checksum`, `version`), content
  pipeline fields (`generatedBy`, review/approval, `factCheckStatus`,
  `copyrightCheckStatus`), and `status` workflow.
- `CurriculumContentMapping` — **M:N** join from any curriculum node (topic,
  chapter, subject, learning objective) to a `ContentAsset`, with a `section`
  (LEARN/STUDY/PRACTICE/TEST/OFFICIAL) and `role` (e.g. VIDEO, NOTES, MCQ). One
  asset ↔ many curriculum locations ↔ many academic years.
- `ContentSource` — external source registry (name, url, license terms) an asset
  can reference.
- `AssetVersion` — immutable version history per asset (checksum, storageKey).
- `ContentIngestion` — a staged discovered resource pending admin review (Section 19).
- `QuestionCurriculumMapping` — maps existing `AssessmentQuestion`s to curriculum
  nodes so the Question Bank reuses one question across curricula.

**Enums:** `ContentType`, `ContentSection`, `ContentSourceType`, `LicenseType`,
`ContentStatus`, `GenerationType`, `ReviewStatus`.

**Hard rule enforced in code + DB defaults:** an asset that is not `ORIGINAL`
and not `selfHostingAllowed=true` **cannot be uploaded/copied into managed
storage** and defaults to `EXTERNAL_ONLY` / not-approved.

## D. Storage abstraction (provider-neutral)

`StorageProvider` interface (in `apps/api/src/modules/storage/`):

```
uploadBuffer, uploadStream, deleteFile, copyFile, moveFile,
getMetadata, fileExists, generateSignedUploadUrl, generateSignedDownloadUrl,
getPublicOrCdnUrl, getPrivateSignedUrl, listObjects, checksumOf
```

- `S3CompatibleStorageProvider` — one adapter covers **S3, R2, B2, Wasabi,
  Spaces, MinIO** via a configurable `endpoint` + `forcePathStyle`.
- Selected by `STORAGE_PROVIDER` (default `s3`); Azure/GCS adapters can be added
  later without touching business code.
- Canonical identity is **never** a provider URL — it's
  `{provider, bucket, storageKey, checksum, version}`; delivery URLs are
  generated on demand (public/CDN base or signed). Enables R2→S3→B2 migration
  with **zero curriculum-record changes** (Section 32).

Config (documented in `.env.example`):
`STORAGE_PROVIDER`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`,
`STORAGE_SECRET_ACCESS_KEY`, `STORAGE_BUCKET`, `STORAGE_PUBLIC_BASE_URL` (CDN),
`STORAGE_FORCE_PATH_STYLE`. Legacy `AWS_*` still read as fallback.

**Asset-centric keys:** `/content/{type}/{assetId}/{filename}` — not a
board/grade path, so one asset serves many curricula.

## E. Required migrations (additive only)

1. Storage: none (config-only). 2. Curriculum hierarchy models. 3. Content
models + enums. 4. `QuestionCurriculumMapping` + status/license columns on
`AssessmentQuestion`. All are new tables / nullable columns — no destructive
changes to existing modules.

## F. API design (follows existing conventions)

Public/student: `GET /curriculum/boards`, `/academic-years`, `/grades`,
`/curriculum/tree`, `/curriculum/subjects/:id`, `/curriculum/topics/:id/content`,
`GET /content/:id` (returns signed/CDN URL, respecting license), `/questions`,
`/assessments` (existing).

Admin (SUPER_ADMIN/content roles): CRUD on every curriculum node,
`POST /content`, `/content/:id/review|approve|publish|archive`,
`/content/import` (discover→stage), `/content/ingestions/:id/decision`,
`/curriculum/import` (CSV/XLSX), `/curriculum/mappings`, `/questions/import`.
All paginated, filterable, validated, authorized, audit-logged.

## G. Admin UI (in `apps/admin`)

Curriculum tree: CBSE → Grade 10 → {Maths, Science, Social, English, Hindi} →
Unit/Book? → Chapter → Topic → Learning Objective. Per topic a **coverage
matrix** (Lesson/Video/Notes/Revision/MCQ/Short/Long/Competency/Worksheet/Test/
Official) with Missing/Draft/Under-Review/License-Review/Approved/Published.
Content editor with the license block; Import staging screen (Section 20).

## H. Student UI (in `apps/web`)

Per topic/chapter tabs: **Learn** (video, explanation, worked examples) ·
**Study** (notes, revision, key concepts, formula sheet, flashcards) ·
**Practice** (MCQ/short/long/numerical/competency/case-study/worksheet) ·
**Test** (topic quiz/chapter/subject/mock via the assessment engine) ·
**Official resources** (external links, never self-hosted if restricted).
Only `PUBLISHED` assets shown.

## I. Copyright / license enforcement

Every asset carries the full provenance block. Upload/copy into storage is
**gated**: refused unless `sourceType=ORIGINAL` OR (`selfHostingAllowed=true`
AND `commercialUseAllowed` compatible AND `licenseVerified=true`). Unknown
license ⇒ `EXTERNAL_ONLY`, reference-only. No blind NCERT/CBSE crawling; external
resources stored as metadata + official URL only. This gate is unit-tested
(Section 34's critical test).

## J. Security / RBAC

Reuse JWT + `RolesGuard`. Global curriculum/content is **platform-level** →
managed by `SUPER_ADMIN` in `apps/admin`. Content-role concept
(CONTENT_ADMIN / EDITOR / SME / REVIEWER) is modelled now as a `ContentRole`
capability on the workflow (who reviewed/approved) and **can be promoted to
first-class `UserRole` enum values later** without redesign. All mutations
audit-logged: upload, edit, license change, mapping, review, approve, publish,
unpublish, archive.

## K. Cost control

Object storage (not DB BLOBs) · checksum dedup (store once) · asset-centric
immutable keys + long CDN cache · signed URLs for private · adaptive video
model for later HLS · reusable M:N mappings · archive/cold status.
**Provider options** (code stays neutral): **A (lowest):** Cloudflare R2 (zero
egress) or Backblaze B2 + Cloudflare CDN. **B (balanced):** DO Spaces / Wasabi +
CDN. **C (enterprise):** AWS S3 + CloudFront. Choose by config, not code.

## L. Implementation phases (order)

1. Analysis (this doc). **2. Curriculum schema. 3. Content/license schema.
4. Storage abstraction.** 5. Checksum dedup + license gate + audit + review
workflow. 6. Load CBSE Grade 10 structure (5 subjects). 7. Admin curriculum
manager. 8. Content manager. 9. Import staging. 10. One Science pilot chapter
(original content only). 11. Student content UI. 12. Question bank + assessment
mappings. 13. CSV/XLSX bulk import. 14. Tests.

Build increments are committed separately and each passes `pnpm verify`.
