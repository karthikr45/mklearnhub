-- CreateTable
CREATE TABLE "doubts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "authorId" TEXT NOT NULL,
    "subjectId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doubts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doubt_answers" (
    "id" TEXT NOT NULL,
    "doubtId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doubt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doubt_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doubtId" TEXT,
    "answerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doubt_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doubts_organizationId_subjectId_idx" ON "doubts"("organizationId", "subjectId");

-- CreateIndex
CREATE INDEX "doubts_topicId_idx" ON "doubts"("topicId");

-- CreateIndex
CREATE INDEX "doubt_answers_doubtId_idx" ON "doubt_answers"("doubtId");

-- CreateIndex
CREATE UNIQUE INDEX "doubt_votes_userId_doubtId_key" ON "doubt_votes"("userId", "doubtId");

-- CreateIndex
CREATE UNIQUE INDEX "doubt_votes_userId_answerId_key" ON "doubt_votes"("userId", "answerId");

-- AddForeignKey
ALTER TABLE "doubts" ADD CONSTRAINT "doubts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_answers" ADD CONSTRAINT "doubt_answers_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "doubts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_answers" ADD CONSTRAINT "doubt_answers_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubt_votes" ADD CONSTRAINT "doubt_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

