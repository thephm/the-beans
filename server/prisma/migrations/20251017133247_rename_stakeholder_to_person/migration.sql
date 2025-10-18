/*
  Warnings:

  - You are about to drop the `roaster_stakeholders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "roaster_stakeholders" DROP CONSTRAINT "roaster_stakeholders_createdById_fkey";

-- DropForeignKey
ALTER TABLE "roaster_stakeholders" DROP CONSTRAINT "roaster_stakeholders_roasterId_fkey";

-- DropForeignKey
ALTER TABLE "roaster_stakeholders" DROP CONSTRAINT "roaster_stakeholders_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "roaster_stakeholders" DROP CONSTRAINT "roaster_stakeholders_userId_fkey";

-- DropTable
DROP TABLE "roaster_stakeholders";

-- CreateTable
CREATE TABLE "roaster_people" (
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

    CONSTRAINT "roaster_people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roaster_people_roasterId_email_key" ON "roaster_people"("roasterId", "email");

-- AddForeignKey
ALTER TABLE "roaster_people" ADD CONSTRAINT "roaster_people_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_people" ADD CONSTRAINT "roaster_people_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_people" ADD CONSTRAINT "roaster_people_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_people" ADD CONSTRAINT "roaster_people_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
