ALTER TABLE "resources"
  DROP COLUMN IF EXISTS "parentResourceId",
  DROP COLUMN IF EXISTS "publisherOrganizationName";