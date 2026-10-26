# Data Model and Access

This is a domain sketch for discussion, not a finalized SQL schema. Normalize repeated concepts and choose concrete types and constraints during schema design.

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

Implement this matrix with server authorization and database policies. Keep service-role credentials out of browser contexts; they bypass RLS.

