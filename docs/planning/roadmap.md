# Starting Roadmap

The full idea includes a curriculum platform, exam engine, progress system, AI content factory, and production operations. Build and validate those in stages. The first goal is to prove that one learner can study one skill, get useful feedback, and know what to do next.

## Current delivery status

- Completed: React/Vite frontend, Express backend, pnpm workspaces, responsive landing page, and a sample practice API.
- Completed in code: Prisma 7 setup, private profile schema and migration, Google-only bearer verification, `POST /api/auth/session`, `GET /api/auth/me`, and `POST /api/auth/logout`.
- Environment ownership: `backend/.env` and `frontend/.env` are separate; no root `.env` is used. Templates and [setup instructions](../engineering/auth-and-setup.md) are committed.
- Next: fill the backend Supabase/database environment values and apply the Prisma migration to the development project.
- Do last in this auth slice: Google Cloud/Supabase provider configuration, disable Email and other providers, implement browser Google OAuth/callback and Axios token attachment, and verify live login/logout.
- Not implemented: email/password signup, saved practice attempts, learner progress, or the wider curriculum API.

The current implementation priority is **backend endpoints first**, starting with authentication. The teaching and curriculum planning stages below remain relevant product work; they do not block this authorized backend setup.

## Stage 1: Define the target

Write a one-page brief answering:

- Which entrance exam and country/system does the first version support?
- Who is the first learner group?
- What is the first subject, topic, and sub-topic?
- What sources or subject experts will guide the curriculum and verify answers?
- What should a learner be able to do better after using the first module?

Do not map every subject yet. The target exam determines the coverage, question style, timing, and eventually the mock exam blueprint.

### Choosing the pilot subject

Choose a subject that is important in the target exam and where you can get reliable content review. If several subjects are equally important and you have suitable review support, start with Mathematics: it exercises concept teaching, worked solutions, misconception diagnosis, targeted question selection, and speed strategies. A bounded pilot such as one-variable linear equations is enough; do not start by mapping all of Algebra.

## Stage 2: Design one learning slice

First write a short teaching blueprint for the selected subject: the kind of thinking learners must do, how lessons will teach it, what common mistakes look like, and how quiz items will reveal understanding. Then prepare one sub-topic end to end:

1. A short, mobile-readable lesson with one clear learning objective.
2. A small set of reviewed practice questions tagged by skill.
3. A default five-question quiz that checks the key skills.
4. Clear feedback and an optional practice set of about three fresh questions focused on missed skills.
5. Choices to review, practice more, or continue.
6. A simple progress state, such as `not started`, `in progress`, and `completed`.

For this first slice, keep sub-topic quizzes formative. Add a topic mastery threshold only after deciding what mastery means for the pilot.

### Use static sample data first

The first clickable prototype can use local JSON or in-memory sample data. It does not need Supabase, real authentication, a VM API, or a production content pipeline. Keep the sample content in a consistent shape—subjects, topics, sub-topics, lessons, questions, options, skill tags, and feedback—so it can later be moved into the database without redesigning the screens. Let quiz answers and screen transitions work in the prototype, even if progress resets when it reloads. See [Subject Learning Blueprints](../product/subject-learning-blueprints.md) for initial teaching patterns by subject.

## Stage 3: Validate the learning experience

Walk through the clickable prototype with a few learners or a tutor. Observe whether learners can navigate to the sub-topic, understand the lesson, answer the quiz, interpret feedback, choose an appropriate next step, and explain what they learned. Revise confusing lesson content, questions, feedback, and screens before expanding the curriculum.

Decide what evidence is enough to proceed. A small pilot will reveal usability and content issues; it will not establish broad learning effectiveness.

## Stage 4: Build the web vertical slice

Implement only what the validated learning slice needs:

- user sign-in;
- a simple subject/topic/sub-topic navigation view;
- lesson display;
- five-question quiz delivery;
- answer feedback and optional targeted practice;
- saved attempts and basic progress.

Use React + Vite in JavaScript for the frontend and Express in JavaScript for the VM-hosted API. Use Axios for API requests, Supabase Auth for Google-only sign-in, and Prisma for Supabase PostgreSQL application data. Email registration is excluded. Keep answer keys and scoring in Express. Route application data through Express; browser access to Supabase is initially limited to authentication.

## Stage 5: Expand after the first loop works

Add one topic mastery quiz and retake/remediation behavior. Then add more sub-topics based on the exam blueprint and learner feedback. Build subject mocks and the full simulation only after their target exam coverage, item counts, timing, and scoring are defined.

## Defer until the content format stabilizes

- all-subject curriculum mapping;
- large-scale AI generation and multi-agent orchestration;
- automatic publication of generated questions;
- elaborate adaptive learning rules;
- complex analytics, subscriptions, and high-availability infrastructure.

Start with a structured content file and a repeatable seed process. Automate drafting and audits after the content schema and review checklist have survived a small real batch.

## First concrete task

Complete the environment and database setup described above, then connect and verify Google auth last. Continue the curriculum brief in parallel with this backend-first work: choose the target exam and pilot sub-topic, then define its learning objective, lesson outline, quiz blueprint, and review checklist before adding curriculum endpoints.

## Unresolved product and deployment decisions

## Recommended before implementation

| Question | Why it matters | Suggested next step |
|---|---|---|
| Which entrance exam(s) and country/system are in scope? | Defines subjects, coverage, terminology, timing, and exam resemblance. | Name one target exam for the first release. |
| Who is the first learner group and what devices/connectivity do they have? | Shapes mobile layout, offline behavior, lesson length, and onboarding. | Describe the primary learner and device assumptions. |
| Which subject is the pilot? | Keeps content and app scope small enough to validate. | Pick the subject with representative interactions and available review expertise. |
| What exactly counts as mastery? | Drives score thresholds, repeated attempts, unlocks, and progress. | Specify score, attempt, and prerequisite behavior for one topic. |
| What happens after a failed quiz or mastery test? | Determines whether progression teaches or merely blocks. | Define review recommendation and retake behavior. |
| How are mock exams assembled? | Item counts alone do not specify coverage or difficulty. | Draft a subject weighting, difficulty mix, timing, and scoring blueprint. |
| What are the target exam's guessing and penalty rules? | Guessing and elimination advice depends on whether wrong answers lose points. | Verify the scoring policy before adding general guess-taking tips. |
| Is human review available for generated content? | Agreement between AI agents is not a correctness guarantee. | Identify reviewer(s) and the minimum pre-publication review. |
| Should any application data later be read directly from Supabase? | Requires safe views, grants, and tested RLS policies. | Initially route application data through Express; use Supabase directly only for auth. |
| What is the VM provider and expected availability? | Affects deployment, networking, operations, and cost. | Decide after a vertical slice confirms resource needs. |

## Choices to defer

- Exact number of topics and sub-topics per subject, until the exam blueprint is confirmed.
- Final lesson and assessment item counts, until a pilot is evaluated.
- Advanced multi-agent orchestration, until a content schema and review workflow are proven.
- High availability and scaling design, until expected usage and availability targets are known.
- Pricing, subscription tiers, and analytics, unless they change the initial learner journey.

