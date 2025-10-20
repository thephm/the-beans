/*
  Warnings:

  - You are about to drop the column `ownerBio` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `ownerEmail` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `ownerMobile` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `ownerName` on the `roasters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "roasters" DROP COLUMN "ownerBio",
DROP COLUMN "ownerEmail",
DROP COLUMN "ownerMobile",
DROP COLUMN "ownerName";
