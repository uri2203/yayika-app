# Maintenance scripts

These scripts talk to the Supabase Management API or directly to Postgres. They
do **not** contain credentials. Provide them through environment variables:

```powershell
Copy-Item .env.example .env
# edit .env with a short-lived, minimum-privilege token
node --env-file=.env scripts/deploy-functions.js
```

Required variables:

| Variable | Used by |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | `deploy-*.js`, `fix-*-db.js`, `run-migration.js` |
| `SUPABASE_PROJECT_REF` | optional; defaults to the project ref in the scripts |
| `SUPABASE_DB_PASSWORD` | `try-connect*.js`, `raw-tls.js`, `run-all-migrations.js` |
| `SUPABASE_ALLOW_DB_WRITES` | set to `1` only when intentionally applying DDL/migrations |

Scripts that execute DDL (`deploy-sql.js`, `fix-*-db.js`, `run-migration.js`,
`run-all-migrations.js`, `try-connect4.js`) refuse to run unless
`SUPABASE_ALLOW_DB_WRITES=1` is set. Read-only connection checks do not need it.
Never set the flag against production without a backup and a staging review.

> Credentials previously committed to this repository (PAT, service_role JWT and
> database passwords) must be revoked/rotated in Supabase. Removing them from
> the files does not remove them from git history.
