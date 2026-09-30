DELETE FROM "resource_people" AS contact
USING "resource_people" AS other
WHERE contact."role" = 'contact'
  AND other."role" = 'other'
  AND contact."resourceId" = other."resourceId"
  AND contact."personId" = other."personId";

UPDATE "resource_people"
SET "role" = 'other'
WHERE "role" = 'contact';

UPDATE "roaster_people" AS person
SET "roles" = ARRAY(
  SELECT normalized.role
  FROM (
    SELECT
      CASE WHEN role_value = 'contact' THEN 'other' ELSE role_value END AS role,
      MIN(ordinal) AS first_position
    FROM UNNEST(person."roles") WITH ORDINALITY AS roles(role_value, ordinal)
    GROUP BY CASE WHEN role_value = 'contact' THEN 'other' ELSE role_value END
  ) AS normalized
  ORDER BY normalized.first_position
)
WHERE 'contact' = ANY(person."roles");
