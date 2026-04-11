-- Add slug column as nullable first so we can backfill existing rows safely
ALTER TABLE "roasters" ADD COLUMN "slug" TEXT;

-- Build deterministic slug candidates from roaster names and de-duplicate collisions.
WITH base AS (
  SELECT
    id,
    trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) AS slug_base
  FROM "roasters"
),
normalized AS (
  SELECT
    id,
    CASE
      WHEN slug_base IS NULL OR slug_base = '' THEN 'roaster'
      ELSE slug_base
    END AS slug_base
  FROM base
),
ranked AS (
  SELECT
    id,
    slug_base,
    row_number() OVER (PARTITION BY slug_base ORDER BY id) AS slug_rank
  FROM normalized
)
UPDATE "roasters" r
SET "slug" = CASE
  WHEN ranked.slug_rank = 1 THEN ranked.slug_base
  ELSE ranked.slug_base || '-' || ranked.slug_rank
END
FROM ranked
WHERE r.id = ranked.id;

ALTER TABLE "roasters" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "roasters_slug_key" ON "roasters"("slug");
