# Auth endpoints and environment setup

## Current implementation

The backend uses **Prisma 7 + PostgreSQL** for application data and **Supabase Auth** to verify identities. Only Google accounts are accepted by the application API. Email/password registration, magic links, and anonymous accounts are not supported.

The homepage remains public and now includes Google-only Sign up and Log in dialogs. The browser uses Supabase PKCE, exchanges its callback code once, attaches access tokens to Axios, and restores the session on reload. `POST /api/auth/session` does not issue tokens: it creates the application profile after Supabase has authenticated the user. Any Google account may join; there is no tester-email allowlist. Only basic identity permissions are requested.

## Set up now: separate environment files

There is **no root `.env`**. Each workspace owns its own file. Both real files are ignored by Git; only `.env.example` templates are committed. Both local environments are configured; the backend database and public Supabase key were verified. If setting up a fresh checkout, run from the root:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Copy only when the destination does not already contain your settings. Restart the corresponding server after changing its environment.

### Backend: `backend/.env`

| Variable | Where to get it | Purpose |
|---|---|---|
| `HOST` | Keep `127.0.0.1` locally | API bind address |
| `PORT` | Keep `3001` locally | API port |
| `SUPABASE_URL` | Supabase project settings / Connect | Project API URL, e.g. `https://PROJECT.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase project API keys | Auth verification and sign-out; no service-role secret is required |
| `DATABASE_URL` | Supabase **Connect → Session pooler** connection string | Runtime Prisma database connection |
| `DIRECT_URL` | Supabase **Connect → Direct connection** or **Session pooler** | Prisma migrations; avoid the transaction pooler for migrations |

For local development on an IPv4 network, the session pooler on **port 5432** can be used for both database variables. Direct connections require connectivity to the project's database host, which may require IPv6. Copy the full host, username, database name, and connection options from your own project; do not guess them. Replace the password placeholder with the database password, URL-encoding reserved characters. Preserve the TLS settings required by your database. The backend uses the PostgreSQL driver through Prisma's `@prisma/adapter-pg`.

No Google client ID, Google client secret, Supabase secret key, or service-role key is needed in the app environment for this slice. Google provider secrets will eventually be configured in the Supabase dashboard.

### Frontend: `frontend/.env`

| Variable | Current value / timing |
|---|---|
| `VITE_API_BASE_URL` | `/api` |
| `API_PROXY_TARGET` | `http://127.0.0.1:3001`; Vite server configuration only |
| `VITE_SUPABASE_URL` | Public Supabase project URL, matching the backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Supabase publishable key, matching the backend |

Vite loads the frontend directory's environment explicitly. Its `VITE_` values are public browser configuration. Never put `DATABASE_URL`, `DIRECT_URL`, database passwords, or privileged keys there. Node startup scripts and Prisma configuration load only the backend directory's environment file.

## Prisma workflow

Prisma schema: `backend/prisma/schema.prisma`. Migration history: `backend/prisma/migrations/`. The JavaScript Prisma Client is generated into ignored `backend/generated/prisma/` during `pnpm install`; it is not committed. The supported `prisma-client-js` generator is used to keep this JavaScript project free of a TypeScript build step. Prisma CLI, Client, and PostgreSQL adapter are pinned to the same version.

From the repository root:

```sh
pnpm --filter @cetmastery/backend db:generate
pnpm --filter @cetmastery/backend db:validate
pnpm --filter @cetmastery/backend db:migrate
pnpm --filter @cetmastery/backend db:status
```

Generation and schema validation do not require a live database. Migrations require `DIRECT_URL`. `db:migrate` applies the committed migrations using `prisma migrate deploy`; it does not reset the database. Apply the first migration to your new project after filling in the backend environment. Do not run `migrate reset` against shared or production data.

The first migration creates only `app_private.profiles`, enables RLS without browser policies, and revokes public schema/table access. Keep `app_private` out of the Supabase Data API's exposed schemas. Prisma uses a trusted server database role; Express must enforce ownership on every query. Prisma does not manage Supabase's `auth` schema.

Profile IDs are the UUID returned by verified Supabase Auth. This first model uses a logical identity link rather than a foreign key into the externally managed `auth.users` table. Account deletion and orphan-profile cleanup must be implemented together before adding account deletion. There are no passwords or duplicate email credentials in the application table.

### Local files and cloud migration history

The local schema (`backend/prisma/schema.prisma`) describes the desired current tables. The local SQL migration folders (`backend/prisma/migrations/`) describe the ordered structure changes used to reach that state. Both belong in Git. They are definitions and change history, not copies or backups of the cloud records.

In Supabase, `public._prisma_migrations` is Prisma's internal record of which migrations have been applied, including their checksums and execution state. It does not audit every profile or quiz-row insert/update/delete. Keep this table and its rows intact; Prisma needs it to apply future migrations correctly. Do not delete old migration files when their table is later removed: create a new removal migration. These rules are also recorded in the root `AGENTS.md` for future agents.

Current history: `202610260001_initial_profiles` creates the real learner-profile table; `202610260002_crud_test` created a temporary table for the successful CRUD check; `202610260003_remove_crud_test` removes that test table; `202610260004_expand_profiles` adds optional profile attributes and an update timestamp. Only `app_private.profiles` remains as an application table.

## API contract

All auth routes require `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`. The bearer token is the Supabase access token, not a Google access token or ID token. Express calls `supabase.auth.getUser(token)` and checks the verified account's provider. It does not trust a decoded, unverified JWT or user IDs supplied by the client.

| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/api/auth/session` | Empty body or `{}` | `200`, verified user and idempotently created profile |
| GET | `/api/auth/me` | No body | `200`, verified user and own profile, or `profile: null` before bootstrap |
| POST | `/api/auth/logout` | No body | `204`, revoke the caller's Supabase refresh session only |

User response fields are `id`, `email`, and `provider`. Profile fields are `id`, `role`, `displayName`, `firstName`, `lastName`, `avatarUrl`, `locale`, `createdAt`, and `updatedAt`. Optional attributes are seeded from Supabase user metadata at first bootstrap and stay null if missing or invalid. Repeated bootstrap preserves existing fields and does not overwrite user edits or manually assigned roles. Full names are not split to guess given/family names. Metadata never grants roles or authorization. `/session` rejects client identity/profile fields, including `role`. `/me` always uses the verified caller's ID and ignores user ID query parameters. Sessions are not stored in application tables.

### Manual role management

Migration `202610260006_profile_roles` adds the non-null PostgreSQL/Prisma enum `ProfileRole` with values `user` and `admin`. Existing profiles and all new profiles default to `user`. Google sign-in is used for both roles. Role assignment is not based on an email allowlist or user-editable Supabase metadata.

There is no role-editing API or profile-update API. Browser database roles have no grants on `app_private.profiles`; RLS remains enabled without browser policies, and the schema must remain unexposed. Profile bootstrap explicitly creates `user` profiles and never updates existing roles. Future admin endpoints must verify the caller and check their current stored role on the server; hiding frontend controls is not authorization.

To change a role manually, find the intended account's UUID in **Supabase Authentication → Users**, confirm its identity, and run this in the trusted SQL Editor (replace the UUID placeholder):

```sql
UPDATE app_private.profiles
SET role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE id = 'VERIFIED-USER-UUID'
RETURNING id, role;
```

Use `role = 'user'` to demote an account. Exactly one row should be returned; no row means that account has not bootstrapped a profile yet. Never put a fixed admin email or an automatic promotion rule into signup code. Refresh account details after a manual change. The private local setup notes record the owner's one-time promotion; personal account details do not belong in shared migrations.

Auth responses are `Cache-Control: no-store`; endpoints are limited to 30 requests per minute per client IP. Missing/expired tokens return `401`; unsupported providers return `403`; unconfigured/unavailable auth services return `503`. Database errors return a generic `500` through the shared handler. Errors use `{ "error": { "message": "..." } }`.

Supabase access tokens remain valid until their expiry even after refresh-session revocation. Browser sign-out calls the Supabase SDK directly with local scope, which handles revocation and browser cleanup without requiring a separate Express call. The API logout route is available to API clients. Token refresh stays with the Supabase SDK; Express does not accept or store refresh tokens.

## Google provider and frontend integration

1. Create/configure a Google OAuth **Web application** in Google Cloud. Set its authorized redirect URI to the exact Supabase callback URL shown in the Google provider settings (`https://PROJECT.supabase.co/auth/v1/callback`). Basic identity scopes are exempt from Google's testing-user restriction; any Google account may use this app.
2. Enable Google in Supabase Authentication providers using that client ID and secret. **Disable the Email provider**, anonymous sign-ins, and other providers. Keep new Google-user sign-ups allowed if learners should be able to join on first sign-in.
3. Use the local frontend origin `http://localhost:5174`. Add that Site URL and `http://localhost:5174/auth/callback` to Supabase URL Configuration. Use exact production URLs when deployed.
4. Fill the two public frontend Supabase values. The implemented browser flow uses `signInWithOAuth({ provider: 'google' })` with PKCE and a callback on the same origin, exchanges the callback code once, attaches the access token to Axios, and calls `POST /api/auth/session`.
5. Verify a complete Google login, `/me`, duplicate bootstrap, sign-out, and failure paths against the real project. This live OAuth check has not been performed.

See [Google sign-in setup](google-auth-setup.md) for exact Google Cloud steps, the project callback URL, Supabase settings, and a real sign-up/login test checklist. The Google-only UI is implemented; real consent is completed by the user in their browser.

## Verification

### Cloud database verification history

On 2026-10-26, live Prisma create/read/update/delete operations passed against the temporary `app_private.crud_tests` table. At the user's request, migration `202610260003_remove_crud_test` then removed that table, and its CLI check/model were removed. The creation and removal migrations remain as history. The real `profiles` table and Prisma's migration-history table are preserved.

`pnpm check` validates the Prisma schema, runs API tests, and builds the frontend. Auth tests cover invalid credentials, provider restrictions, server-derived identity, duplicate bootstrap, per-user isolation, and local sign-out using test doubles for Supabase/Prisma. A real database test is enabled only when `TEST_DATABASE_URL` is supplied; use a disposable, migrated PostgreSQL database. It creates and deletes only its own randomly identified profile and verifies concurrent bootstrap and RLS. It is skipped during ordinary runs without that variable.

## References

- [Prisma configuration and separate migration URL](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [Prisma with Supabase connections](https://www.prisma.io/docs/orm/overview/databases/supabase)
- [Supabase Google authentication](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- [Server-side user verification](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Sign-out behavior and token lifetime](https://supabase.com/docs/guides/auth/signout)

## Curriculum admin workspace

See [curriculum administration](admin-curriculum.md) for `/admin`, Google admin sign-in, the disabled development bypass, and database admin-role enforcement.
