-- CreateTable
CREATE TABLE "roaster_suggestions" (
    "id" TEXT NOT NULL,
    "roasterName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "submitterRole" TEXT NOT NULL,
    "submitterFirstName" TEXT NOT NULL,
    "submitterLastName" TEXT,
    "submitterEmail" TEXT NOT NULL,
    "submitterPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "roaster_suggestions_pkey" PRIMARY KEY ("id")
);
