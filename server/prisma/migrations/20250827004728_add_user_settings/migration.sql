/*
  Warnings:

  - You are about to drop the column `cafeId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the `cafes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cafes_roasterId_fkey' AND table_name = 'cafes'
  ) THEN
    ALTER TABLE "public"."cafes" DROP CONSTRAINT "cafes_roasterId_fkey";
  END IF;
END$$;

-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_cafeId_fkey";

-- AlterTable
ALTER TABLE "public"."reviews" DROP COLUMN "cafeId";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "settings" JSONB;

-- DropTable
DROP TABLE "public"."cafes";
