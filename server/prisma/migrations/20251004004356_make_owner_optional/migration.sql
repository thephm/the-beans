-- DropForeignKey
ALTER TABLE "roasters" DROP CONSTRAINT "roasters_ownerId_fkey";

-- AlterTable
ALTER TABLE "roasters" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "roasters" ADD CONSTRAINT "roasters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
