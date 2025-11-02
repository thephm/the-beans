-- CreateTable
CREATE TABLE "specialties" (
    "id" TEXT NOT NULL,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialty_translations" (
    "id" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "language" VARCHAR(5) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialty_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roaster_specialties" (
    "id" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roaster_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialty_translations_specialtyId_language_key" ON "specialty_translations"("specialtyId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "roaster_specialties_roasterId_specialtyId_key" ON "roaster_specialties"("roasterId", "specialtyId");

-- AddForeignKey
ALTER TABLE "specialty_translations" ADD CONSTRAINT "specialty_translations_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_specialties" ADD CONSTRAINT "roaster_specialties_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roaster_specialties" ADD CONSTRAINT "roaster_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
