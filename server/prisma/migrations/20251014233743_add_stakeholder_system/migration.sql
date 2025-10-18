-- CreateTable
CREATE TABLE "roaster_stakeholders" (
    "id" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "bio" TEXT,
    "userId" TEXT,
    "roles" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "roaster_stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roaster_stakeholders_roasterId_email_key" ON "roaster_stakeholders"("roasterId", "email");

-- AddForeignKey
ALTER TABLE "roaster_stakeholders" ADD CONSTRAINT "roaster_stakeholders_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_stakeholders" ADD CONSTRAINT "roaster_stakeholders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_stakeholders" ADD CONSTRAINT "roaster_stakeholders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_stakeholders" ADD CONSTRAINT "roaster_stakeholders_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
