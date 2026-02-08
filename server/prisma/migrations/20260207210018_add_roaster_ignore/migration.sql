-- CreateTable
CREATE TABLE "roaster_ignore" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "instagramUrl" TEXT NOT NULL,
    "handle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "roaster_ignore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roaster_ignore_instagramUrl_key" ON "roaster_ignore"("instagramUrl");

-- AddForeignKey
ALTER TABLE "roaster_ignore" ADD CONSTRAINT "roaster_ignore_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
