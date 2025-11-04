SELECT 
  id,
  action,
  "entityType",
  "entityName",
  "createdAt",
  TO_CHAR("createdAt" AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI:SS') as est_time
FROM audit_logs 
WHERE ("entityName" = 'Lavender Bean Co.' OR "entityName" = 'First Person')
  AND DATE("createdAt") = '2025-11-02'
ORDER BY "createdAt" DESC, id DESC
LIMIT 10;
