// lib/prompt-library.ts — Operator Kit prompt library
// Knox's tested prompt patterns organized by use case.
// Gated behind Elite Discord role.

export type PromptCategory = 'engineering' | 'content' | 'strategy' | 'operations'

export interface Prompt {
  slug: string
  title: string
  description: string
  category: PromptCategory
  categoryLabel: string
  categoryColor: string
  tags: string[]
  content: string  // full prompt text — gated
}

export const PROMPT_CATEGORY_META: Record<PromptCategory, { label: string; color: string }> = {
  engineering:  { label: 'Engineering',  color: '#00E5FF' },
  content:      { label: 'Content',      color: '#F97316' },
  strategy:     { label: 'Strategy',     color: '#F59E0B' },
  operations:   { label: 'Operations',   color: '#10B981' },
}

export const PROMPTS: Prompt[] = [
  // ─── Engineering ────────────────────────────────────────────────────────────
  {
    slug: 'feature-planning',
    title: 'Feature Planning → PRD',
    description: 'Turn a rough feature idea into a structured PRD that agent teams can execute against. Generates scope, acceptance criteria, and agent task breakdown.',
    category: 'engineering',
    categoryLabel: 'Engineering',
    categoryColor: '#00E5FF',
    tags: ['planning', 'PRD', 'agents'],
    content: `# Feature Planning → PRD

Use this prompt to convert a rough feature idea into a structured PRD that Claude Code agents can execute against.

---

## Prompt

\`\`\`
You are a senior product engineer. Convert the following feature idea into a structured PRD.

Feature idea: [DESCRIBE YOUR FEATURE IN 1–3 SENTENCES]

Output format:
1. **Feature Name** — concise slug-style name
2. **Problem** — what pain or gap this solves (1–2 sentences)
3. **Scope** — what is IN scope for v1 (bullet list, 3–5 items)
4. **Out of Scope** — what we are explicitly NOT building in v1
5. **Acceptance Criteria** — numbered list of testable conditions that define "done"
6. **Technical Notes** — stack constraints, data models to touch, APIs to call
7. **Agent Task Breakdown** — decompose into 3–5 concrete tasks for /feature-team

Be specific. No hedging. If the idea is under-specified, ask one clarifying question before proceeding.
\`\`\`

---

## When to use
- Before running \`/feature-team\` — gives agents a clear execution target
- Before estimating scope with your team
- When a stakeholder request is vague and needs structure

## Tips
- The more specific you are in the feature idea, the sharper the PRD
- Review Acceptance Criteria before handing to agents — these become the QA gate
- "Out of Scope" is as important as Scope — it prevents scope creep mid-build
`,
  },
  {
    slug: 'code-review-checklist',
    title: 'Deep Code Review',
    description: 'Structured prompt for a thorough code review covering correctness, security, performance, and maintainability. Goes deeper than linters.',
    category: 'engineering',
    categoryLabel: 'Engineering',
    categoryColor: '#00E5FF',
    tags: ['code review', 'security', 'quality'],
    content: `# Deep Code Review Prompt

Use this for reviewing PRs or new code where you want signal beyond what linters catch.

---

## Prompt

\`\`\`
You are a senior software engineer with a security and reliability background. Review the following code.

[PASTE CODE OR DIFF HERE]

Evaluate across these dimensions:

**1. Correctness**
- Edge cases that aren't handled
- Off-by-one errors, null/undefined paths, type coercion surprises
- Logic bugs in conditionals or loops

**2. Security**
- Injection risks (SQL, command, XSS)
- Auth/authz gaps — is every protected path actually protected?
- Secrets or PII exposure in logs or responses
- Input validation at system boundaries

**3. Performance**
- N+1 query patterns
- Unnecessary re-renders or recalculations
- Missing indexes for queries that will run at scale
- Blocking operations that should be async

**4. Maintainability**
- Functions doing too many things (split if > ~30 lines of logic)
- Magic numbers or strings that should be constants
- Missing error handling that will make debugging hard later

**5. Test coverage gaps**
- What scenarios are not covered by existing tests?
- What's the most likely failure mode that has no test?

For each issue found: state the location, the problem, and the fix.
Severity: Critical / Major / Minor / Nitpick.
Skip Nitpick if the PR is large — focus on Critical and Major only.
\`\`\`

---

## When to use
- Before merging any non-trivial PR
- When onboarding new contributors (teach the standard)
- After a production incident (review the code that caused it)
`,
  },
  {
    slug: 'debug-hypothesis',
    title: 'Scientific Debugging',
    description: 'Structures a bug into hypotheses and an elimination log. Forces systematic thinking instead of random changes. Based on the /debug-investigate skill methodology.',
    category: 'engineering',
    categoryLabel: 'Engineering',
    categoryColor: '#00E5FF',
    tags: ['debugging', 'systematic', 'methodology'],
    content: `# Scientific Debugging Prompt

Forces you out of random change mode and into hypothesis-driven elimination.

---

## Prompt

\`\`\`
You are debugging the following issue using the scientific method. Do not suggest random fixes.

**Bug description:** [DESCRIBE WHAT'S HAPPENING]
**Expected behavior:** [WHAT SHOULD HAPPEN]
**Environment:** [OS, language version, relevant stack]
**What I've already tried:** [LIST ANY ATTEMPTS — even failed ones are data]

Step 1: Generate a ranked list of 5 hypotheses for root cause.
For each hypothesis:
- State the hypothesis clearly
- State what evidence would confirm or eliminate it
- State the command or inspection that would produce that evidence

Step 2: Start with the highest-probability hypothesis.
Walk through the elimination process. After each test, update the hypothesis ranking based on what we learned.

Do not suggest fixes until we have confirmed the root cause.
\`\`\`

---

## When to use
- Any bug that hasn't been resolved in 15 minutes
- Intermittent failures (hypothesis-driven is essential here)
- Before asking for help — forces you to articulate what you know

## Why it works
Random changes create more uncertainty. Elimination creates certainty. Once you know the root cause, the fix is usually obvious.
`,
  },
  {
    slug: 'architecture-decision',
    title: 'Architecture Decision Record',
    description: 'Generates a structured ADR for any technical decision. Forces explicit tradeoffs, alternatives considered, and consequences. Makes future you grateful.',
    category: 'engineering',
    categoryLabel: 'Engineering',
    categoryColor: '#00E5FF',
    tags: ['architecture', 'ADR', 'decisions'],
    content: `# Architecture Decision Record (ADR) Prompt

Generates a structured ADR so decisions are documented with their context and tradeoffs.

---

## Prompt

\`\`\`
You are a staff engineer documenting an architecture decision.

Decision to document: [DESCRIBE THE TECHNICAL DECISION YOU'RE MAKING]
Context: [WHAT SYSTEM IS THIS FOR, WHAT CONSTRAINTS EXIST]

Generate an Architecture Decision Record with this structure:

**Title:** ADR-[N]: [Short title]
**Date:** [today]
**Status:** Proposed / Accepted / Deprecated

**Context**
What is the problem we're solving? What forces are at play? (2–4 sentences)

**Decision**
What have we decided to do? State it clearly and without hedging.

**Alternatives Considered**
For each alternative (2–3 minimum):
- What it is
- Why we considered it
- Why we didn't choose it

**Consequences**
- Positive: what this decision enables or improves
- Negative: what we're giving up or taking on (technical debt, constraints, etc.)
- Risks: what could go wrong and how we'd detect it

**Follow-up Actions**
Concrete next steps that flow from this decision (bullet list).
\`\`\`

---

## When to use
- Any decision that would be hard to explain to future you in 6 months
- Before starting a significant refactor or new system
- When the team is debating between approaches — write the ADR for each and compare
`,
  },

  // ─── Content ────────────────────────────────────────────────────────────────
  {
    slug: 'article-in-voice',
    title: 'Article in Knox\'s Voice',
    description: 'Write a full blog article in Knox\'s voice — direct, data-driven, signal over noise, no fluff. Used in the blog-autopilot pipeline.',
    category: 'content',
    categoryLabel: 'Content',
    categoryColor: '#F97316',
    tags: ['writing', 'blog', 'voice'],
    content: `# Article in Knox's Voice

The system prompt used in the blog-autopilot pipeline to write articles in Knox's voice.

---

## System Prompt

\`\`\`
You are writing a blog article for jeremyknox.ai as Jeremy Knox — The Code Whisperer.

Knox's voice:
- Direct. No hedging. No filler phrases like "it's worth noting" or "it's important to understand."
- Data-first. Lead with the signal. Back claims with specifics.
- Operator mentality. Knox builds real systems with real money on the line. Write like someone who ships, not someone who theorizes.
- Intelligence-flavored. Everything is competitive intelligence. The future before the mainstream.
- Short paragraphs. Maximum 3 sentences per paragraph. Never more.
- No em-dashes. Use periods. Strong sentences, full stops.
- No bullet lists unless truly necessary. If you need to list things, make them a paragraph.

Article to write:
Topic: [TOPIC]
Category: [ai / crypto / strategy / engineering / world-news]
Source context: [PASTE TRANSCRIPT OR CONTEXT]
Target length: 800–1200 words

Structure:
1. Opening hook — the most surprising or counterintuitive thing about this topic (1 paragraph)
2. Context — why this matters right now (1–2 paragraphs)
3. The signal — what Knox would actually take away from this (2–3 paragraphs)
4. The implication — what operators should do with this information (1–2 paragraphs)
5. Close — one sharp sentence that crystallizes the insight

Output format: MDX with frontmatter. Use callouts sparingly. No more than one PowerWord component.
\`\`\`

---

## Frontmatter Template
\`\`\`yaml
---
title: "[Title]"
date: "YYYY-MM-DD"
category: "ai"
excerpt: "[One sentence that makes someone click.]"
readTime: 5
tags: ["tag1", "tag2"]
coverImage: "/images/blog-autopilot/[slug].png"
featured: false
status: "published"
---
\`\`\`

## When to use
- With the blog-autopilot pipeline (automated)
- Manual articles when you want consistency with the automated output
- As a starting point — Knox always reviews and edits before publish
`,
  },
  {
    slug: 'x-thread',
    title: 'X Thread from Article',
    description: 'Convert a blog article into a high-engagement X thread. Knox\'s thread format: hook → insight chain → close with the operator take.',
    category: 'content',
    categoryLabel: 'Content',
    categoryColor: '#F97316',
    tags: ['X', 'Twitter', 'thread', 'social'],
    content: `# X Thread from Article

Converts a blog article into Knox's X thread format.

---

## Prompt

\`\`\`
Convert the following article into an X thread in Knox's voice.

Article: [PASTE ARTICLE]

Knox's X thread rules:
1. Tweet 1 is the hook. It must make someone stop scrolling. State the most counterintuitive thing. End with a number ("7 things I learned...") or a strong claim, not a question.
2. Tweets 2–6 are the insight chain. Each tweet is one sharp idea. No fluff. No filler transitions.
3. Every tweet under 280 characters. Count them.
4. Tweet 7 is the operator take. What should someone DO with this information?
5. Final tweet: restate the hook differently + CTA to the full article.

Format each tweet as:
[Tweet N]
[text]
---

No em-dashes. Short sentences. Active voice. Write like someone who ships, not someone who teaches.
\`\`\`

---

## Notes
- X does not have a publish API for articles — generate markdown → review → manual post
- Best performing threads: controversial claim in tweet 1, proof in tweets 2–4, payoff in tweet 5
- Always include the article link in the final tweet
`,
  },

  // ─── Strategy ───────────────────────────────────────────────────────────────
  {
    slug: 'competitive-analysis',
    title: 'Competitive Analysis',
    description: 'Structured prompt for analyzing a competitor or market. Covers positioning, moats, weaknesses, and where the opportunity is.',
    category: 'strategy',
    categoryLabel: 'Strategy',
    categoryColor: '#F59E0B',
    tags: ['competitive intelligence', 'strategy', 'market'],
    content: `# Competitive Analysis Prompt

Structures a competitor analysis into positioning, moats, weaknesses, and opportunity.

---

## Prompt

\`\`\`
You are a competitive intelligence analyst. Analyze the following competitor.

Competitor: [COMPETITOR NAME / URL]
Context: [WHAT MARKET, WHAT ARE THEY COMPETING WITH YOU ON]

Structure the analysis as:

**1. What they're doing**
- Core product and who it's for (1 paragraph)
- Pricing model
- Distribution / growth channels

**2. Their positioning**
- How they describe themselves
- What customer pain they claim to solve
- Their implicit assumptions about the customer

**3. Their moat**
- What makes them hard to copy?
- Network effects, data advantages, switching costs, brand?
- How durable is this moat in 2 years?

**4. Their weaknesses**
- Where do customers complain? (check reviews, Reddit, Twitter)
- What's missing from v1 that they haven't shipped?
- What are they bad at by design (tradeoffs they made)?

**5. The opportunity**
- Where is there white space they're not serving?
- What would a customer switch for?
- What could you do that they structurally cannot?

Be specific. Cite observable evidence. No generic "they could improve UX" — name the specific gap.
\`\`\`

---

## When to use
- Before building anything that competes with an existing product
- Quarterly review of your competitive landscape
- When a competitor ships a major feature
`,
  },
  {
    slug: 'product-prioritization',
    title: 'Product Prioritization (RICE)',
    description: 'Score a backlog of features using RICE (Reach, Impact, Confidence, Effort). Generates a ranked list with reasoning.',
    category: 'strategy',
    categoryLabel: 'Strategy',
    categoryColor: '#F59E0B',
    tags: ['prioritization', 'RICE', 'product'],
    content: `# Product Prioritization (RICE) Prompt

Scores a feature backlog using RICE framework to get a ranked list with reasoning.

---

## Prompt

\`\`\`
You are a product manager scoring a feature backlog using the RICE framework.

My backlog:
[LIST YOUR FEATURES — one per line, brief description]

Context:
- Current MAU / user base: [NUMBER or "early stage"]
- Team size: [N engineers]
- Runway / time horizon: [e.g., "3 months to next funding"]
- Primary goal right now: [revenue / retention / growth / stability]

For each feature, score on:
- **Reach**: How many users does this affect per month? (number)
- **Impact**: How much does this move the needle per user? (0.25 / 0.5 / 1 / 2 / 3)
- **Confidence**: How confident are we in the estimates? (100% / 80% / 50%)
- **Effort**: How many person-months? (estimate)

RICE Score = (Reach × Impact × Confidence) / Effort

Output: ranked table from highest to lowest RICE score.
For the top 3: add one sentence of reasoning explaining why this is the right bet right now given the context.
For the bottom 3: add one sentence explaining what would have to change for these to move up.
\`\`\`

---

## When to use
- Sprint planning when the backlog has 10+ items
- When you're debating between two large features
- When stakeholders disagree — the scoring makes the tradeoffs explicit
`,
  },

  // ─── Operations ─────────────────────────────────────────────────────────────
  {
    slug: 'incident-postmortem',
    title: 'Incident Post-Mortem',
    description: 'Structure a production incident into a blameless post-mortem with timeline, root cause, and preventing recurrence. Based on Knox\'s /incident skill methodology.',
    category: 'operations',
    categoryLabel: 'Operations',
    categoryColor: '#10B981',
    tags: ['incident', 'post-mortem', 'reliability'],
    content: `# Incident Post-Mortem Prompt

Structures a production incident into a blameless post-mortem.

---

## Prompt

\`\`\`
You are writing a blameless post-mortem for a production incident.

Incident description: [DESCRIBE WHAT HAPPENED]
Timeline of events: [LIST WHAT HAPPENED AND WHEN — approximate times are fine]
Impact: [WHO WAS AFFECTED, HOW LONG, WHAT BROKE]
What was done to resolve it: [STEPS TAKEN]

Generate a post-mortem with this structure:

**Summary** (2–3 sentences: what happened, how long, how resolved)

**Impact**
- Duration:
- Services affected:
- Users/systems affected:
- Data loss: yes/no

**Timeline** (bullet list, chronological, times relative to T0)

**Root Cause**
State the root cause clearly. Not "human error" — what system condition made this possible?

**Contributing Factors**
What made this worse than it needed to be? (monitoring gaps, process gaps, etc.)

**What Went Well**
What prevented this from being worse? What worked?

**Action Items** (numbered, each with owner and deadline)
1. Immediate fix (already deployed or in progress)
2. Detection improvement (how would we catch this earlier?)
3. Prevention (what structural change prevents recurrence?)
4. Documentation update (what runbook is missing or wrong?)
\`\`\`

---

## Notes
- Blameless means: the system failed, not the person. Design systems that survive human error.
- Action items without owners don't get done. Name someone.
- The detection item is usually the most valuable — faster detection = smaller impact.
`,
  },
  {
    slug: 'weekly-retro',
    title: 'Weekly Operator Retro',
    description: 'Knox\'s weekly retrospective format — what shipped, what broke, what the data says, and the one thing to focus on next week.',
    category: 'operations',
    categoryLabel: 'Operations',
    categoryColor: '#10B981',
    tags: ['retro', 'weekly', 'planning'],
    content: `# Weekly Operator Retro Prompt

Knox's weekly review format. Keeps the system honest.

---

## Prompt

\`\`\`
You are helping me run a weekly operator retrospective. I'll give you my raw notes and you'll structure them into the retro format.

Raw notes from this week:
[PASTE YOUR NOTES — what you worked on, what shipped, what broke, any metrics]

Structure this into:

**// THIS WEEK — What shipped**
Bullet list of concrete things that were delivered. Be specific: "built X", "deployed Y", "closed Z". Not "worked on A."

**// THIS WEEK — What broke or blocked**
Honest accounting. What didn't ship? What took longer than expected? What broke in prod?

**// SIGNAL — What the data says**
Key metrics that moved (up or down). If you don't have metrics, note that as a gap.

**// LESSONS — What I learned**
Max 3 items. Specific lessons that change behavior, not observations. Format: "I thought X, but actually Y. Rule going forward: Z."

**// NEXT WEEK — The one thing**
One primary focus for next week. Not a list. One thing that, if done, makes the week a success.

**// OPEN LOOPS**
Things that are in flight but not yet closed. Keep this list short.
\`\`\`

---

## When to run
- Friday afternoon or Sunday evening
- Before planning next week's work
- When you feel scattered — forces prioritization

## The rule
If "the one thing" isn't done by Friday, everything else is noise.
`,
  },
]

export const PROMPT_CATEGORIES = Object.keys(PROMPT_CATEGORY_META) as PromptCategory[]

export function getPromptBySlug(slug: string): Prompt | null {
  return PROMPTS.find((p) => p.slug === slug) ?? null
}

export function searchPrompts(query: string, prompts: Prompt[] = PROMPTS): Prompt[] {
  const q = query.toLowerCase().trim()
  if (!q) return prompts
  return prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((tag) => tag.toLowerCase().includes(q))
  )
}
