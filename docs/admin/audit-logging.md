# Audit Logging System

## Overview

The Beans implements a comprehensive audit logging system that tracks all significant system changes, providing detailed information about who made changes, what was changed, when it occurred, and from where.

## Features

### Tracked Information
- **WHO**: User identification with links to user profiles
- **WHAT**: Entity-level tracking (roasters, reviews, beans, users) with detailed change information
- **WHEN**: Precise timestamps in YYYY-MM-DD HH:MM:SS format
- **WHERE**: IP address geolocation including city and country
- **HOW**: Field-level change detection showing before and after values

### Supported Actions
- **CREATE**: New entity creation
- **UPDATE**: Entity modifications with field-level change tracking
- **DELETE**: Entity deletions (preserves entity details)

### Tracked Entities
- **Roasters**: Coffee shop information, contact details, specialties
- **Reviews**: User ratings and feedback
- **Beans**: Coffee product information
- **Users**: Account changes and administrative actions

## Architecture

### Database Schema

```sql
AuditLog {
  id          String   @id @default(cuid())
  action      String   -- CREATE, UPDATE, DELETE
  entityType  String   -- roaster, review, bean, user, etc.
  entityId    String   -- ID of the affected entity
  entityName  String?  -- Display name for the entity
  changes     Json?    -- Field-level changes: { "field": { "old": "value", "new": "value" } }
  ipAddress   String?  -- IP address of the user
  userAgent   String?  -- Browser/client information
  city        String?  -- Geolocation city
  country     String?  -- Geolocation country
  createdAt   DateTime @default(now())
  userId      String   -- User who performed the action
  user        User     @relation(fields: [userId], references: [id])
}
```

### Enhanced Entity Models

All tracked entities include audit fields:

```sql
Roaster/Review/Bean {
  -- Existing fields...
  createdById String?  -- Who created this entity
  updatedById String?  -- Who last updated this entity
  createdBy   User?    @relation("EntityCreatedBy")
  updatedBy   User?    @relation("EntityUpdatedBy")
}
```

## Backend Implementation

### Audit Service (`server/src/lib/auditService.ts`)

Core service handling audit log creation with:
- **IP Geolocation**: Uses ipapi.co with caching to reduce API calls
- **Change Detection**: Field-level comparison between old and new values
- **Async Processing**: Non-blocking audit logging that doesn't impact main operations
- **Error Isolation**: Audit failures don't affect core functionality

### Audit Middleware (`server/src/middleware/auditMiddleware.ts`)

Middleware components for automatic audit integration:
- `auditBefore()`: Captures audit context before operations
- `auditAfter()`: Logs audit information after successful operations
- `captureOldValues()`: Stores current state before UPDATE/DELETE operations
- `storeEntityForAudit()`: Stores result entities for audit logging

### Route Integration

Routes are enhanced with audit middleware:

```typescript
// CREATE operation
router.post('/', [
  // validation...
], requireAuth, auditBefore('roaster', 'CREATE'), async (req, res) => {
  // create logic...
  res.locals.auditEntity = result;
}, auditAfter());

// UPDATE operation  
router.put('/:id', [
  // validation...
], requireAuth, auditBefore('roaster', 'UPDATE'), captureOldValues(prisma.roaster), async (req, res) => {
  // update logic...
  res.locals.auditEntity = result;
}, auditAfter());
```

## Admin Interface

### Audit Log Dashboard (`/admin/audit-logs`)

Comprehensive interface featuring:

#### Statistics Overview
- Total audit logs count
- Recent activity (last 30 days)
- Action type breakdown (CREATE/UPDATE/DELETE)
- Entity type statistics
- Most active users

#### Advanced Filtering
- **Action Type**: Filter by CREATE, UPDATE, or DELETE
- **Entity Type**: Filter by roaster, review, bean, user
- **User**: Filter by specific user ID
- **Date Range**: Start and end date filtering
- **Real-time Search**: Apply and clear filters dynamically

#### Detailed Log View
- Tabular display with sortable columns
- User profile links for easy navigation
- Entity links to view affected records
- Geolocation information (city, country)
- Change count indicators

#### Change Details Modal
- Side-by-side old vs new value comparison
- Field-level change breakdown
- Complete audit metadata (IP, location, timestamp)
- Formatted JSON display for complex objects

### Navigation Integration
- Added to admin dropdown menu as "Audit Logs"
- Admin-only access with proper role checking
- Internationalized labels (English/French support)

## API Endpoints

### List Audit Logs
```
GET /api/admin/audit-logs
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `action`: Filter by action (CREATE, UPDATE, DELETE)
- `entityType`: Filter by entity type (roaster, review, bean, user)
- `userId`: Filter by user ID
- `startDate`: Filter from date (ISO format)
- `endDate`: Filter to date (ISO format)

**Response:**
```json
{
  "auditLogs": [
    {
      "id": "audit_123",
      "action": "UPDATE",
      "entityType": "roaster", 
      "entityId": "roaster_456",
      "entityName": "Blue Bottle Coffee",
      "changes": {
        "description": {
          "old": "Great coffee shop",
          "new": "Amazing specialty coffee roaster"
        }
      },
      "ipAddress": "192.168.1.1",
      "city": "San Francisco",
      "country": "United States",
      "createdAt": "2025-10-04T15:30:00Z",
      "user": {
        "id": "user_789",
        "username": "admin",
        "email": "admin@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Audit Statistics
```
GET /api/admin/audit-logs/stats
```

**Response:**
```json
{
  "totalLogs": 1250,
  "recentLogs": 45,
  "actionStats": [
    {"action": "UPDATE", "count": 25},
    {"action": "CREATE", "count": 15},
    {"action": "DELETE", "count": 5}
  ],
  "entityTypeStats": [
    {"entityType": "roaster", "count": 30},
    {"entityType": "review", "count": 10},
    {"entityType": "user", "count": 5}
  ],
  "topUsers": [
    {
      "user": {"id": "user_1", "username": "admin"},
      "count": 20
    }
  ]
}
```

### Get Specific Audit Log
```
GET /api/admin/audit-logs/:id
```

Returns detailed information for a specific audit log entry.

## Security & Performance

### Access Control
- All audit endpoints require admin authentication
- Role-based access control prevents unauthorized access
- Audit logs are read-only (cannot be modified or deleted)

### Performance Optimizations
- **Database Indexing**: Optimized queries on entityType, userId, and createdAt
- **IP Geolocation Caching**: Reduces external API calls for repeated IP addresses
- **Pagination**: Prevents large result set performance issues
- **Async Processing**: Audit logging doesn't block main operations

### Privacy & Compliance
- IP addresses are logged for security monitoring
- Geolocation provides general location (city/country level)
- Field-level change tracking maintains data integrity audit trail
- No sensitive data (passwords, tokens) is logged in changes

## Troubleshooting

### Common Issues

**Audit logs not appearing:**
- Verify routes include audit middleware
- Check that operations complete successfully (2xx status codes)
- Confirm user authentication is working

**Geolocation showing "Unknown":**
- Check internet connectivity for ipapi.co
- Verify IP address is not local/private range
- Review rate limiting on geolocation API

**Performance issues:**
- Consider increasing pagination limits
- Add additional database indexes for custom filtering
- Monitor geolocation API cache hit rates

### Debugging

Enable debug logging in development:
```typescript
// In auditService.ts
console.log(`Audit log created: ${data.action} ${data.entityType} ${data.entityId}`);
```

## Future Enhancements

- **Real-time Notifications**: WebSocket integration for live audit monitoring
- **Advanced Analytics**: Trend analysis and anomaly detection
- **Export Functionality**: CSV/JSON export for compliance reporting
- **Retention Policies**: Automatic cleanup of old audit logs
- **Enhanced Geolocation**: More detailed location tracking options
- **API Rate Limiting**: Track and limit API usage per user