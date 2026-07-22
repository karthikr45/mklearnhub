-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CurriculumNodeType" AS ENUM ('SUBJECT', 'UNIT', 'BOOK', 'CHAPTER', 'TOPIC', 'SUBTOPIC', 'OBJECTIVE');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('RICH_TEXT', 'HTML', 'PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'DIAGRAM', 'ANIMATION', 'INTERACTIVE', 'DETAILED_NOTES', 'REVISION_NOTES', 'FORMULA_SHEET', 'KEY_CONCEPTS', 'FLASHCARDS', 'WORKED_EXAMPLES', 'MCQ', 'MULTI_SELECT', 'SHORT_ANSWER', 'LONG_ANSWER', 'NUMERICAL', 'ASSERTION_REASON', 'COMPETENCY', 'CASE_STUDY', 'WORKSHEET', 'TOPIC_QUIZ', 'CHAPTER_TEST', 'SUBJECT_TEST', 'MOCK_EXAM', 'SOLUTION', 'PREVIOUS_PAPER', 'OFFICIAL_EXTERNAL');

-- CreateEnum
CREATE TYPE "ContentSection" AS ENUM ('LEARN', 'STUDY', 'PRACTICE', 'TEST', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "ContentSourceType" AS ENUM ('ORIGINAL', 'OPEN_LICENSE', 'LICENSED', 'OFFICIAL_EXTERNAL', 'USER_UPLOADED', 'INTERNAL_GENERATED');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('OWNED', 'CC0', 'CC_BY', 'CC_BY_SA', 'COMMERCIAL_LICENSE', 'EXTERNAL_ONLY', 'CUSTOM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'LICENSE_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GenerationType" AS ENUM ('AI', 'HUMAN', 'HYBRID');

-- CreateEnum
CREATE TYPE "FactCheckStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "CopyrightCheckStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('DISCOVERED', 'NORMALIZED', 'DUPLICATE_CHECK', 'LICENSE_CHECK', 'MAPPED', 'REVIEW', 'APPROVED', 'IMPORTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IngestionAction" AS ENUM ('IMPORT_TO_STORAGE', 'SAVE_AS_EXTERNAL', 'MARK_LICENSE_REVIEW', 'REJECT');

-- CreateTable
CREATE TABLE "curriculum_boards" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_years" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_grades" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_subjects" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_units" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_books" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_chapters" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "unitId" TEXT,
    "bookId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_topics" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_subtopics" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_subtopics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objectives" (
    "id" TEXT NOT NULL,
    "topicId" TEXT,
    "subtopicId" TEXT,
    "code" TEXT,
    "statement" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "ContentSourceType" NOT NULL,
    "url" TEXT,
    "licenseType" "LicenseType" NOT NULL DEFAULT 'UNKNOWN',
    "licenseUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_assets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentType" "ContentType" NOT NULL,
    "sourceType" "ContentSourceType" NOT NULL,
    "copyrightOwner" TEXT,
    "licenseType" "LicenseType" NOT NULL DEFAULT 'UNKNOWN',
    "sourceId" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "licenseUrl" TEXT,
    "commercialUseAllowed" BOOLEAN NOT NULL DEFAULT false,
    "redistributionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "selfHostingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "modificationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "attributionRequired" BOOLEAN NOT NULL DEFAULT false,
    "attributionText" TEXT,
    "licenseVerified" BOOLEAN NOT NULL DEFAULT false,
    "licenseVerifiedById" TEXT,
    "licenseVerifiedDate" TIMESTAMP(3),
    "storageProvider" TEXT,
    "storageBucket" TEXT,
    "storageKey" TEXT,
    "cdnUrl" TEXT,
    "mimeType" TEXT,
    "fileSize" BIGINT,
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "body" JSONB,
    "generationType" "GenerationType",
    "generatedBy" TEXT,
    "generationModel" TEXT,
    "generationDate" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewDate" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvalDate" TIMESTAMP(3),
    "factCheckStatus" "FactCheckStatus" DEFAULT 'PENDING',
    "copyrightCheckStatus" "CopyrightCheckStatus" DEFAULT 'PENDING',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_content_mappings" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "nodeType" "CurriculumNodeType" NOT NULL,
    "nodeId" TEXT NOT NULL,
    "section" "ContentSection" NOT NULL,
    "role" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_content_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_asset_versions" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "checksum" TEXT,
    "storageKey" TEXT,
    "storageProvider" TEXT,
    "fileSize" BIGINT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_asset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_ingestions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentType" "ContentType",
    "sourceType" "ContentSourceType",
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "licenseType" "LicenseType",
    "commercialUseAllowed" BOOLEAN,
    "selfHostingAllowed" BOOLEAN,
    "attributionRequired" BOOLEAN,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "recommendedAction" "IngestionAction",
    "nodeType" "CurriculumNodeType",
    "nodeId" TEXT,
    "status" "IngestionStatus" NOT NULL DEFAULT 'DISCOVERED',
    "decision" "IngestionAction",
    "reviewedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_ingestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_boards_code_key" ON "curriculum_boards"("code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_years_boardId_label_key" ON "curriculum_years"("boardId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_grades_yearId_code_key" ON "curriculum_grades"("yearId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_subjects_gradeId_code_key" ON "curriculum_subjects"("gradeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_chapters_subjectId_code_key" ON "curriculum_chapters"("subjectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_topics_chapterId_code_key" ON "curriculum_topics"("chapterId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "content_assets_checksum_key" ON "content_assets"("checksum");

-- CreateIndex
CREATE INDEX "content_assets_status_idx" ON "content_assets"("status");

-- CreateIndex
CREATE INDEX "content_assets_contentType_idx" ON "content_assets"("contentType");

-- CreateIndex
CREATE INDEX "curriculum_content_mappings_nodeType_nodeId_idx" ON "curriculum_content_mappings"("nodeType", "nodeId");

-- CreateIndex
CREATE INDEX "curriculum_content_mappings_assetId_idx" ON "curriculum_content_mappings"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_content_mappings_assetId_nodeType_nodeId_section_key" ON "curriculum_content_mappings"("assetId", "nodeType", "nodeId", "section", "role");

-- CreateIndex
CREATE UNIQUE INDEX "content_asset_versions_assetId_version_key" ON "content_asset_versions"("assetId", "version");

-- CreateIndex
CREATE INDEX "content_ingestions_status_idx" ON "content_ingestions"("status");

-- AddForeignKey
ALTER TABLE "curriculum_years" ADD CONSTRAINT "curriculum_years_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "curriculum_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_grades" ADD CONSTRAINT "curriculum_grades_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "curriculum_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_subjects" ADD CONSTRAINT "curriculum_subjects_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "curriculum_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_units" ADD CONSTRAINT "curriculum_units_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "curriculum_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_books" ADD CONSTRAINT "curriculum_books_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "curriculum_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_chapters" ADD CONSTRAINT "curriculum_chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "curriculum_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_chapters" ADD CONSTRAINT "curriculum_chapters_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "curriculum_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_chapters" ADD CONSTRAINT "curriculum_chapters_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "curriculum_books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_topics" ADD CONSTRAINT "curriculum_topics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "curriculum_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_subtopics" ADD CONSTRAINT "curriculum_subtopics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "curriculum_subtopics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "content_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_content_mappings" ADD CONSTRAINT "curriculum_content_mappings_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "content_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_asset_versions" ADD CONSTRAINT "content_asset_versions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "content_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

