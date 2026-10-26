# CETMastery agent rules

## Database structure and migration history

- Prisma is the selected ORM. Keep application table definitions in `backend/prisma/schema.prisma` and versioned SQL migrations in `backend/prisma/migrations/`.
- Every database structure change must have a new migration, including removing a temporary table. Update the Prisma schema and regenerate its client with `pnpm --filter @cetmastery/backend db:generate`.
- Keep applied migration files unchanged. Do not delete old migrations when removing their tables; add a new migration that performs the removal.
- `public._prisma_migrations` is Prisma's internal record of applied structure changes. Never manually delete or edit its rows or drop this table as cleanup. It is not a log of individual record inserts, updates, or deletes.
- Apply user-authorized changes using `pnpm --filter @cetmastery/backend db:migrate`, then verify with `pnpm --filter @cetmastery/backend db:status`. Never reset a shared/cloud database as routine cleanup.
- Keep local migrations and schema in Git. Do not commit generated Prisma Client files or environment secrets. Schema/migration files are not backups of database records.
- `app_private.profiles` is a real application table for learner profiles. Preserve it when cleaning up demonstration tables. The temporary `crud_tests` table was created, tested, and removed through migrations.
- Profile fields are independent of Google: optional display/first/last names, HTTPS avatar, locale, and timestamps. Seed metadata only for new profiles, preserve existing edits on repeat login, and never infer first/last names by splitting a full name. Supabase Auth owns email, credentials, verification, and linked identities.
- Keep `app_private` outside the Supabase Data API's exposed schemas. Application data goes through Express and Prisma; protected queries must use the verified caller's identity.
- Update the engineering docs and roadmap when schema or authentication behavior changes. See `docs/engineering/auth-and-setup.md` and `docs/engineering/google-auth-setup.md`.

## Environments and authentication

- Backend configuration belongs in `backend/.env`; public frontend configuration belongs in `frontend/.env`. No shared root `.env` is used. Never print or commit credentials, or put database URLs in `VITE_` variables.
- Supabase handles Google authentication; Prisma handles application data. Configure Google Client ID and Client Secret in the hosted Supabase Google provider settings, not in frontend environment variables.
- Google-only sign-in is selected. Do not introduce email/password registration unless the user requests it.
- Private configuration notes and credential backups belong in ignored `.local/`. Never stage or print their secret contents. `.local/google-auth.private.md` records the user's Google/Supabase configuration and distinguishes verified values from pending dashboard steps.
