-- CreateEnum
CREATE TYPE "RoasterSourceType" AS ENUM ('Scout', 'Google', 'Reddit', 'ChatGPT', 'YouTube', 'Instagram', 'TikTok', 'Other');

-- AlterTable
ALTER TABLE "roasters" ADD COLUMN     "sourceDetails" TEXT,
ADD COLUMN     "sourceType" "RoasterSourceType";
