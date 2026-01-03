-- AlterTable
ALTER TABLE "roaster_people" ADD COLUMN     "instagramUrl" TEXT;

-- AlterTable
ALTER TABLE "roasters" ADD COLUMN     "images" TEXT[];

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
