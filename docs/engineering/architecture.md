# Technical Architecture

## Confirmed stack

The user has selected React + Vite, Express, Axios, and JavaScript. Use `.js` and `.jsx`, with ES modules throughout. Do not introduce Next.js or TypeScript.

| Responsibility | Technology | Status |
|---|---|---|
| Browser application | React + Vite, JavaScript / JSX | Selected |
| HTTP client | Axios | Selected |
| Application API | Express, JavaScript | Selected |
| Database | Supabase PostgreSQL | Working direction |
| Authentication | Supabase Auth | Working direction |
| API deployment | VM | Working direction; provider undecided |
| Routing | React Router | Recommended |
| Styling and components | Tailwind CSS; shadcn/ui configured for JavaScript | Recommended |
| Input validation | Zod, used at runtime in JavaScript | Recommended |
| Lesson and math rendering | Markdown + KaTeX | Recommended |
| Server data caching | TanStack Query | Optional; not selected for the initial implementation |

## Application boundaries

The browser signs in with Supabase Auth. For application requests, Axios sends the access token to Express in the Authorization header. Express verifies the token and derives the current user from it, then checks permissions before accessing PostgreSQL through server-side Supabase clients.

```text
React browser application
  |-- Supabase Auth: sign-in and session management
  |
  | Axios + access token, /api requests
  v
Express API on the VM
  | verified identity, permissions, validation, scoring
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

A privileged Supabase client bypasses RLS. If used, keep it server-only and explicitly enforce authorization in Express. Never trust a user ID or score supplied by the browser. Keep answer-key tables unavailable to browser database roles.

## Proposed repository structure

```text
frontend/              React + Vite application
  src/
    components/        Shared interface components
    pages/             Route screens
    lib/               Axios and Supabase Auth clients
backend/               Express application
  src/
    routes/            HTTP endpoints
    middleware/        Authentication, validation, errors
    services/          Scoring and application operations
supabase/
  migrations/          Version-controlled database changes
content/               Reviewed, versioned content source files
docs/                 Product, engineering, and planning documentation
```

These application folders are planned, not generated yet. Keep the frontend and backend in one repository. Add files and layers only when a feature needs them.

## Environment and secrets

Frontend configuration contains only public values such as the Supabase URL, publishable key, and API base URL. Vite exposes frontend environment values in the browser bundle; never put privileged credentials there.

Backend configuration holds database or privileged Supabase credentials and server settings. Keep real environment files out of Git, commit placeholder `.env.example` files when implementing, and configure deployment secrets outside the repository.

## VM deployment

Build the Vite frontend into static assets. Nginx serves those assets, falls back to the frontend entry point for client routes, and proxies `/api` to Express bound to a local interface. Keep API paths out of the frontend fallback. Use HTTPS and a process supervisor to restart Express after failures and reboots.

During local development, Vite can proxy `/api` to Express. Prefer the same public origin in production; if separate origins are required, configure an explicit CORS allowlist.

Before launch, define the VM provider, supported Node.js LTS version, health checks, logs, firewall rules, migrations, backups, restore testing, and update process. One VM is an initial availability limit; size it after measuring representative usage.

## Implementation order

1. Validate one lesson-to-quiz flow using static sample data.
2. Create the JavaScript frontend and Express backend.
3. Define schema, migrations, and access rules.
4. Connect sign-in and one protected API endpoint.
5. Add lesson delivery and questions without answer keys.
6. Add server-side scoring, saved attempts, and progress.
7. Add reviewed content imports and deploy the vertical slice.

See [data model and access](data-model-and-access.md) for entities and [the roadmap](../planning/roadmap.md) for scope and unresolved decisions.

## References

- [React effects and data fetching](https://react.dev/reference/react/useEffect)
- [Axios documentation](https://axios-http.com/docs/intro)
- [TanStack Query overview](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Supabase authentication](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
