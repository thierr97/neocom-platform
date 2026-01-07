-- AlterTable
ALTER TABLE "shop_banners" ADD COLUMN "placement" TEXT NOT NULL DEFAULT 'top';

-- CreateIndex
CREATE INDEX "shop_banners_placement_idx" ON "shop_banners"("placement");
