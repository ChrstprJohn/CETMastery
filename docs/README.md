# CETMastery Documentation

CETMastery is a browser-based entrance-exam preparation platform: study a lesson, practice a skill, receive feedback, and track progress toward larger assessments.

The selected application stack is **React + Vite, Express, Axios, JavaScript, and Prisma ORM**. Supabase supplies PostgreSQL and Google-only authentication. The frontend and backend use separate environment files. Google provider setup and browser sign-in integration come after the backend endpoints; see the setup guide below.

## Read in this order

1. [Product and curriculum](product/product-and-curriculum.md) — learning journey, curriculum, practice, and assessment behavior.
2. [Architecture and stack](engineering/architecture.md) — selected technologies, responsibilities, security, and deployment.
3. [Roadmap and open decisions](planning/roadmap.md) — pilot scope, delivery stages, and questions still to resolve.

## Product documentation

- [Subject learning blueprints](product/subject-learning-blueprints.md) — teaching methods and assessment evidence for each subject.
- [Content operations](product/content-operations.md) — drafting, checking, review, publication, and corrections.

## Engineering documentation

- [Data model and access](engineering/data-model-and-access.md) — proposed entities, versioning, and access boundaries.
- [Auth endpoints and environment setup](engineering/auth-and-setup.md) — implemented endpoints, dedicated frontend/backend environments, Prisma commands, and deferred Google configuration.
- [Google sign-in setup](engineering/google-auth-setup.md) — exact Google Cloud/Supabase settings and environment values for this project.

## Documentation status

Implemented: responsive landing page, sample practice API, provider-independent Prisma profiles with optional names/avatar/locale, and protected auth endpoints with tests. Live Prisma CRUD checks passed, and the temporary test table was removed through a migration; applied history is retained. Google dashboard configuration, frontend OAuth integration, saved learner progress, and the broader curriculum remain pending. Product thresholds, target exam, pilot subject, and hosting provider are still open. The roadmap tracks delivery status and unresolved choices; root `AGENTS.md` records migration rules for future agents.
