SELECT 
  id, 
  action, 
  "entityType", 
  "entityName", 
  TO_CHAR("createdAt", 'YYYY-MM-DD HH24:MI:SS.MS') as created
FROM audit_logs 
ORDER BY "createdAt" DESC 
LIMIT 20;
