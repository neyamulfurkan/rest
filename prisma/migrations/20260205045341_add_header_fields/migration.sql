-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "headerBgColor" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "headerTextColor" TEXT NOT NULL DEFAULT '#171717',
ADD COLUMN     "headerTransparentOverMedia" BOOLEAN NOT NULL DEFAULT false;
