-- AlterTable
ALTER TABLE "roaster_suggestions" ADD COLUMN     "roasterId" TEXT;

-- AddForeignKey
ALTER TABLE "roaster_suggestions" ADD CONSTRAINT "roaster_suggestions_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
