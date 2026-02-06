-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "galleryCategories" TEXT[] DEFAULT ARRAY['All', 'Food', 'Ambiance', 'Events']::TEXT[],
ADD COLUMN     "showGalleryOnHome" BOOLEAN NOT NULL DEFAULT true;
