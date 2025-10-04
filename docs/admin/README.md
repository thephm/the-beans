# Admin Features

The Admin Dashboard allows privileged users to manage the application's users, content, and monitor system activity.

## Capabilities

### User Management
- View all registered users
- Edit user roles (admin/user) and language preferences
- Delete users

### Roaster Management  
- View and edit all roasters
- Verify roaster information
- Manage roaster ownership

### Audit Logging
- Comprehensive activity tracking and monitoring
- View detailed audit logs with filtering capabilities
- Track who created, modified, or deleted what content
- Monitor user activities and system changes
- IP geolocation and security monitoring

All admin actions are restricted to users with the `admin` role.

## Access

The Admin Dashboard is accessible via the main navigation bar (visible only to admins):
- **User Management**: `/admin/users`
- **Roaster Management**: `/admin/roasters`  
- **Audit Logs**: `/admin/audit-logs`

## API Endpoints

### User Management
- `GET /api/users` — List all users (admin only)
- `PUT /api/users/:id` — Update user role/language (admin only)
- `DELETE /api/users/:id` — Delete a user (admin only)
- `PUT /api/users/settings` — Update user settings (requires auth)
- `GET /api/users/settings` — Get user settings (requires auth)

### Roaster Management
- `GET /api/roasters` — List roasters with admin filters
- `POST /api/roasters` — Create roaster (with audit logging)
- `PUT /api/roasters/:id` — Update roaster (admin only, with audit logging)
- `DELETE /api/roasters/:id` — Delete roaster (admin only, with audit logging)
- `PUT /api/roasters/:id/verify` — Verify roaster (admin only)

### Audit Logging
- `GET /api/admin/audit-logs` — List audit logs with pagination and filtering (admin only)
- `GET /api/admin/audit-logs/stats` — Get audit statistics (admin only)
- `GET /api/admin/audit-logs/:id` — Get specific audit log entry (admin only)

## UI

- Inline editing for user role and language
- Delete with confirmation dialog

---

See also: [API](api.md), [Design](design.md), [Requirements](requirements.md), [Test Cases](test.md)
