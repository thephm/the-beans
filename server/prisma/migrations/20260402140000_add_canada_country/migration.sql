-- Add Canada country if missing.
INSERT INTO countries (id, name, code, "regionId", "flagSvg", "createdAt", "updatedAt")
SELECT
  'country_canada',
  'Canada',
  'CA',
  (SELECT id FROM regions WHERE LOWER(name) = LOWER('North America') LIMIT 1),
  'https://flagpedia.net/data/flags/w580/ca.webp',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM countries WHERE LOWER(name) = LOWER('Canada')
);

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
    WHERE LOWER(name) = LOWER('Canada');
  END IF;
END $$;
