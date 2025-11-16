/*
  Warnings:

  - You are about to drop the column `scoutId` on the `roasters` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "roasters" DROP CONSTRAINT "roasters_scoutId_fkey";

-- AlterTable
ALTER TABLE "roasters" DROP COLUMN "scoutId";
