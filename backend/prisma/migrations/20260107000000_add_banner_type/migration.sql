-- AlterTable
ALTER TABLE "shop_banners" ADD COLUMN "bannerType" TEXT NOT NULL DEFAULT 'hero';

-- CreateIndex
CREATE INDEX "shop_banners_bannerType_idx" ON "shop_banners"("bannerType");
