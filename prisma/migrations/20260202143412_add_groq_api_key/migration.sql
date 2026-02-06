-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "enableAiFeatures" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "groqApiKey" TEXT;
