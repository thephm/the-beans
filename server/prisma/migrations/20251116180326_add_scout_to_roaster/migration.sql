-- AlterTable
ALTER TABLE "roasters" ADD COLUMN     "scoutId" TEXT;

-- AddForeignKey
ALTER TABLE "roasters" ADD CONSTRAINT "roasters_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
