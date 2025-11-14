# SQL Test Queries

This directory contains SQL queries used for testing and debugging the database during development.

## Usage

These queries can be run directly against the PostgreSQL database:

```bash
# From the project root
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db -f server/test/sql/<filename>.sql
```

Or interactively:

```bash
docker exec -it the-beans-database-1 psql -U beans_user -d the_beans_db
```

Then copy/paste the query contents.

## Files

- `check_22_46_entry.sql` - Debug query for specific audit entry
- `check_audit.sql` - General audit log inspection
- `check_audit_order.sql` - Audit log ordering verification
- `check_dark_roast.sql` - Dark Roast Coffee Shop data verification
- `check_first_person_times.sql` - Person timestamp debugging
- `check_lavender_times.sql` - Lavender Espresso Bar timestamp debugging
- `check_people.sql` - People table inspection
- `check_recent_audits.sql` - Recent audit entries query
- `check_specific_entries.sql` - Specific audit entry lookup
- `debug_times.sql` - General timestamp debugging query

## Purpose

These queries were created during development to:
- Verify data integrity
- Debug timestamp issues
- Inspect audit logging functionality
- Validate database migrations
- Test data relationships
