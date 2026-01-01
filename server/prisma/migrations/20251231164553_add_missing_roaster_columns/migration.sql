/*
  Warnings:

  - Made the column `country` on table `roasters` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "roasters" ADD COLUMN     "images" TEXT[],
ALTER COLUMN "country" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
