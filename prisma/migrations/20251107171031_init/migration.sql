/*
  Warnings:

  - You are about to alter the column `pricePerSeat` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `priceTotal` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "seatLimit" INTEGER,
    "priceTotal" BIGINT NOT NULL,
    "pricePerSeat" BIGINT,
    "image" TEXT,
    "category" TEXT,
    "description" TEXT,
    "activities" TEXT,
    "startApplicationsAt" DATETIME,
    "endApplicationsAt" DATETIME,
    "startContractsAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "producerName" TEXT,
    "controlPlan" TEXT NOT NULL,
    "currentControlPoint" TEXT,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_events" ("activities", "author", "category", "controlPlan", "createdAt", "currentControlPoint", "description", "endApplicationsAt", "endAt", "id", "image", "isCancelled", "location", "pricePerSeat", "priceTotal", "producerName", "seatLimit", "startApplicationsAt", "startAt", "startContractsAt", "status", "title", "updatedAt") SELECT "activities", "author", "category", "controlPlan", "createdAt", "currentControlPoint", "description", "endApplicationsAt", "endAt", "id", "image", "isCancelled", "location", "pricePerSeat", "priceTotal", "producerName", "seatLimit", "startApplicationsAt", "startAt", "startContractsAt", "status", "title", "updatedAt" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE TABLE "new_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerTxnId" TEXT,
    "isTest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "createdAt", "currency", "eventId", "id", "isTest", "providerTxnId", "status", "userId") SELECT "amount", "createdAt", "currency", "eventId", "id", "isTest", "providerTxnId", "status", "userId" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE INDEX "payments_eventId_idx" ON "payments"("eventId");
CREATE INDEX "payments_userId_idx" ON "payments"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
