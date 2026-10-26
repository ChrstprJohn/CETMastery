# Product and Curriculum

## Product summary

**Working description:** a web-based entrance-exam preparation platform. Students sign in, work through lessons organized by subject and topic, answer short quizzes, and build toward topic tests, subject mocks, and a full-length simulation. The system records attempts and progress so learners can see what to study next.

The initial product should prove that one subject can deliver a clear learning loop before the entire curriculum is authored:

1. Choose a subject and sub-topic.
2. Read a short lesson with worked examples.
3. Answer a short quiz and get an explanation.
4. See progress and a recommended next step.
5. Unlock a mixed topic assessment when the configured requirements are met.

## Evaluation

### What is promising

- **A useful learning loop:** explanation, practice, feedback, and progression sit together instead of being separate features.
- **Scalable curriculum shape:** subjects and topics can have different breadths, which fits subjects with uneven exam coverage.
- **Short learning units:** three-to-five-minute lessons and small quizzes give learners manageable checkpoints.
- **Pre-authored delivery:** storing reviewed content ahead of time makes student sessions more predictable and avoids waiting for AI generation.
- **Clear future expansion:** sub-topic checks, topic mastery, subject mocks, and full simulations support a path from focused practice to exam stamina.

### Main risks to address

- **Breadth can outrun quality.** A complete tree with thin lessons is less useful than a smaller, trustworthy pilot. Start with one subject and a few sub-topics.
- **A single pass/fail gate can misrepresent mastery.** Define what counts as passing, whether retries are allowed, and how a learner recovers after a miss. Keep thresholds configurable.
- **The lesson template can become mechanical.** Positive numbers, sign changes, and fractions fit some math concepts, but not every subject. Treat the three variations as a math lesson pattern; use subject-appropriate worked examples elsewhere.
- **Speed advice can teach shortcuts without judgment.** Explain when a shortcut works and when a full method is safer. Do not make a 30-second target universal until it is supported by the exam format and practice data.
- **More than one AI answer match is not proof of correctness.** The proposed blind solver can catch some answer-key errors, but can share the generator's mistake and cannot establish curriculum fit, clarity, or fairness. See [Content operations](content-operations.md).
- **Large exams need an assessment blueprint.** Item counts alone do not specify subject weighting, difficulty mix, timing, randomized selection, or accommodation needs.
- **The system needs a review and correction path.** Learners will encounter disputed or confusing questions. Provide a way to flag content and correct or retire published items without erasing historical attempts.

## Proposed curriculum model

Use a flexible hierarchy rather than encoding a fixed number of topics in application logic:

```text
Exam program
└── Subject
    └── Topic
        └── Sub-topic
            ├── Lesson
            └── Practice quiz
    ├── Topic mastery assessment
    └── Subject mock assessment
└── Full exam simulation
```

The topic and sub-topic counts are editorial decisions driven by the chosen exam blueprint. A curriculum node should have an explicit type, parent, order, and publication state. Assessments should refer to curriculum nodes through their own blueprint; they should not be represented as pretend sub-topics.

This is a good structure for the product because it gives learners a clear path from a broad subject to a specific skill, while letting each subject have the breadth it needs. Keep it as a learning map, not as a rule that every node must contain exactly one lesson or quiz. A sub-topic may need several lessons or practice sets, and some concepts may be combined when that makes learning clearer.

### Learning sequence

- Each sub-topic can contain one or more short lessons and practice sets.
- A learner may need a configured score and/or completed prerequisite steps before an assessment unlocks.
- A failed attempt should lead to review guidance and another chance under a documented retry policy.
- A sub-topic quiz should diagnose which skills need practice and offer targeted review; under the proposed flow, learners can choose to review or continue.
- Progress should distinguish *started*, *completed*, and *mastered* rather than treating a visit as mastery.
- Topic mastery, subject mock, and full simulation are separate assessment types with independent timing and question-selection rules.

These are **proposed behaviors**; exact mastery thresholds, retry limits, and unlock rules remain undecided.

## Micro-lesson pattern

For quantitative topics, the proposed lesson sequence is:

1. **Core concept and inverse rules:** explain the idea with intuition and show why the operation is valid.
2. **Worked examples:** build from straightforward cases to common traps and more complex forms. For algebra, this can include positive values, negative values/sign changes, and fractions or reciprocals.
3. **Exam technique:** give a shortcut, estimation, back-solving, or elimination method, with its assumptions and a reminder of when to use the standard method.

Each lesson should include at least one check for understanding, readable notation on mobile, and a worked solution. Reading, language, and science lessons should use examples suited to their skills rather than forcing an algebra-specific three-variation formula.

## Assessment levels

The hierarchy works best when assessment purpose changes by level. Avoid making every level a pass/fail gate:

- **Sub-topic:** attach a short, formative quiz to the skill just taught. Use it for quick feedback and to suggest review. It does not need to block the learner after one attempt.
- **Topic:** use a mixed mastery quiz after its sub-topics. This is the natural place for a defined mastery threshold and an unlock rule for the next topic, if progression is meant to be gated.
- **Subject:** offer a subject mock as a larger practice milestone, especially when the target exam has a separately timed subject section. It need not be required after every topic.
- **Full simulation:** offer a capstone exam that follows the target exam's subject mix and timing. It is a separate exam blueprint spanning multiple subjects, not just another quiz attached to one curriculum node.

Link questions to the skills they measure, so an assessment can include questions across several sub-topics and feedback can point to the specific skills to review. Keep retakes and remediation available; mastery should encourage another learning loop, not become a dead end.

### Suggested sub-topic quiz flow

1. Assemble the default five-question quiz from approved questions tagged to the sub-topic's skills. Aim for a balanced check of the key skills.
2. Give a brief explanation after each answer, especially for incorrect answers.
3. At the end, summarize the skills the learner answered correctly and the ones to revisit.
4. Offer clear next steps such as **Review lesson**, **Practice missed skills**, and **Continue**. Make review a recommendation rather than a forced detour in the initial version.
5. If the learner chooses more practice after missing an item, assemble a short set (for example, three questions) focused on the missed skill or skills, preferably with questions they have not seen yet. Give more of the set to the skill with the clearest need; if several skills were missed, spread the questions across them. Shuffle question order and option order where appropriate.
6. Use the later topic mastery quiz to check retention across the whole topic. If that assessment is below its configured threshold, recommend review before another attempt.

If the learner answers all five correctly, show that result and let them continue. An optional mixed practice set can be available, but extra questions should not be assigned as remediation when the quiz did not reveal a weakness.

Treat quiz results as evidence for guidance, not a perfect measure of understanding. A missed item can reflect a confusing question or a one-off mistake, so avoid labeling a learner as incapable or permanently blocking a sub-topic based on a tiny quiz.

### Question bank and retry approach

Keep a pool of approved questions for each sub-topic instead of authoring a standalone fixed quiz for every learner and every retry. Tag each question with the specific skill/objective it checks, its difficulty, and its content version. The app can then assemble short practice sets that cover the intended skills and emphasize skills a learner missed.

For example, if a learner misses a question tagged `solve_two_step_equations` but gets `inverse_operations` right, show the explanation and offer a few fresh two-step-equation items. They may review the lesson or continue; their next practice set should prioritize the missed skill. Avoid immediately repeating the exact same item as the only retry, since that can test memory of the answer instead of understanding.

For a small pilot, a modest reviewed pool (for example, roughly 10–20 questions per sub-topic) can support initial quizzes and some retries. This is a starting estimate: sub-topics with several distinct skills need broader coverage, and repeated learners will need more items over time. If the pool is small, use a few curated quiz variants with comparable skill and difficulty coverage. Reuse an item only after the learner has seen its explanation, or offer a new approved variant. Do not create unreviewed AI questions live on each retry.

The selector should avoid recently seen questions when possible while preserving the assessment's skill and difficulty mix. Store which question versions each attempt used. For formal mastery assessments, define a consistent blueprint across attempts so one learner is not tested on a much easier or narrower set by chance.

| Assessment | Purpose | Current idea | Needs specification |
|---|---|---:|---|
| Micro-quiz | Check one sub-topic immediately | 3–5 items | Attempts, feedback timing, passing rule |
| Topic mastery | Mix skills across one topic | 15–20 items | Blueprint, mastery threshold, retakes |
| Subject mock | Build single-subject exam stamina | 45–50 timed items | Duration, coverage, difficulty and scoring |
| Full simulation | Practice the complete exam experience | 150+ items | Target exam, subject proportions, timing and accommodations |

The item counts are initial estimates, not requirements. Confirm them against the target exam and pilot data.

## Suggested first milestone

Define the target exam and select one representative subject. Author a small vertical slice: curriculum tree, a few sub-topic lessons, quizzes with reviewed explanations, one topic assessment, progress tracking, and a basic content correction workflow. Use learner feedback to tune lesson length and mastery rules before multiplying the content volume.
