-- Add North America region and United States of America country if missing.
INSERT INTO regions (id, name, "createdAt", "updatedAt")
SELECT 'region_north_america', 'North America', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM regions WHERE LOWER(name) = LOWER('North America')
);

INSERT INTO countries (id, name, code, "regionId", "createdAt", "updatedAt")
SELECT
  'country_usa',
  'United States of America',
  'US',
  (SELECT id FROM regions WHERE LOWER(name) = LOWER('North America') LIMIT 1),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM countries WHERE LOWER(name) = LOWER('United States of America')
);

-- Ensure USA flag is set if the country already exists.
UPDATE countries
SET "flagSvg" = 'https://flagpedia.net/data/flags/w580/us.webp',
    "updatedAt" = NOW()
WHERE LOWER(name) = LOWER('United States of America')
  AND ("flagSvg" IS NULL OR "flagSvg" = '');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'countries'
      AND column_name = 'isOrigin'
  ) THEN
    UPDATE countries
    SET "isOrigin" = false,
        "updatedAt" = NOW()
    WHERE LOWER(name) = LOWER('United States of America');
  END IF;
END $$;

-- Fix common misspelling if present (avoid unique conflicts).
UPDATE countries
SET name = 'Guatemala'
WHERE LOWER(name) = LOWER('Guatamala')
  AND NOT EXISTS (
    SELECT 1 FROM countries WHERE LOWER(name) = LOWER('Guatemala')
  );

-- If both entries exist, repoint references to the correct one, then delete the misspelling.
WITH bad AS (
  SELECT id FROM countries WHERE LOWER(name) = LOWER('Guatamala')
), good AS (
  SELECT id FROM countries WHERE LOWER(name) = LOWER('Guatemala')
)
UPDATE roaster_source_countries
SET "countryId" = (SELECT id FROM good)
WHERE "countryId" IN (SELECT id FROM bad)
  AND EXISTS (SELECT 1 FROM good);

DELETE FROM countries
WHERE LOWER(name) = LOWER('Guatamala')
  AND EXISTS (
    SELECT 1 FROM countries WHERE LOWER(name) = LOWER('Guatemala')
  );
