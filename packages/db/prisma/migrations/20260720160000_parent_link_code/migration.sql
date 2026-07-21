-- AlterTable
ALTER TABLE "users" ADD COLUMN     "parentLinkCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_parentLinkCode_key" ON "users"("parentLinkCode");

