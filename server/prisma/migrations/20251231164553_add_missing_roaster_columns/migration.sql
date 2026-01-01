/*
  Warnings:

  - Made the column `country` on table `roasters` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "roasters"
ALTER COLUMN "country" SET NOT NULL;
