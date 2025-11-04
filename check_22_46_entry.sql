SELECT 
  id,
  action,
  "entityType",
  "entityName",
  "createdAt",
  TO_CHAR("createdAt", 'YYYY-MM-DD HH24:MI:SS') as utc_time,
  EXTRACT(EPOCH FROM "createdAt") as unix_timestamp
FROM audit_logs
WHERE 
  DATE("createdAt") = '2025-11-02'
  AND EXTRACT(HOUR FROM "createdAt") IN (2, 3, 17, 18)
ORDER BY "createdAt" DESC, id DESC;
