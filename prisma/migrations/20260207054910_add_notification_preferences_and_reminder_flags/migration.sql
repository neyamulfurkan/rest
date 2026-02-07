-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "notificationPreferences" JSONB DEFAULT '{"email":true,"sms":true}';
