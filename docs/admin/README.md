# Admin Features

The Admin Dashboard allows privileged users to manage the application's users, content, and monitor system activity.

## Capabilities

### User Management
- View all registered users
- View user last login timestamps
- The desktop Users list hides the language column and keeps Last Login and Created dates on one line in `YYYY-MM-DD` format.
- Edit user roles (admin/user) and language preferences
- Delete users

### Roaster Management  
- View and edit all roasters
- Verify roaster information
- Manage roaster ownership
- Update roaster owner contact information (name, email, bio, mobile)

### Person Management
- Edit person details and roles at `/admin/people`
- Edit Person biography fields show six lines by default; the Add Person form retains four lines.
- Add a person associated with a roaster, a resource, or both; at least one association is required
- The Resource section below Roaster supports resource search and independent resource roles (including Creator, Author, and Contributor)
- Adding from a resource preselects that resource and still allows an optional roaster association
- Selected associations are created together in a database transaction, so a failed save does not partially create a person
- New or changed roaster-person biographies are limited to 1,000 characters
- Existing imported biographies above that limit can be saved unchanged when editing roles or other details
- Failed saves display the API's validation messages, including the reason a biography was rejected
- The People list normalizes legacy role casing and displays each role once per association, using translated labels and consistent badge colors on desktop and mobile
- Creating or editing role selections stores unique, trimmed, lowercase role identifiers; existing database records are not rewritten by listing them
- Public and admin person-role displays share pastel pills and translated labels; selected role buttons use the same palette. See [Person Role Palette](person-role-palette.md) for labels, exact color codes, and maintenance rules.

### Audit Logging
- Comprehensive activity tracking and monitoring
- View detailed audit logs with filtering capabilities
- Track who created, modified, or deleted what content
- Monitor user activities and system changes
- IP geolocation and security monitoring

### Database Backup
- Create PostgreSQL database dumps
- Automatic upload to WebDAV storage
- Timestamped backup files
- Admin-only access via API endpoint
- See [Database Backup Configuration](database-backup.md) for setup

All admin actions are restricted to users with the `admin` role.

## Access

The Admin Dashboard is accessible via the main navigation bar (visible only to admins):
- **User Management**: `/admin/users`
- **Roaster Management**: `/admin/roasters`  
- **Audit Logs**: `/admin/audit-logs`
- **Database Backup**: API endpoint only (`POST /api/backup/database`)

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

### Person Management
- `POST /api/people` — Create a person with `roasterId`, `resourceId`, or both
- `roles` and `isPrimary` apply to the roaster association; `resourceRoles` and `resourceIsPrimary` apply to the resource association
- Resource associations require admin access; roaster-only creation retains existing owner/admin permissions

### Database Backup
- `POST /api/backup/database` — Create database backup and upload to WebDAV (admin only)

## UI

- Inline editing for user role and language
- Delete with confirmation dialog
- URL fields in admin forms include a 45-degree arrow that opens the current value in a new tab; email fields include an envelope that opens the mail application.
- These actions also apply to social links, contact people, and image URLs. They use unsaved field values without submitting the form, preserve existing editing and paste behavior, and include English/French accessible labels.
- Empty fields have no link action. Invalid values display a disabled icon with an explanatory tooltip. URLs without a scheme open using HTTPS; only HTTP/HTTPS destinations are allowed.

---

- [Database Backup Configuration](database-backup.md) - WebDAV setup and backup procedures
- [Audit Logging](audit-logging.md) - Activity tracking documentation
See also: [API](api.md), [Design](design.md), [Requirements](requirements.md), [Test Cases](test.md)
