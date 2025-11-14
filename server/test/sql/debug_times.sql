-- Get the Lavender Bean and First Person entries from Nov 2 with their exact UTC times
SELECT 
  id,
  "entityName",
  "createdAt",
  TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as utc_time,
  TO_CHAR("createdAt" AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI:SS') as est_time
FROM audit_logs 
WHERE DATE("createdAt") = '2025-11-02'
  AND ("entityName" LIKE '%Lavender%' OR "entityName" LIKE '%First Person%')
ORDER BY "createdAt" DESC, id DESC
LIMIT 10;
