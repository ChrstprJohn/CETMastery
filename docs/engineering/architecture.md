# Technical Architecture

## Confirmed stack

The user has selected React + Vite, Express, Axios, and JavaScript. Use `.js` and `.jsx`, with ES modules throughout. Do not introduce Next.js or TypeScript.

| Responsibility | Technology | Status |
|---|---|---|
| Browser application | React + Vite, JavaScript / JSX | Selected |
| HTTP client | Axios | Selected |
| Application API | Express, JavaScript | Selected |
| Database | Supabase PostgreSQL | Selected |
| Database access and migrations | Prisma ORM 7 with PostgreSQL adapter | Selected and configured |
| Authentication | Supabase Auth, Google only | Protected API implemented; provider setup and frontend integration deferred |
| API deployment | VM | Working direction; provider undecided |
| Routing | React Router | Recommended |
| Styling | Plain CSS with shared tokens | Implemented |
| Input validation | Zod, used at runtime in JavaScript | Implemented |
| Lesson and math rendering | Markdown + KaTeX | Recommended |
| Server data caching | TanStack Query | Optional; not selected for the initial implementation |

## Application boundaries

The planned browser flow signs in through Google using Supabase Auth. For application requests, Axios will send the Supabase access token to Express in the Authorization header. Express now verifies the token using Supabase `getUser`, requires a Google account, and derives the current user from that verified response. Application data is accessed through server-side **Prisma**, with queries scoped to the caller. Frontend sign-in/token attachment is the next integration step, not implemented yet.

```text
React browser application
  |-- Supabase Auth: sign-in and session management
  |
  | Axios + access token, /api requests
  v
Express API on the VM
  | verified identity, permissions, validation, scoring, Prisma ORM
  v
Supabase PostgreSQL
```

Start by routing all application data through Express. Direct browser database access can be reconsidered if a concrete feature benefits from it, after grants and RLS have been designed and tested. Supabase Auth remains accessible from the browser.

## Frontend responsibilities

- Display curriculum, lessons, quiz questions, feedback, and progress.
- Use Axios for requests to Express and attach the current access token for protected routes.
- Handle loading, errors, empty results, and expired sessions.
- Use React state for local UI state. Initially, use state and effects for simple data fetching, including cancellation when a screen unmounts.
- Render lesson content safely. Do not execute scripts or untrusted raw HTML from stored content.
- Keep assessment timing visible, but let the server enforce deadlines.

Axios performs HTTP requests. TanStack Query is an optional layer that manages fetched data, loading state, caching, and refetching while still using Axios underneath. Add it only if repeated fetching and synchronization logic warrants it; it is not required to start.

## Backend responsibilities

- Verify Supabase access tokens and enforce ownership on each protected request.
- Validate request bodies, parameters, and query strings at the boundary.
- Deliver only published content and question fields safe for the learner.
- Select questions, store the versions served, score responses, and update progress.
- Keep answer keys private. Release explanations according to the assessment feedback policy.
- Make submissions safe to retry and use database transactions for writes that must succeed together.
- Return consistent errors, log failures without secrets, and rate-limit sensitive routes.

Prisma uses a trusted PostgreSQL connection that may bypass RLS. Explicitly enforce authorization in Express and scope each user-owned query by the verified identity. Application tables live in the unexposed `app_private` schema, with RLS enabled and no browser policies. The Supabase client is used only for Auth operations with a publishable key; a service-role key is not needed. Never trust a user ID or score supplied by the browser. Keep answer-key tables unavailable to browser database roles.

## Proposed repository structure

```text
frontend/              React + Vite application
  src/
    components/        Shared interface components
    pages/             Route screens
    lib/               Axios and Supabase Auth clients
backend/               Express application
  prisma/              Prisma schema and committed SQL migrations
  generated/prisma/    Generated JavaScript client (ignored)
  src/
    routes/            HTTP endpoints
    middleware/        Authentication, validation, errors
    services/          Scoring and application operations
    lib/               Server-only Prisma client
supabase/              Supabase ownership and access notes
content/               Reviewed, versioned content source files
docs/                 Product, engineering, and planning documentation
```

The frontend and backend are pnpm workspaces. Implemented slices include the landing page, public sample question delivery, answer checking, Prisma profiles, and protected auth endpoints. Google provider setup, frontend OAuth integration, applying migrations to the user's project, and persistent learning progress remain pending. See [auth and setup](auth-and-setup.md) for the current endpoint contract and environment instructions.

## Environment and secrets

Frontend configuration contains only public values such as the Supabase URL, publishable key, and API base URL. Vite exposes frontend environment values in the browser bundle; never put privileged credentials there.

`backend/.env` contains the API settings, public Supabase verification settings, runtime `DATABASE_URL`, and migration `DIRECT_URL`. `frontend/.env` contains only public browser configuration and its Vite proxy target. There is no shared root environment file. Both real environment files are ignored by Git, with committed `.env.example` templates. Configure deployment secrets outside the repository.

## VM deployment

Build the Vite frontend into static assets. Nginx serves those assets, falls back to the frontend entry point for client routes, and proxies `/api` to Express bound to a local interface. Keep API paths out of the frontend fallback. Use HTTPS and a process supervisor to restart Express after failures and reboots.

During local development, Vite can proxy `/api` to Express. Prefer the same public origin in production; if separate origins are required, configure an explicit CORS allowlist.

Before launch, define the VM provider, supported Node.js LTS version, health checks, logs, firewall rules, migrations, backups, restore testing, and update process. One VM is an initial availability limit; size it after measuring representative usage.

## Implementation order

1. Completed: JavaScript frontend, Express API, landing page, and a sample scored question.
2. Completed in code: Prisma profile schema/migration and protected auth endpoints.
3. Next: fill the separate environments and apply the migration to the development Supabase database.
4. Last in the auth slice: configure Google, disable email authentication, and connect browser OAuth and token attachment.
5. Then add curriculum/lesson endpoints, reviewed questions, saved attempts, and progress.
6. Validate the learner journey and deploy the vertical slice.

See [data model and access](data-model-and-access.md) for entities and [the roadmap](../planning/roadmap.md) for scope and unresolved decisions.

## References

- [React effects and data fetching](https://react.dev/reference/react/useEffect)
- [Axios documentation](https://axios-http.com/docs/intro)
- [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Supabase authentication](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Prisma ORM](https://www.prisma.io/docs/orm)
