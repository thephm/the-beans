-- CreateTable
CREATE TABLE "roaster_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "filename" TEXT,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roasterId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "roaster_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "roaster_images" ADD CONSTRAINT "roaster_images_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_images" ADD CONSTRAINT "roaster_images_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
