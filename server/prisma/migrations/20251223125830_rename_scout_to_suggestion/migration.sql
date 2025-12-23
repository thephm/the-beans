/*
  Warnings:

  - The values [Scout] on the enum `RoasterSourceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoasterSourceType_new" AS ENUM ('Suggestion', 'Google', 'GoogleMaps', 'Reddit', 'ChatGPT', 'Claude', 'YouTube', 'Instagram', 'TikTok', 'API', 'Other');
ALTER TABLE "roasters" ALTER COLUMN "sourceType" TYPE "RoasterSourceType_new" USING ("sourceType"::text::"RoasterSourceType_new");
ALTER TYPE "RoasterSourceType" RENAME TO "RoasterSourceType_old";
ALTER TYPE "RoasterSourceType_new" RENAME TO "RoasterSourceType";
DROP TYPE "RoasterSourceType_old";
COMMIT;
