# CETMastery

A college entrance-exam preparation platform, starting with a responsive landing page and a working sample practice question.

**Stack:** React + Vite, Express, Axios, JavaScript, Prisma ORM, and Supabase PostgreSQL / Google Auth.

## Run locally

Use Node.js 24 LTS and pnpm 11.24.0. From the repository root:

```sh
pnpm install
pnpm dev
```

Open [localhost:5173](http://localhost:5173). Vite proxies `/api` to Express at `127.0.0.1:3001`. Both run in the foreground; Ctrl+C stops the development session.

No credentials are needed for the homepage or sample question. **Each workspace has a dedicated environment file:** `frontend/.env` and `backend/.env`, copied from its own `.env.example`. There is no root `.env`. Fill the backend Supabase URL/publishable key and Prisma database URLs first; Google provider setup and frontend sign-in integration come last. Never place database URLs or secret keys in a `VITE_` variable. If you change the backend port, update `API_PROXY_TARGET` in the frontend environment too. See [auth and environment setup](docs/engineering/auth-and-setup.md) for exactly what to configure.

## Project structure

```text
frontend/
  public/              Local images, fonts, licenses, and favicon
  src/
    components/        Navigation and interactive sample question
    pages/             Homepage
    lib/               Axios and optional Supabase Auth clients
    styles.css         Responsive design tokens and styles
backend/
  src/
    config/            Validated environment
    middleware/        JSON errors and unknown routes
    routes/            Public practice endpoints
    services/          Sample scoring, profile bootstrap, and Supabase Auth
    lib/               Server-only Prisma client
    app.js             Express configuration (importable by tests)
    server.js          HTTP listener and shutdown
  test/                API integration tests
  prisma/              Prisma schema and SQL migrations
  generated/prisma/    Generated JavaScript client (ignored)
supabase/              Supabase ownership notes
content/               Curriculum source location
docs/                  Product and engineering plans
```

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start frontend and backend together |
| `pnpm dev:frontend` / `pnpm dev:backend` | Start either workspace |
| `pnpm check` | Validate Prisma, run API tests, and build the frontend |
| `pnpm build` | Build static assets in `frontend/dist` |
| `pnpm start` | Run the Express API without a watcher |
| `pnpm --filter @cetmastery/backend db:generate` | Generate the Prisma Client |
| `pnpm --filter @cetmastery/backend db:validate` | Validate the Prisma schema |
| `pnpm --filter @cetmastery/backend db:migrate` | Apply committed migrations using backend `DIRECT_URL` |

## Initial API

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/api/health` | API process health |
| GET | `/api/practice/question` | Sample question without its answer key |
| POST | `/api/practice/answer` | Validate and score `{ "questionId": "linear-equations-01", "optionId": "b" }` |
| POST | `/api/auth/session` | Verify a Google account's Supabase bearer token and create its profile |
| GET | `/api/auth/me` | Return the verified caller and own Prisma profile |
| POST | `/api/auth/logout` | Revoke the caller's Supabase refresh session |

API errors use `{ "error": { "message": "..." } }`. Practice requests are rate-limited. Scoring and answer explanations remain server-side until an answer is submitted.

## Current scope

The question is demonstration content, not an official exam bank. Auth endpoints and the Prisma profile model/migration are implemented. Google provider configuration, frontend OAuth integration, and applying migrations to your own project are pending. Saved attempts, learner progress, email/password registration, and curriculum imports are not implemented. Auth routes fail clearly if their backend settings are blank; public endpoints continue working.

For production, serve `frontend/dist` with an SPA fallback and proxy `/api` to the API using the same origin. `pnpm start` runs only the API. See the [architecture](docs/engineering/architecture.md) and [documentation index](docs/README.md) for the remaining product and deployment work.
