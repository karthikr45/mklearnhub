-- AlterTable
ALTER TABLE "assessment_questions" ALTER COLUMN "subjectId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "question_curriculum_mappings" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "nodeType" "CurriculumNodeType" NOT NULL,
    "nodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_curriculum_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_curriculum_mappings_nodeType_nodeId_idx" ON "question_curriculum_mappings"("nodeType", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "question_curriculum_mappings_questionId_nodeType_nodeId_key" ON "question_curriculum_mappings"("questionId", "nodeType", "nodeId");

-- AddForeignKey
ALTER TABLE "question_curriculum_mappings" ADD CONSTRAINT "question_curriculum_mappings_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

