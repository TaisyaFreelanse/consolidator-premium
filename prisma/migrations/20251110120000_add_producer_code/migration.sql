-- Drop-in migration to track event owner identity
ALTER TABLE "events" ADD COLUMN "producerCode" TEXT;

