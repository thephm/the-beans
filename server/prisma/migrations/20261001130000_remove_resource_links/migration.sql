WITH social_link_candidates AS (
    SELECT
        "resourceId",
        "url",
        "displayOrder",
        "id",
        CASE LOWER(BTRIM("title"))
            WHEN 'instagram' THEN 'instagram'
            WHEN 'tiktok' THEN 'tiktok'
            WHEN 'facebook' THEN 'facebook'
            WHEN 'linkedin' THEN 'linkedin'
            WHEN 'youtube' THEN 'youtube'
            WHEN 'threads' THEN 'threads'
            WHEN 'pinterest' THEN 'pinterest'
            WHEN 'bluesky' THEN 'bluesky'
            WHEN 'x' THEN 'x'
            WHEN 'twitter' THEN 'x'
            WHEN 'reddit' THEN 'reddit'
        END AS social_key
    FROM "resource_links"
    WHERE "url" ~* '^https?://'
), ranked_social_links AS (
    SELECT
        "resourceId",
        "url",
        social_key,
        ROW_NUMBER() OVER (PARTITION BY "resourceId", social_key ORDER BY "displayOrder", "id") AS position
    FROM social_link_candidates
    WHERE social_key IS NOT NULL
), social_network_values AS (
    SELECT
        ranked."resourceId",
        JSONB_OBJECT_AGG(ranked.social_key, ranked."url") AS social_networks
    FROM ranked_social_links AS ranked
    JOIN "resources" AS resource ON resource."id" = ranked."resourceId"
    WHERE ranked.position = 1
        AND NULLIF(BTRIM(resource."socialNetworks" ->> ranked.social_key), '') IS NULL
    GROUP BY ranked."resourceId"
)
UPDATE "resources" AS resource
SET "socialNetworks" = (
    CASE
        WHEN resource."socialNetworks" IS NULL OR JSONB_TYPEOF(resource."socialNetworks") <> 'object' THEN '{}'::jsonb
        ELSE resource."socialNetworks"
    END
) || social_network_values.social_networks
FROM social_network_values
WHERE resource."id" = social_network_values."resourceId";

DROP TABLE "resource_links";