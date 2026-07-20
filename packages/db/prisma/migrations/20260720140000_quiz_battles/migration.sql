-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('LOBBY', 'ACTIVE', 'FINISHED');

-- CreateTable
CREATE TABLE "quiz_battles" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questionIds" JSONB NOT NULL DEFAULT '[]',
    "status" "BattleStatus" NOT NULL DEFAULT 'LOBBY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "quiz_battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_participants" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battle_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_battles_groupId_idx" ON "quiz_battles"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "battle_participants_battleId_userId_key" ON "battle_participants"("battleId", "userId");

-- AddForeignKey
ALTER TABLE "quiz_battles" ADD CONSTRAINT "quiz_battles_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_battles" ADD CONSTRAINT "quiz_battles_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "quiz_battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

