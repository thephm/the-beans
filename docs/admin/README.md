# Admin Feature

The Admin Dashboard allows privileged users to manage the application's users, roles, and permissions.

## Capabilities

- View all registered users
- Edit user roles (admin/user) and language preferences
- Delete users
- All actions are restricted to users with the `admin` role

## Access

- The Admin Dashboard is accessible via the main navigation bar (visible only to admins)
- URL: `/admin/users`

## API Endpoints

- `GET /api/admin/users` — List all users (admin only)
- `PUT /api/admin/users/:id` — Update user role/language (admin only)
- `DELETE /api/admin/users/:id` — Delete a user (admin only)

## UI

- Inline editing for user role and language
- Delete with confirmation dialog

---

See also: [API](api.md), [Design](design.md), [Requirements](requirements.md), [Test Cases](test.md)
