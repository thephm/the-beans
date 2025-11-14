SELECT 
  id,
  action,
  "entityType",
  "entityName",
  "createdAt",
  TO_CHAR("createdAt", 'YYYY-MM-DD HH24:MI:SS.MS') as utc_time
FROM audit_logs 
WHERE "entityName" IN ('Lavender Bean Co.', 'First Person')
  AND DATE("createdAt") = '2025-11-02'
ORDER BY "createdAt" DESC, id DESC;
