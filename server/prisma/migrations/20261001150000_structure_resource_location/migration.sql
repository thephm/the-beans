ALTER TABLE "resources"
  ADD COLUMN "city" TEXT,
  ADD COLUMN "province" TEXT,
  ADD COLUMN "country" TEXT;

WITH resource_locations AS (
  SELECT
    "id",
    string_to_array("location", ',') AS parts
  FROM "resources"
  WHERE NULLIF(BTRIM("location"), '') IS NOT NULL
)
UPDATE "resources" AS resource
SET
  "city" = CASE
    WHEN array_length(resource_locations.parts, 1) > 1 THEN NULLIF(BTRIM(resource_locations.parts[1]), '')
    ELSE NULL
  END,
  "province" = CASE
    WHEN array_length(resource_locations.parts, 1) > 2 THEN
      CASE UPPER(BTRIM(resource_locations.parts[2]))
        WHEN 'CA' THEN 'California'
        ELSE NULLIF(BTRIM(resource_locations.parts[2]), '')
      END
    ELSE NULL
  END,
  "country" = CASE
    WHEN array_length(resource_locations.parts, 1) = 1 THEN NULLIF(BTRIM(resource_locations.parts[1]), '')
    WHEN array_length(resource_locations.parts, 1) = 2 THEN NULLIF(BTRIM(resource_locations.parts[2]), '')
    ELSE CASE UPPER(BTRIM(resource_locations.parts[array_length(resource_locations.parts, 1)]))
      WHEN 'USA' THEN 'United States of America'
      WHEN 'US' THEN 'United States of America'
      WHEN 'UNITED STATES' THEN 'United States of America'
      ELSE NULLIF(BTRIM(resource_locations.parts[array_length(resource_locations.parts, 1)]), '')
    END
  END
FROM resource_locations
WHERE resource."id" = resource_locations."id";

ALTER TABLE "resources" DROP COLUMN "location";