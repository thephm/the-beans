ALTER TABLE "resources" ADD COLUMN "publisherRoasterId" TEXT;
CREATE INDEX "resources_publisherRoasterId_idx" ON "resources"("publisherRoasterId");
ALTER TABLE "resources" ADD CONSTRAINT "resources_publisherRoasterId_fkey" FOREIGN KEY ("publisherRoasterId") REFERENCES "roasters"("id") ON DELETE SET NULL ON UPDATE CASCADE;