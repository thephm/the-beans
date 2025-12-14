SELECT changes FROM audit_logs WHERE "entityType" = 'RoasterSuggestion' AND action = 'CREATE' ORDER BY "createdAt" DESC LIMIT 1;
