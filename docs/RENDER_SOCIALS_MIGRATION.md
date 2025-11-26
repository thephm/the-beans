Migration plan for social networks field

Goal
- Consolidate individual social columns into a single `socialNetworks` JSON column on the `roasters` table.
- Populate `socialNetworks` from existing columns during deployment to Render.
- Keep legacy columns for backward compatibility; remove them later after migration and client updates.

Steps to run on Render (recommended)

1) Update Prisma schema is already committed (adds `socialNetworks Json?`).

2) Create and apply database migration on Render (or locally then push migrations):

- Locally (dev):

```pwsh
cd server
npx prisma migrate dev --name add-social-networks
npx prisma generate
```

- On Render (production), use `prisma migrate deploy` during your deploy/build step. Example Render build commands:

```pwsh
# from repo root
cd server
npx prisma migrate deploy
npx prisma generate
node prisma/migrate-social-networks.ts
```

3) Run the migration script to populate `socialNetworks` from legacy columns. The repository includes `server/prisma/migrate-social-networks.ts` which uses the Prisma Client to copy values.

- On Render, add a release or post-deploy command to run this script after `prisma migrate deploy` and `prisma generate` have completed. Example:

```pwsh
# Example release command
cd server
node prisma/migrate-social-networks.ts
```

4) Verify data
- Connect to your Postgres DB and inspect a few roasters to ensure `socialNetworks` is populated.

```pwsh
# Example psql (inside the DB container or via connection string)
psql <CONN_STRING>
SELECT id, social_networks FROM roasters LIMIT 10;
```

5) Migrate API and client
- The server API already accepts and returns `socialNetworks` (keeps legacy fields). The client includes a helper `client/src/lib/socials.ts` to read `socialNetworks` first, falling back to legacy fields.

6) Cleanup (after verification)
- After all clients and integrations use `socialNetworks`, remove legacy columns from Prisma schema:
  - Update `schema.prisma` to drop legacy columns
  - Create a new prisma migration to drop the columns
  - Deploy the migration on Render

Notes and caveats
- The migration script writes `socialNetworks` only when at least one legacy field has a value; empty roasters are untouched.
- Keep audit and backups before running migration in production.
- If you use multiple database replicas or maintenance windows, run migration during low-traffic times.

If you'd like, I can:
- Add a small script to Render `render.yaml` or CI that runs the migration steps during deployment.
- Create a follow-up PR to remove legacy fields after you've confirmed the migration succeeded.

Render `releaseCommand` example

Add this `releaseCommand` to the backend service in `render.yaml` so Render runs migrations and the social migration script at release time (after build, before start):

```yaml
releaseCommand: npx prisma migrate deploy && npx prisma generate && npm run migrate:socials
```

Notes:
- The repo's `render.yaml` already includes this release command for `the-beans-api` service.
- `migrate:socials` is defined in `server/package.json` and runs `ts-node prisma/migrate-social-networks.ts`.
- Running migrations in `releaseCommand` is preferable on Render because it ensures the DB schema is updated before the service starts accepting traffic.
