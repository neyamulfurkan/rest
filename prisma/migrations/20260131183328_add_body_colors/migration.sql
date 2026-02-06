-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "bodyColor" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "bodyTextColor" TEXT NOT NULL DEFAULT '#171717',
ALTER COLUMN "primaryColor" SET DEFAULT '#0ea5e9',
ALTER COLUMN "secondaryColor" SET DEFAULT '#f5f5f5',
ALTER COLUMN "accentColor" SET DEFAULT '#ef4444';
