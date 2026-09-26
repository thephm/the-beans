CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" VARCHAR(32) NOT NULL,
    "platform" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "location" TEXT,
    "publisherOrganizationName" TEXT,
    "parentResourceId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");
CREATE INDEX "resources_resourceType_idx" ON "resources"("resourceType");
CREATE INDEX "resources_platform_idx" ON "resources"("platform");

CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "websiteUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "people_slug_key" ON "people"("slug");

CREATE TABLE "resource_people" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" VARCHAR(24) NOT NULL,
    CONSTRAINT "resource_people_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "resource_people_resourceId_personId_role_key" ON "resource_people"("resourceId", "personId", "role");

CREATE TABLE "resource_links" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "linkType" VARCHAR(20) NOT NULL DEFAULT 'other',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "resource_links_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "resource_links_resourceId_displayOrder_idx" ON "resource_links"("resourceId", "displayOrder");

CREATE TABLE "resource_roasters" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "resource_roasters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "resource_roasters_resourceId_roasterId_key" ON "resource_roasters"("resourceId", "roasterId");
CREATE INDEX "resource_roasters_roasterId_idx" ON "resource_roasters"("roasterId");

CREATE TABLE "resource_observations" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "observationType" VARCHAR(24) NOT NULL,
    "value" INTEGER NOT NULL,
    "observedAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "notes" TEXT,
    CONSTRAINT "resource_observations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "resource_observations_resourceId_observedAt_idx" ON "resource_observations"("resourceId", "observedAt");

ALTER TABLE "resources" ADD CONSTRAINT "resources_parentResourceId_fkey" FOREIGN KEY ("parentResourceId") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "resource_people" ADD CONSTRAINT "resource_people_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_people" ADD CONSTRAINT "resource_people_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_links" ADD CONSTRAINT "resource_links_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_roasters" ADD CONSTRAINT "resource_roasters_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_roasters" ADD CONSTRAINT "resource_roasters_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_observations" ADD CONSTRAINT "resource_observations_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
