# Data Model and Access

This is a domain sketch for discussion, not a finalized SQL schema. Normalize repeated concepts and choose concrete types and constraints during schema design.

## Implemented initial model

Prisma is the selected ORM. Its source of truth is `backend/prisma/schema.prisma`, with SQL migrations in `backend/prisma/migrations/`. The first migration creates `app_private.profiles`; migration `202610260004_expand_profiles` adds optional personal-display fields. Profile bootstrap is idempotent. Email and passwords are not duplicated in application storage.

| Profile field | Purpose |
|---|---|
| `id` | Supabase user UUID, primary key; independent of login provider |
| `display_name` | Optional display name, up to 120 characters |
| `first_name`, `last_name` | Optional given/family names, up to 120 characters each |
| `avatar_url` | Optional HTTPS avatar URL, up to 2048 characters |
| `locale` | Optional canonical language tag, up to 35 characters |
| `created_at`, `updated_at` | Creation and last profile modification timestamps |

`locale` is the user's language/region preference, such as `en-PH` (English, Philippines). It can guide date/number formatting and future translations. It is optional, is not a physical location, and must not be used to infer residence or timezone.

On first bootstrap, display fields are seeded from the verified user's Supabase metadata when available. Supported inputs are `full_name`/`name`, `given_name`/`first_name`, `family_name`/`last_name`, `avatar_url`/`picture`, and `locale`. Names are display data, never authorization inputs. Missing values stay null; full names are never split heuristically. Repeated sign-ins preserve existing profile fields, including edits. Supabase user IDs and linked identities remain the identity source; do not join accounts by matching names or email addresses alone.

The nullable model can also represent future non-Google users without requiring Google-specific IDs or passwords. Other sign-in methods remain disabled until explicitly requested. Future education-specific requirements may still need normal migrations.

The profile ID logically references the identity managed by Supabase Auth; there is currently no database foreign key into `auth.users`. Prisma deliberately does not manage Supabase's Auth schema. Account deletion must include profile cleanup when that feature is implemented. The remaining entities below are planned, not generated tables.

Google is the only supported provider. Express verifies bearer tokens through Supabase and uses the verified caller's UUID for Prisma queries. Browser roles receive no profile access policies; `app_private` must remain outside the Data API's exposed schemas. See [auth and setup](auth-and-setup.md) for the endpoints, migration commands, and environment configuration.

## Proposed entities

| Entity | Purpose | Example relationships |
|---|---|---|
| `subjects` | Top-level exam areas | Has curriculum nodes and assessments |
| `curriculum_nodes` | Flexible ordered tree of topics and sub-topics | Self-referencing `parent_id`; belongs to a subject |
| `lessons` | Versioned instructional content for a node | Belongs to a curriculum node |
| `assessments` | Quiz, topic test, subject mock, or full simulation definition | Has an assessment type and blueprint/version |
| `assessment_blueprints` / `assessment_items` | Rules or selected items for an assessment | References questions and curriculum coverage |
| `questions` | Versioned prompt, options, explanation metadata, skill/objective tags, and difficulty | Mapped to one or more curriculum nodes; selected into practice sets and assessments |
| `question_answer_keys` | Correct option(s) and scoring detail | Private relation to a question version |
| `users` / `profiles` | App-specific profile fields keyed to Supabase Auth user ID | One profile per auth user, if profile storage is needed |
| `assessment_attempts` | A user's run through an assessment version | Belongs to user and assessment; stores start/end and status |
| `attempt_responses` | A user's response to each item in an attempt | Belongs to attempt and question version |
| `subtopic_progress` | Optional cached mastery summary | Derived from attempts and completion rules |
| `content_reviews` / `content_flags` | Review decisions and reported content problems | References content version and reviewer/reporting user |

## Curriculum tree

Use an explicit node type such as `subject`, `topic`, or `subtopic` (or keep subjects in a separate table and use node types for topic levels). Each node should support at least `id`, `parent_id`, `subject_id`, `slug`, `title`, `display_order`, `status`, and timestamps. Add stable IDs and uniqueness constraints to prevent duplicate seeds.

Avoid columns such as `topic1`, `subtopic1`, `subtopic2`, or fixed per-subject counts. A parent relationship and ordering allow each subject to have the breadth it needs.

## Assessments and scoring

Represent quiz and exam behavior with an assessment type plus a versioned blueprint: target curriculum nodes, item counts or fixed items, difficulty distribution, duration, scoring policy, and unlock requirements. Keep assessment rules configurable so a revised exam format does not require hard-coded frontend changes.

Store every attempt against the assessment version and question versions served to the learner. Responses should distinguish submitted, skipped, and unanswered states where relevant. Compute mastery from defined rules; if a cached progress row is used for speed, preserve attempts as the source of truth.

## Answer-key access

Keep answer keys in a server-only table or schema with no browser grants. The VM API fetches keys for scoring and returns only feedback allowed by the current assessment policy. For practice mode, the API can return explanations after a response is submitted. For timed exams, whether explanations appear immediately or after completion is a product decision.

If direct browser-to-Supabase access is later used for low-risk reads, expose only tables and columns whose contents are safe for the client. Use RLS for user-owned records and avoid relying on frontend filters as authorization.

## Initial access matrix

| Data | Student read | Student write | Trusted API / staff |
|---|---|---|---|
| Published lesson and question prompts | Through API, or safe published view | No | Read and publish |
| Correct answers and private author/review metadata | No | No | API and authorized content tools only |
| Own attempts and responses | Own records through authorized API | Submit through API | Read and score |
| Another user's attempts and profile data | No | No | Restricted support/admin access |
| Draft or retired content | No | No | Authorized content workflow |

Implement this matrix with server authorization and database policies. Prisma runs only in Express using a trusted database connection. Keep database URLs out of browser contexts; this connection may bypass RLS and requires explicit ownership checks. A Supabase service-role key is not used by the current implementation.

