-- Add North America region if missing (for Hawaii source country).
INSERT INTO regions (id, name, "createdAt", "updatedAt")
SELECT 'region_north_america', 'North America', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM regions WHERE LOWER(name) = LOWER('North America')
);

-- Add Hawaii as a source country if missing.
INSERT INTO countries (id, name, code, "regionId", "flagSvg", "createdAt", "updatedAt")
SELECT
  'country_hawaii',
  'Hawaii',
  'HI',
  (SELECT id FROM regions WHERE LOWER(name) = LOWER('North America') LIMIT 1),
  'https://upload.wikimedia.org/wikipedia/commons/e/ef/Flag_of_Hawaii.svg',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM countries WHERE LOWER(name) = LOWER('Hawaii')
);
