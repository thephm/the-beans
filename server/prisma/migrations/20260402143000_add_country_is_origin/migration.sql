-- Add origin flag to countries and mark location-only entries.
ALTER TABLE countries
ADD COLUMN IF NOT EXISTS "isOrigin" BOOLEAN NOT NULL DEFAULT true;

UPDATE countries
SET "isOrigin" = false,
    "updatedAt" = NOW()
WHERE LOWER(name) IN (LOWER('United States of America'), LOWER('Canada'));
