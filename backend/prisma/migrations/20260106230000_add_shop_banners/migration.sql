-- CreateTable
CREATE TABLE "shop_banners" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "description" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "backgroundType" TEXT NOT NULL DEFAULT 'gradient',
    "backgroundValue" TEXT,
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "buttonColor" TEXT,
    "mainImage" TEXT,
    "secondaryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "layout" TEXT NOT NULL DEFAULT 'horizontal',
    "height" TEXT NOT NULL DEFAULT 'medium',
    "customHeight" TEXT,
    "positioning" JSONB,
    "showBadge" BOOLEAN NOT NULL DEFAULT false,
    "badgeText" TEXT,
    "badgeColor" TEXT DEFAULT '#EF4444',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "showCountdown" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "shop_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_banners_isActive_idx" ON "shop_banners"("isActive");

-- CreateIndex
CREATE INDEX "shop_banners_priority_idx" ON "shop_banners"("priority");

-- CreateIndex
CREATE INDEX "shop_banners_startDate_idx" ON "shop_banners"("startDate");

-- CreateIndex
CREATE INDEX "shop_banners_endDate_idx" ON "shop_banners"("endDate");
