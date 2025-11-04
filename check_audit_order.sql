SELECT 
  id,
  action,
  "entityType",
  "entityName",
  "createdAt"
FROM audit_logs 
WHERE "createdAt" >= '2025-11-02'
ORDER BY "createdAt" DESC, id DESC 
LIMIT 20;
