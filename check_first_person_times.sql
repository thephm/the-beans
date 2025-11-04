SELECT 
  id,
  "entityName",
  "createdAt" AT TIME ZONE 'UTC' as utc_time,
  "createdAt" AT TIME ZONE 'America/New_York' as est_time,
  TO_CHAR("createdAt" AT TIME ZONE 'America/New_York', 'HH24:MI') as display_time
FROM audit_logs
WHERE 
  "entityName" IN ('First Person', 'Purple Mountain Coffee', 'Lavender Bean Co.')
  AND DATE("createdAt") = '2025-11-02'
ORDER BY "createdAt" DESC, id DESC
LIMIT 20;
