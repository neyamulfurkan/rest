/*
  Warnings:

  - You are about to drop the column `heroSlideshowSpeed` on the `Restaurant` table. All the data in the column will be lost.
  - The `heroImages` column on the `Restaurant` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "heroSlideshowSpeed",
ADD COLUMN     "heroSlideshowEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "heroSlideshowInterval" INTEGER NOT NULL DEFAULT 5000,
DROP COLUMN "heroImages",
ADD COLUMN     "heroImages" TEXT[];
