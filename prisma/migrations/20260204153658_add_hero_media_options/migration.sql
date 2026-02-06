-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "heroImages" JSONB,
ADD COLUMN     "heroMediaType" TEXT NOT NULL DEFAULT 'image',
ADD COLUMN     "heroSlideshowSpeed" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "heroVideoUrl" TEXT;
