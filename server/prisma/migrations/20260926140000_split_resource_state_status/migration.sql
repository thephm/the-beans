ALTER TABLE "resources" RENAME COLUMN "status" TO "state";
ALTER TABLE "resources" ADD COLUMN "status" VARCHAR(16) NOT NULL DEFAULT 'unknown';