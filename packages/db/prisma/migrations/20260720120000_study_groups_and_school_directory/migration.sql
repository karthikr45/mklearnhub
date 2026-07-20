-- CreateEnum
CREATE TYPE "EducationBoard" AS ENUM ('TELANGANA_STATE', 'ANDHRA_PRADESH_STATE', 'CBSE', 'ICSE', 'IB', 'OTHER');

-- CreateEnum
CREATE TYPE "IndianState" AS ENUM ('TELANGANA', 'ANDHRA_PRADESH');

-- CreateEnum
CREATE TYPE "StudyGroupRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "GroupResourceType" AS ENUM ('NOTE', 'LINK', 'FILE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('APPROVED', 'BLOCKED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('MESSAGE', 'RESOURCE');

-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "board" "EducationBoard",
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "joinCode" TEXT,
ADD COLUMN     "section" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "board" "EducationBoard",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "listedInDirectory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" "IndianState";

-- CreateTable
CREATE TABLE "study_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeLabel" TEXT,
    "createdById" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StudyGroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_messages" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_group_resources" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GroupResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "fileKey" TEXT,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_group_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "status" "ModerationStatus" NOT NULL,
    "reasons" TEXT[],
    "matched" TEXT[],
    "excerpt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_groups_organizationId_academicYearId_idx" ON "study_groups"("organizationId", "academicYearId");

-- CreateIndex
CREATE INDEX "study_group_members_userId_idx" ON "study_group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "study_group_members_groupId_userId_key" ON "study_group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "study_group_messages_groupId_createdAt_idx" ON "study_group_messages"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "study_group_resources_groupId_createdAt_idx" ON "study_group_resources"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_events_organizationId_createdAt_idx" ON "moderation_events"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "batches_joinCode_key" ON "batches"("joinCode");

-- CreateIndex
CREATE INDEX "organizations_type_state_board_idx" ON "organizations"("type", "state", "board");

-- AddForeignKey
ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_members" ADD CONSTRAINT "study_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_members" ADD CONSTRAINT "study_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_messages" ADD CONSTRAINT "study_group_messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_messages" ADD CONSTRAINT "study_group_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_resources" ADD CONSTRAINT "study_group_resources_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_group_resources" ADD CONSTRAINT "study_group_resources_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_events" ADD CONSTRAINT "moderation_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

