# Content Operations

## Goal

Produce exam-aligned lessons and questions that are accurate, understandable, and traceable. AI can speed up drafting and catch some defects, but publication should be a controlled content decision.

## Evaluation of the proposed four phases

The sequence—curriculum mapping, lesson drafting, item generation/audit, and database seeding—is a useful production outline. The key change recommended here is to put explicit validation and publication gates between generation and learner access. A generator and blind solver agreeing only checks that two model runs returned the same answer; it does not independently establish correctness or quality.

## Proposed pipeline

```text
1. Curriculum map
        ↓
2. Lesson and assessment draft
        ↓
3. Automated structural and answer checks
        ↓
4. Editorial / subject review
        ↓
5. Versioned import as draft
        ↓
6. Publish approved version
        ↓
7. Monitor flags, correct, retire, and replace
```

### 1. Curriculum map

- Define the target exam, subject coverage, topic sequence, and learning objectives.
- Record the rationale or source used for exam weighting where available.
- Give each node a stable ID independent of its display name.
- Mark unconfirmed coverage assumptions explicitly.

### 2. Draft content

For lessons, capture the concept explanation, worked examples, technique and its assumptions, and learner check. For each question, capture the prompt, options, correct key, explanation, distractor rationale, difficulty, curriculum mapping, and any timing guidance. Where relevant, record an optional test-taking strategy, its assumptions, and when it does not apply. Record sources or a reviewer rationale for factual claims.

### 3. Automated checks

Use machine checks suited to the subject:

- schema validation, unique IDs, required fields, valid references, and exactly one correct option for a single-answer MCQ;
- arithmetic or symbolic checks where deterministically possible;
- independent solving with the answer key hidden as a secondary check;
- wording checks for ambiguity, duplicated options, unsupported claims, and unintended clues;
- coverage checks against the approved curriculum and assessment blueprint.

An answer mismatch should send the item to revision or quarantine. Use a bounded retry count; do not let an automated loop regenerate indefinitely or silently turn a mismatch into approval.

### 4. Review and approval

For an initial release, require a qualified human reviewer to approve lessons and scored questions before publication. A reviewer should check correctness, one-best-answer quality, distractor plausibility, clarity, difficulty, solution accuracy, and alignment with the target exam. Store reviewer identity and approval time. The amount of review can be revisited after quality is measured, but an AI agreement check alone should not publish assessment content.

### 5–6. Import and publish

- Validate the complete batch before changing the database.
- Preserve stable IDs and content versions; never update an existing version in a way that changes the meaning of old attempts.
- Make imports idempotent so retries do not create duplicate curriculum nodes or questions.
- Store content as `draft`, `in_review`, `approved`, `published`, or `retired` (or an equivalent controlled set).
- Publish through an explicit transition after approval. Student-facing API queries should filter to published versions.
- Keep correct answers and private audit metadata unavailable to browser clients.

### 7. Monitoring and correction

Allow learners or staff to flag a questionable item. Triage flags, retire defective versions from future assessments, and publish corrected versions with a reason. Keep historical attempts tied to the version the learner saw so reports remain interpretable.

## Content record metadata

Recommended fields for each imported lesson, question, or assessment blueprint:

- stable content ID and version;
- subject, topic, sub-topic, and objective IDs;
- authoring source (`human`, model/provider, or mixed) and model/prompt version when AI was used;
- draft/review/publication state;
- automated validation results and review decision;
- created, updated, approved, and published timestamps;
- retirement or correction reason where relevant.

Do not treat generated content as verified merely because it is valid JSON or passed a database insert.

## Version one scope

For the first content batch, keep the workflow simple: a version-controlled JSON/CSV source, schema and reference validation, a reviewer checklist, and a repeatable import command. Add model orchestration only after the content format, review steps, and one-subject pilot have stabilized.
