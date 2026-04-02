-- Ensure North America region exists and normalize USA country data.
DO $$
DECLARE
  region_id TEXT;
  us_code_id TEXT;
  us_name_id TEXT;
BEGIN
  SELECT id
  INTO region_id
  FROM regions
  WHERE LOWER(name) = LOWER('North America')
  LIMIT 1;

  IF region_id IS NULL THEN
    INSERT INTO regions (id, name, "createdAt", "updatedAt")
    VALUES ('region_north_america', 'North America', NOW(), NOW())
    RETURNING id INTO region_id;
  END IF;

  SELECT id INTO us_code_id
  FROM countries
  WHERE code = 'US'
  LIMIT 1;

  SELECT id INTO us_name_id
  FROM countries
  WHERE LOWER(name) = LOWER('United States of America')
  LIMIT 1;

  IF us_code_id IS NOT NULL THEN
    UPDATE countries
    SET name = 'United States of America',
        "regionId" = region_id,
        "flagSvg" = CASE
          WHEN "flagSvg" IS NULL OR "flagSvg" = '' THEN 'https://flagpedia.net/data/flags/w580/us.webp'
          ELSE "flagSvg"
        END,
        "updatedAt" = NOW()
    WHERE id = us_code_id;

    IF us_name_id IS NOT NULL AND us_name_id <> us_code_id THEN
      UPDATE roaster_source_countries
      SET "countryId" = us_code_id
      WHERE "countryId" = us_name_id;

      DELETE FROM countries
      WHERE id = us_name_id;
    END IF;
  ELSIF us_name_id IS NOT NULL THEN
    UPDATE countries
    SET code = 'US',
        "regionId" = region_id,
        "flagSvg" = CASE
          WHEN "flagSvg" IS NULL OR "flagSvg" = '' THEN 'https://flagpedia.net/data/flags/w580/us.webp'
          ELSE "flagSvg"
        END,
        "updatedAt" = NOW()
    WHERE id = us_name_id;
  ELSE
    INSERT INTO countries (id, name, code, "regionId", "flagSvg", "createdAt", "updatedAt")
    VALUES (
      'country_usa',
      'United States of America',
      'US',
      region_id,
      'https://flagpedia.net/data/flags/w580/us.webp',
      NOW(),
      NOW()
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'countries'
      AND column_name = 'isOrigin'
  ) THEN
    UPDATE countries
    SET "isOrigin" = false,
        "updatedAt" = NOW()
    WHERE code = 'US'
       OR LOWER(name) = LOWER('United States of America');
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
