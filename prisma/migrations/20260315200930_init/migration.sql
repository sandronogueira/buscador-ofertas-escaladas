-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "nicheLabel" TEXT NOT NULL,
    "adsActive" INTEGER NOT NULL DEFAULT 0,
    "adsTotal" INTEGER NOT NULL DEFAULT 0,
    "firstAdDate" TIMESTAMP(3),
    "daysActive" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "isScaled" BOOLEAN NOT NULL DEFAULT false,
    "lastScraped" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeLog" (
    "id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "advertisersFound" INTEGER NOT NULL DEFAULT 0,
    "scaledFound" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ScrapeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Advertiser_pageId_key" ON "Advertiser"("pageId");

-- CreateIndex
CREATE INDEX "Advertiser_niche_idx" ON "Advertiser"("niche");

-- CreateIndex
CREATE INDEX "Advertiser_isScaled_idx" ON "Advertiser"("isScaled");

-- CreateIndex
CREATE INDEX "Advertiser_score_idx" ON "Advertiser"("score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_advertiserId_key" ON "Favorite"("advertiserId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
