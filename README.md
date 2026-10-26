# CETMastery

A college entrance-exam preparation platform, starting with a responsive landing page and a working sample practice question.

**Stack:** React + Vite, Express, Axios, JavaScript, and Supabase PostgreSQL / Auth.

## Run locally

Use Node.js 24 LTS and pnpm 11.24.0. From the repository root:

```sh
pnpm install
pnpm dev
```

Open [localhost:5173](http://localhost:5173). Vite proxies `/api` to Express at `127.0.0.1:3001`. Both run in the foreground; Ctrl+C stops the development session.

No Supabase credentials are needed for the homepage or sample question. To configure integrations, copy `frontend/.env.example` to `frontend/.env` and `backend/.env.example` to `backend/.env`, then fill in the relevant values. Never place a Supabase secret key in a `VITE_` variable. If you change the backend port, update `API_PROXY_TARGET` in the frontend environment too.

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
    services/          Sample scoring and server-only Supabase helper
    app.js             Express configuration (importable by tests)
    server.js          HTTP listener and shutdown
  test/                API integration tests
supabase/migrations/   Future database migrations
content/               Curriculum source location
docs/                  Product and engineering plans
```

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start frontend and backend together |
| `pnpm dev:frontend` / `pnpm dev:backend` | Start either workspace |
| `pnpm check` | Run API tests and build the frontend |
| `pnpm build` | Build static assets in `frontend/dist` |
| `pnpm start` | Run the Express API without a watcher |

## Initial API

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/api/health` | API process health |
| GET | `/api/practice/question` | Sample question without its answer key |
| POST | `/api/practice/answer` | Validate and score `{ "questionId": "linear-equations-01", "optionId": "b" }` |

API errors use `{ "error": { "message": "..." } }`. Practice requests are rate-limited. Scoring and answer explanations remain server-side until an answer is submitted.

## Current scope

The question is demonstration content, not an official exam bank. Authentication, saved attempts, database tables, and curriculum imports are not implemented. Supabase clients and environment examples are prepared for that next slice; no database changes are applied. Future protected routes must verify the Supabase access token and enforce ownership before using the privileged client.

For production, serve `frontend/dist` with an SPA fallback and proxy `/api` to the API using the same origin. `pnpm start` runs only the API. See the [architecture](docs/engineering/architecture.md) and [documentation index](docs/README.md) for the remaining product and deployment work.
