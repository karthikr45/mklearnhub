-- CreateEnum
CREATE TYPE "LearnerTrack" AS ENUM ('SCHOOL', 'INTERMEDIATE', 'ENGINEERING', 'MBA', 'OTHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "examTargets" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "learnerBoard" "EducationBoard",
ADD COLUMN     "learnerClass" TEXT,
ADD COLUMN     "learnerStream" TEXT,
ADD COLUMN     "learnerTrack" "LearnerTrack",
ADD COLUMN     "learnerYear" TEXT;

