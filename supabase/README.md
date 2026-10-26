# Supabase boundaries

Supabase manages authentication and its own `auth` schema. Application tables and migrations are managed by Prisma in `backend/prisma/`. Do not add the same database changes here or migrate Supabase-managed tables with Prisma.

The application schema is `app_private` and is not exposed through the Supabase Data API. See `docs/engineering/auth-and-setup.md` for connection strings, migration commands, and the Google provider setup deferred until integration.
