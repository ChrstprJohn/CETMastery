# Curriculum administration

The admin workspace is `/admin` (React/Vite). It uses Express `/api/admin` and Prisma; the browser never queries curriculum tables through Supabase. No curriculum content is seeded. Quizzes and learner-facing delivery are deferred.

## Data

`app_private.subjects` -> `app_private.topics` -> `app_private.lessons` uses UUID primary keys, timestamps, integer `sort_order`, and `is_published` (false by default). Subjects have name, slug, description; topics have subject_id, title, slug, description; lessons have topic_id, title, slug, summary and Markdown content. A lesson's subject is derived from its topic. Blank content is allowed for drafts. Slugs are unique globally for subjects and within the parent for topics and lessons. Foreign keys restrict parent deletion while children remain. The database has RLS enabled with no browser policies or grants. Keep app_private outside Supabase Data API exposed schemas.

## Access

`backend/.env` now has `ADMIN_AUTH_BYPASS=false`: Google login and a database admin role are required. `/admin` shows Google sign-in when signed out and an Access denied page for signed-in non-admin accounts. Successful admin sign-in returns to `/admin` through the existing callback. The return path is restricted to this fixed local route. The template defaults to false. Any bypass request outside development is rejected. Keep the development server on loopback; bypass mode gives anyone who can reach the API full curriculum CRUD access.

Keep `ADMIN_AUTH_BYPASS=false`, restart Express after configuration changes, sign in through the existing Google flow, and ensure the verified user's existing profile has `role=admin` using trusted server/database administration. Ordinary Google accounts remain users. The middleware verifies Supabase identity and reads the role from the database on every admin request. Client metadata and request bodies cannot grant roles. No role-management API is added.

## API and validation

- GET `/api/admin/session`: current access mode.
- GET/POST `/api/admin/subjects`, `/topics`, `/lessons`: list/create.
- PUT/DELETE `/api/admin/{resource}/{uuid}`: replace editable fields/delete.

Writes require the complete editable form. Unknown fields are rejected. Name/title: 1-120 trimmed characters. Slug: 1-160 lowercase alphanumeric words separated by single hyphens. Description/summary: up to 2,000 characters. Markdown: up to 200,000 characters. Order: integer 0-2147483647; publication: boolean. Parent IDs and route IDs must be UUIDs. Database uniqueness/FK constraints handle races. Invalid input returns 400, missing entries 404, duplicate slugs or blocked parent deletion 409. Protected access returns 401/403. All admin responses are no-store.

The UI supports search, subject/topic filters, dependent parent dropdowns, draft/publication state, ordering, editing, delete confirmation, empty/loading/error states and retry. Publishing only records intent for future learner delivery; that delivery must require published subject, topic and lesson. Markdown is stored as text, never interpreted as HTML here. Sanitize rendered Markdown when learner display is added.

Lists currently load the curriculum into memory for the small authoring workspace. Add server pagination and lighter lesson summaries when the collection grows; no public curriculum read API is shipped.

## Changes and checks

Migration `202610260005_curriculum` creates the three tables without inserts. Use the existing db:generate, db:migrate and db:status commands; never reset the shared database. `pnpm check` validates the schema, runs API/auth/frontend tests and builds the frontend. `backend/test/admin.test.js` checks development-only bypass, Google/admin access, input validation, CRUD and database-error translation.

Live database verification: `RUN_CURRICULUM_DB_TEST=true node --env-file=backend/.env --test backend/test/curriculum.integration.test.js` from the repository root creates temporary uniquely named records, verifies CRUD and constraints, and removes only those records.

Successful Google callbacks perform a silent session exchange and immediately return to the intended page; only failures display a recovery screen. The `/auth/callback` URL remains required by the configured OAuth redirect.
