-- AlterTable
ALTER TABLE "events" ADD COLUMN     "createdAtClient" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT;
