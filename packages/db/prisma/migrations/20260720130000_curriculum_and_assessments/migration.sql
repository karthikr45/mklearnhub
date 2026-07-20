-- CreateEnum
CREATE TYPE "ExamTrackType" AS ENUM ('BOARD_SSC', 'BOARD_INTER', 'JEE_MAIN', 'JEE_ADVANCED', 'NEET', 'EAPCET_ENGINEERING', 'EAPCET_AGRI_MEDICAL', 'FOUNDATION');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('PRACTICE', 'CHAPTER_TEST', 'MOCK_TEST', 'PREVIOUS_YEAR');

-- CreateEnum
CREATE TYPE "AssessmentQuestionType" AS ENUM ('MCQ', 'MSQ', 'NUMERIC', 'ASSERTION_REASON', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AttemptMode" AS ENUM ('PRACTICE', 'TEST', 'MOCK');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "organizationId" TEXT,
    "grade" TEXT,
    "stream" TEXT,
    "examTrack" "ExamTrackType",
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_chapters" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syllabus_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "topicId" TEXT,
    "examTrack" "ExamTrackType",
    "type" "AssessmentQuestionType" NOT NULL DEFAULT 'MCQ',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL DEFAULT 'CHAPTER_TEST',
    "organizationId" TEXT,
    "subjectId" TEXT,
    "chapterId" TEXT,
    "examTrack" "ExamTrackType",
    "durationMins" INTEGER,
    "negativeMarking" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_items" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "assessment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "mode" "AttemptMode" NOT NULL DEFAULT 'PRACTICE',
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "subjectId" TEXT,
    "chapterId" TEXT,
    "topicId" TEXT,
    "examTrack" "ExamTrackType",
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "durationSecs" INTEGER,
    "analytics" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_responses" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "response" JSONB,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "marksAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpentSecs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_exam_tracks" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "examTrack" "ExamTrackType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_exam_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subjects_organizationId_idx" ON "subjects"("organizationId");

-- CreateIndex
CREATE INDEX "subjects_examTrack_idx" ON "subjects"("examTrack");

-- CreateIndex
CREATE INDEX "syllabus_chapters_subjectId_idx" ON "syllabus_chapters"("subjectId");

-- CreateIndex
CREATE INDEX "topics_chapterId_idx" ON "topics"("chapterId");

-- CreateIndex
CREATE INDEX "assessment_questions_subjectId_idx" ON "assessment_questions"("subjectId");

-- CreateIndex
CREATE INDEX "assessment_questions_topicId_idx" ON "assessment_questions"("topicId");

-- CreateIndex
CREATE INDEX "assessment_questions_examTrack_difficulty_idx" ON "assessment_questions"("examTrack", "difficulty");

-- CreateIndex
CREATE INDEX "assessments_organizationId_idx" ON "assessments"("organizationId");

-- CreateIndex
CREATE INDEX "assessments_examTrack_idx" ON "assessments"("examTrack");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_items_assessmentId_questionId_key" ON "assessment_items"("assessmentId", "questionId");

-- CreateIndex
CREATE INDEX "assessment_attempts_userId_submittedAt_idx" ON "assessment_attempts"("userId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_responses_attemptId_questionId_key" ON "attempt_responses"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "batch_exam_tracks_batchId_examTrack_key" ON "batch_exam_tracks"("batchId", "examTrack");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_chapters" ADD CONSTRAINT "syllabus_chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "syllabus_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "syllabus_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "syllabus_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_responses" ADD CONSTRAINT "attempt_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_exam_tracks" ADD CONSTRAINT "batch_exam_tracks_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

