CREATE TABLE "link_checks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" VARCHAR(16) NOT NULL,
    "service" VARCHAR(16) NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "statusCode" INTEGER,
    "isBroken" BOOLEAN NOT NULL,
    "error" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "link_checks_url_category_service_entityId_key"
ON "link_checks"("url", "category", "service", "entityId");

CREATE INDEX "link_checks_checkedAt_idx" ON "link_checks"("checkedAt");
CREATE INDEX "link_checks_category_service_idx" ON "link_checks"("category", "service");
