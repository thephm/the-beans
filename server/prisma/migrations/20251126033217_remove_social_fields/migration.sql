/*
  Warnings:

  - You are about to drop the column `bluesky` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `facebook` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `pinterest` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `reddit` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `threads` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `tiktok` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `x` on the `roasters` table. All the data in the column will be lost.
  - You are about to drop the column `youtube` on the `roasters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "roasters" DROP COLUMN "bluesky",
DROP COLUMN "facebook",
DROP COLUMN "instagram",
DROP COLUMN "linkedin",
DROP COLUMN "pinterest",
DROP COLUMN "reddit",
DROP COLUMN "threads",
DROP COLUMN "tiktok",
DROP COLUMN "x",
DROP COLUMN "youtube";
