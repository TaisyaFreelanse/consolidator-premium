-- CreateTable
CREATE TABLE "whitelisted_sites" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "siteAlias" TEXT NOT NULL,
    "requiresModeration" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whitelisted_sites_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "events" ADD COLUMN "requiresModeration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "siteAlias" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "whitelisted_sites_siteName_key" ON "whitelisted_sites"("siteName");

-- CreateIndex
CREATE UNIQUE INDEX "whitelisted_sites_siteAlias_key" ON "whitelisted_sites"("siteAlias");

-- DropTable (будет выполнено после миграции данных)
-- DROP TABLE "api_keys";
