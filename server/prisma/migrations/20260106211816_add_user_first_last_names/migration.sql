/*
  Warnings:

  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "roasters" ADD COLUMN IF NOT EXISTS "images" TEXT[];

-- AlterTable - Add columns with defaults for existing rows
ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN "lastName" TEXT;

-- Update existing users with default values
UPDATE "users" SET "firstName" = 'Unknown' WHERE "firstName" IS NULL;
UPDATE "users" SET "lastName" = 'User' WHERE "lastName" IS NULL;

-- Make columns required (NOT NULL)
ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL;

