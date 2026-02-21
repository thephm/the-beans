BEGIN;

CREATE TEMP TABLE temp_new_specialties (
  id TEXT,
  language VARCHAR(5),
  part_name TEXT
);

-- Create missing specialties for comma-split parts (per language)
WITH bad AS (
  SELECT st."specialtyId" AS bad_specialty_id,
         st."language",
         st."name" AS bad_name
  FROM "specialty_translations" st
  WHERE st."name" LIKE '%,%'
),
parts AS (
  SELECT bad_specialty_id,
         "language",
         btrim(part) AS part_name
  FROM bad, unnest(string_to_array(bad_name, ',')) AS part
),
missing AS (
  SELECT DISTINCT p."language", p.part_name
  FROM parts p
  LEFT JOIN "specialty_translations" st2
    ON st2."language" = p."language"
   AND lower(st2."name") = lower(p.part_name)
  WHERE st2."specialtyId" IS NULL
)
INSERT INTO temp_new_specialties (id, language, part_name)
SELECT gen_random_uuid()::text, "language", part_name
FROM missing;

INSERT INTO "specialties" ("id", "deprecated", "createdAt", "updatedAt")
SELECT id, false, NOW(), NOW()
FROM temp_new_specialties;

INSERT INTO "specialty_translations" ("id", "specialtyId", "language", "name", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, id, language, part_name, NULL, NOW(), NOW()
FROM temp_new_specialties;

-- Relink roasters to the correct split specialties
WITH bad AS (
  SELECT st."specialtyId" AS bad_specialty_id,
         st."language",
         st."name" AS bad_name
  FROM "specialty_translations" st
  WHERE st."name" LIKE '%,%'
),
parts AS (
  SELECT bad_specialty_id,
         "language",
         btrim(part) AS part_name
  FROM bad, unnest(string_to_array(bad_name, ',')) AS part
),
matches AS (
  SELECT p.bad_specialty_id,
         p."language",
         p.part_name,
         st2."specialtyId" AS good_specialty_id
  FROM parts p
  JOIN "specialty_translations" st2
    ON st2."language" = p."language"
   AND lower(st2."name") = lower(p.part_name)
)
INSERT INTO "roaster_specialties" ("id", "roasterId", "specialtyId", "createdAt")
SELECT gen_random_uuid()::text, rs."roasterId", m.good_specialty_id, NOW()
FROM "roaster_specialties" rs
JOIN matches m ON m.bad_specialty_id = rs."specialtyId"
ON CONFLICT ("roasterId", "specialtyId") DO NOTHING;

-- Remove comma-joined specialties
DELETE FROM "roaster_specialties"
WHERE "specialtyId" IN (
  SELECT st."specialtyId"
  FROM "specialty_translations" st
  WHERE st."name" LIKE '%,%'
);

DELETE FROM "specialties"
WHERE "id" IN (
  SELECT st."specialtyId"
  FROM "specialty_translations" st
  WHERE st."name" LIKE '%,%'
);

COMMIT;
