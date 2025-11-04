SELECT 
  id,
  action,
  "entityType",
  "entityName",
  "createdAt",
  TO_CHAR("createdAt", 'YYYY-MM-DD HH24:MI:SS.MS') as formatted_time
FROM audit_logs 
WHERE "createdAt" >= '2025-11-02'
  AND "entityType" IN ('roaster', 'person')
ORDER BY "createdAt" DESC, id DESC 
LIMIT 10;
