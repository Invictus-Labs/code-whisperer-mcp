// lib/skills.ts — Claude Skills Library catalog
// Each skill corresponds to a ~/.claude/skills/<slug>/SKILL.md file.
// Public fields (title, description, category, useCases, triggers) render freely.
// content is the gated full SKILL.md — only rendered after Elite role auth.

export type SkillCategory = 'agents' | 'audit' | 'devops' | 'intelligence' | 'content' | 'build'

export interface Skill {
  slug: string
  title: string
  description: string
  category: SkillCategory
  categoryColor: string
  categoryLabel: string
  triggers: string[]
  useCases: string[]
  content: string        // full SKILL.md text — gated behind Elite role
  relatedSlugs?: string[] // other skills commonly used with this one
}

export const CATEGORY_META: Record<SkillCategory, { label: string; color: string }> = {
  agents:      { label: 'Agent Teams',    color: '#00E5FF' },
  audit:       { label: 'Audit & Review', color: '#F59E0B' },
  devops:      { label: 'DevOps & Ops',   color: '#10B981' },
  intelligence:{ label: 'Intelligence',   color: '#A855F7' },
  content:     { label: 'Content & Retro',color: '#F97316' },
  build:       { label: 'Build & Deploy', color: '#8B5CF6' },
}

export const SKILLS: Skill[] = [
  // ─── Agent Teams ────────────────────────────────────────────────────────────
  {
    slug: 'feature-team',
    title: 'Feature Team',
    description: 'Spawn a 3-agent team (Backend Dev + Frontend Dev + QA) to implement features from PRDs. Agents own separate file territories and coordinate via messaging.',
    category: 'agents',
    categoryColor: '#00E5FF',
    categoryLabel: 'Agent Teams',
    triggers: ['/feature-team', 'build feature', 'implement PRD', 'full-stack feature'],
    useCases: [
      'Implement a full-stack feature from a PRD or task description',
      'Build a new page with backend API + frontend UI in parallel',
      'Add a feature with automated QA gate before merge',
    ],
    relatedSlugs: ['quality-team', 'security-team'],
    content: `---
name: feature-team
description: "Spawn a 3-agent feature team (Backend Dev + Frontend Dev + QA) for implementing features from PRDs or task descriptions. Agents own separate file territories and coordinate via messaging. TRIGGERS: feature-team, /feature-team, build feature, implement PRD, full-stack feature"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep, TeamCreate, TaskCreate, TaskUpdate, TaskList, SendMessage
---

# Feature Team — Backend Dev + Frontend Dev + QA

**Execution model**: You (Claude Code) are the orchestrator. Create a team of 3 agents with strict file territory ownership.

## Usage

\`\`\`
/feature-team <description or PRD link>
/feature-team --backend-only <description>    # Skip frontend agent
/feature-team --frontend-only <description>   # Skip backend agent
\`\`\`

---

## Step 1 — Understand the feature

Read the PRD, task description, or user request. Identify:
- **Backend scope**: API routes, data models, business logic, migrations
- **Frontend scope**: Components, pages, state management, API integration
- **Test scope**: Unit tests, integration tests, E2E scenarios
- **File territories**: Which directories each agent owns (NO OVERLAP)

---

## Step 2 — Define the Definition of Done (MANDATORY)

Before creating the team, produce explicit acceptance criteria that ALL agents will reference.
This prevents goalpost-moving mid-build — the QA agent grades against these criteria, not vibes.

Write a DOD block with this structure and include it verbatim in each agent's prompt:

\`\`\`markdown
## Definition of Done — {feature name}

### Functional
- [ ] {specific behavior that must work}
- [ ] {API endpoint returns correct shape}
- [ ] {UI component renders in all states}

### Quality Gate
- [ ] >= 3 tests per new module
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Build passes

### E2E
- [ ] {describe what a human would verify manually}
\`\`\`

---

## Step 3 — Define file territories (CRITICAL — prevents merge conflicts)

Map the codebase and assign exclusive zones:

| Agent | Territory | Examples |
|-------|-----------|---------|
| Backend | API routes, models, services, migrations | \`app/api/\`, \`lib/db/\`, \`prisma/\` |
| Frontend | Pages, components, hooks, styles | \`app/(routes)/\`, \`components/\`, \`hooks/\` |
| QA | Test files only | \`__tests__/\`, \`e2e/\`, \`*.test.ts\` |

**Rule**: If a file belongs to two agents, pick one owner. The other agent sends a message describing what they need; the owner implements it.

---

## Step 4 — Spawn the team

Use TeamCreate to create the team, then Agent tool to spawn each member:

\`\`\`
Team: feature-{feature-slug}
Members: backend-dev, frontend-dev, qa-engineer
\`\`\`

Spawn all 3 agents in parallel (single message, multiple Agent tool calls).

### Backend Dev prompt template:
> You are the Backend Dev on the {feature} feature team. Your territory: {backend paths}.
>
> Feature: {description}
>
> DOD: {paste DOD block}
>
> Your job:
> 1. Implement all backend logic, API routes, and data layer changes
> 2. Write >= 3 tests per new module
> 3. When done, message frontend-dev: "Backend ready. Endpoints: {list}. Schemas: {list}."
> 4. When done, message qa-engineer: "Backend tests passing. Coverage: {%}."
>
> Do NOT touch frontend files. If you need a shared type, message frontend-dev to create it.
> Run tests before declaring done. Report: what was built, test results, any blockers.

### Frontend Dev prompt template:
> You are the Frontend Dev on the {feature} feature team. Your territory: {frontend paths}.
>
> Feature: {description}
>
> DOD: {paste DOD block}
>
> Your job:
> 1. Build all UI components, pages, and state management
> 2. Integrate with backend endpoints (wait for backend-dev's "Backend ready" message if needed)
> 3. Write render tests for new components (vitest)
> 4. When done, message qa-engineer: "Frontend complete. Pages: {list}. Components: {list}."
>
> Do NOT touch backend files. If backend isn't ready, build with mock data and note the dependency.
> Run build (\`npm run build\`) before declaring done. Report: what was built, any blockers.

### QA Engineer prompt template:
> You are the QA Engineer on the {feature} feature team. Your territory: test files only.
>
> Feature: {description}
>
> DOD: {paste DOD block}
>
> Your job:
> 1. Wait for backend-dev and frontend-dev to message you
> 2. Write integration tests that cover the full feature flow
> 3. Run the full test suite (\`npm run test\`)
> 4. Grade the feature against the DOD — pass/fail per item
> 5. Report: DOD checklist result, test coverage, any items that failed
>
> If something fails the DOD, message the responsible agent with: "DOD item X failed: {what you observed} vs {what was expected}. Please fix."

---

## Step 5 — Monitor and resolve blockers

Check SendMessage outputs from each agent. Common patterns:
- **Dependency blocker**: Frontend waiting for backend type definition → forward the request to backend-dev
- **Test failure**: QA found regression → send failing test output to responsible agent
- **Merge conflict risk**: Two agents edited shared config → mediate the merge yourself

---

## Step 6 — Integration check

After all 3 agents report done:
1. Run \`npm run build\` (or equivalent) from the root
2. Run full test suite
3. Do a quick manual smoke test of the feature
4. If anything fails, re-dispatch the responsible agent with the specific error

---

## Step 7 — Create PR

\`\`\`bash
git add -p   # stage intentionally
git commit -m "feat: {feature description}"
gh pr create --title "feat: {feature}" --body "$(cat <<'EOF'
## Summary
- {bullet 1}
- {bullet 2}

## Test plan
- [ ] Backend tests pass
- [ ] Frontend build passes
- [ ] Manual smoke test: {describe}
EOF
)"
\`\`\`

---

## Tips

- **Always define file territories BEFORE spawning agents** — conflicts are painful to untangle
- **DOD is the contract** — write it before any code, not after
- **Backend-first for dependent features** — frontend can mock, but types must be agreed upfront
- **QA is a gate, not an afterthought** — if QA fails an item, the feature isn't done`,
  },
  {
    slug: 'quality-team',
    title: 'Quality Team',
    description: 'Spawn a 3-agent QA gate (Test Writer + Code Reviewer + Coverage Analyst) for pre-release quality assurance and coverage remediation.',
    category: 'agents',
    categoryColor: '#00E5FF',
    categoryLabel: 'Agent Teams',
    triggers: ['/quality-team', 'QA gate', 'coverage check', 'pre-release QA', 'test coverage'],
    useCases: [
      'Run a comprehensive QA gate before a major release',
      'Remediate test coverage gaps in an existing codebase',
      'Get a code review + test audit in parallel',
    ],
    relatedSlugs: ['feature-team', 'audit-swarm'],
    content: `---
name: quality-team
description: "Spawn a 3-agent quality team (Test Writer + Code Reviewer + Coverage Analyst) for pre-release QA gate or coverage remediation. TRIGGERS: quality-team, /quality-team, QA gate, coverage check, pre-release QA, test coverage"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep, TeamCreate, TaskCreate, TaskUpdate, SendMessage
---

# Quality Team — Test Writer + Code Reviewer + Coverage Analyst

**Execution model**: 3 specialized agents run in parallel. Each has a distinct mandate — no overlap, no diffusion.

## Usage

\`\`\`
/quality-team                    # Full QA gate on current repo
/quality-team --coverage-only    # Coverage analysis + remediation only
/quality-team --review-only      # Code review pass only
/quality-team <path>             # Scope to a subdirectory
\`\`\`

---

## Step 1 — Preflight

Before spawning agents:

\`\`\`bash
# Get current test + coverage baseline
npm run test -- --coverage 2>&1 | tail -30
# Or for Python:
pytest --cov=. --cov-report=term-missing 2>&1 | tail -30
\`\`\`

Record the baseline: overall coverage %, failing tests (if any), uncovered modules.

---

## Step 2 — Spawn all 3 agents in parallel

### Test Writer prompt:
> You are the Test Writer on a quality team reviewing {repo or path}.
>
> Baseline coverage: {X}%
> Failing tests: {list or "none"}
>
> Your job:
> 1. Identify modules/functions with < 80% coverage or no tests
> 2. Write new test files to close the gaps — prioritize critical business logic first
> 3. Each new test file must have >= 3 meaningful test functions (no trivial assertions)
> 4. Run the test suite after writing to confirm all pass
> 5. Report: files created, coverage delta, any tests that couldn't be written and why
>
> Do NOT refactor existing code. Only add test files.

### Code Reviewer prompt:
> You are the Code Reviewer on a quality team reviewing {repo or path}.
>
> Your job:
> 1. Read all recently changed files (git diff main...HEAD or the last 20 commits)
> 2. Check for: security issues (OWASP top 10), error handling gaps, missing edge cases, logic bugs
> 3. Check for: hardcoded secrets, missing input validation, SQL/command injection risks
> 4. Produce a findings report: severity (P0/P1/P2), file:line, description, recommended fix
> 5. For P0/P1 issues: implement the fix directly. For P2: document in report only.
>
> Do NOT add tests. Focus on correctness and security.

### Coverage Analyst prompt:
> You are the Coverage Analyst on a quality team reviewing {repo or path}.
>
> Your job:
> 1. Run coverage report and identify the 10 most critical uncovered code paths
> 2. For each: explain WHY it's risky to leave uncovered (what breaks if it regresses)
> 3. Identify dead code (never executed in tests OR production) — list for removal
> 4. Check: are integration tests hitting real external dependencies or mocking everything?
> 5. Report: coverage map, risk ranking, dead code candidates, mock vs real assessment
>
> Do NOT write tests. Produce the analysis that guides the Test Writer.

---

## Step 3 — Synthesize and act

After all 3 report:
1. Apply P0/P1 fixes from the Code Reviewer (if they didn't self-fix)
2. Verify new tests pass (\`npm run test\`)
3. Run coverage again — confirm delta from Test Writer's work
4. Create a QA summary:

\`\`\`markdown
## QA Gate Summary — {date}

### Coverage
- Before: {X}%
- After: {Y}%
- Delta: +{Z}%

### Code Review Findings
- P0: {count} — all resolved
- P1: {count} — all resolved
- P2: {count} — documented (non-blocking)

### Dead Code
- {list of candidates}

### Gate result: PASS / FAIL
\`\`\`

---

## Tips

- **Coverage alone is not quality** — 95% coverage with trivial assertions is worse than 70% with real behavior tests
- **P0 blocks merge** — never merge with unresolved P0 (security, data loss, incorrect business logic)
- **Mock assessment matters** — if everything is mocked, you're testing your mocks, not your code`,
  },
  {
    slug: 'security-team',
    title: 'Security Team',
    description: 'Spawn a 3-agent security review team (Static Analyzer + Dependency Auditor + Threat Modeler) for pre-deploy security gates.',
    category: 'agents',
    categoryColor: '#00E5FF',
    categoryLabel: 'Agent Teams',
    triggers: ['/security-team', 'security review', 'threat model', 'dependency audit', 'pre-deploy security'],
    useCases: [
      'Pre-deploy security gate before launching a new service',
      'Dependency audit for a third-party package adoption',
      'Threat model a new authentication or payment flow',
    ],
    content: `---
name: security-team
description: "Spawn a 3-agent security team (Static Analyzer + Dependency Auditor + Threat Modeler) for security reviews and pre-deploy gates. TRIGGERS: security-team, /security-team, security review, threat model, dependency audit, pre-deploy security"
allowed-tools: Agent, Bash, Read, Write, Glob, Grep, TeamCreate, TaskCreate, SendMessage
---

# Security Team — Static Analyzer + Dependency Auditor + Threat Modeler

**Execution model**: 3 specialized security agents in parallel. Faster and cheaper than a full audit swarm for security-only reviews.

## Usage

\`\`\`
/security-team                        # Full security review of current repo
/security-team --pre-deploy           # Quick gate before deploying a PR
/security-team --deps-only            # Dependency audit only
/security-team --threat-model <area>  # Threat model a specific feature or flow
\`\`\`

---

## Step 1 — Scope definition

Identify:
- **Changed surface**: What changed since last review? (\`git diff main...HEAD --name-only\`)
- **Critical paths**: Auth flows, payment handling, data access, external API calls
- **Stack**: Languages, frameworks, third-party packages

---

## Step 2 — Spawn all 3 agents in parallel

### Static Analyzer prompt:
> You are a Static Security Analyzer reviewing {repo or path}.
>
> Your job:
> 1. Scan for OWASP Top 10: injection, broken auth, XSS, IDOR, security misconfiguration
> 2. Check for: hardcoded secrets, API keys in code or git history, sensitive data in logs
> 3. Check for: missing input validation at system boundaries (user input, external APIs)
> 4. Check for: \`dangerouslySetInnerHTML\` without sanitization, eval(), exec() with user input
> 5. Check for: SQL queries built with string concatenation
> 6. Produce findings: severity (P0/P1/P2), file:line, description, remediation
>
> For P0 (actively exploitable): implement the fix. For P1/P2: document only.
> Scope: {changed files or full repo}

### Dependency Auditor prompt:
> You are a Dependency Security Auditor reviewing {repo or path}.
>
> Your job:
> 1. Run \`npm audit\` (or \`pip-audit\`, \`cargo audit\`) and capture full output
> 2. Categorize vulnerabilities: Critical/High/Medium/Low
> 3. For each Critical/High: research the CVE, assess actual exploitability in this codebase
> 4. Identify: outdated packages with known CVEs, abandoned packages (no updates > 2 years)
> 5. Check: are any packages fetching remote resources at install or runtime?
> 6. Recommend: upgrade path for each Critical/High with specific version pinning
>
> Produce: vuln table, exploitability assessment, upgrade commands ready to run.

### Threat Modeler prompt:
> You are a Threat Modeler reviewing {repo or path}.
>
> Your job:
> 1. Map the attack surface: entry points (HTTP endpoints, webhooks, file uploads, env vars)
> 2. Identify trust boundaries: where does untrusted data enter the system?
> 3. For each trust boundary: what's the worst-case abuse scenario?
> 4. STRIDE analysis on the most critical flows: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege
> 5. Check: auth model (who can access what?), rate limiting, audit logging
> 6. Produce: threat matrix, highest-risk paths, recommended mitigations
>
> Focus on: {specific area or "general review"}

---

## Step 3 — Triage and act

After all 3 report:
1. Merge findings by severity
2. Resolve all P0s immediately (if Static Analyzer didn't self-fix)
3. Create upgrade PRs for Critical/High CVEs
4. Document the threat model in \`docs/security/threat-model.md\`
5. Add monitoring for newly identified risk paths

---

## Output

\`\`\`markdown
## Security Review — {date}

### Static Analysis
- P0: {count} — {status}
- P1: {count} — {status}
- P2: {count} — documented

### Dependencies
- Critical CVEs: {count}
- High CVEs: {count}
- Upgrade actions: {list}

### Threat Model
- Attack surface: {N entry points}
- Highest risk: {top 3 paths}
- Mitigations applied: {list}

### Gate result: PASS / FAIL
\`\`\``,
  },
  {
    slug: 'design-team',
    title: 'Design Team',
    description: 'Spawn a 3-agent design team (UI Implementer + Accessibility Reviewer + Design System Enforcer) for building new pages, redesigns, and component work.',
    category: 'agents',
    categoryColor: '#00E5FF',
    categoryLabel: 'Agent Teams',
    triggers: ['/design-team', 'build page', 'redesign', 'new component', 'UI implementation'],
    useCases: [
      'Build a new page from a design reference or wireframe',
      'Redesign an existing page with design system enforcement',
      'Audit a component library for accessibility and consistency',
    ],
    content: `---
name: design-team
description: "Spawn a 3-agent design team (UI Implementer + Accessibility Reviewer + Design System Enforcer) for building new pages, redesigns, and component work. Requires design-system/MASTER.md in the project. TRIGGERS: design-team, /design-team, build page, redesign, new component, UI implementation"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep, TeamCreate, TaskCreate, SendMessage
---

# Design Team — UI Implementer + Accessibility Reviewer + Design System Enforcer

**Prerequisite**: The project must have \`design-system/MASTER.md\`. If it doesn't exist, STOP and generate it before spawning this team.

## Usage

\`\`\`
/design-team <page or component to build>
/design-team --audit               # Audit existing UI for design system compliance
/design-team --accessibility       # Accessibility-only review pass
\`\`\`

---

## Step 1 — Read the design system

Before spawning, read \`design-system/MASTER.md\` and extract:
- Color palette (background, primary, secondary, accent, text tiers)
- Typography scale (fonts, sizes, weights, line-heights)
- Spacing system
- Component patterns (cards, buttons, nav, modals)
- Dark/light mode rules
- Brand voice and visual identity

This context goes into EVERY agent's prompt verbatim.

---

## Step 2 — Spawn all 3 agents in parallel

### UI Implementer prompt:
> You are the UI Implementer on a design team building {page/component}.
>
> Design system (from MASTER.md):
> {paste design system summary}
>
> Task: Build {specific description}
>
> Requirements:
> 1. Match the design system exactly — no improvising fonts, colors, or spacing
> 2. Mobile-first responsive (320px → 1440px)
> 3. Body text >= 16px, headings >= font-semibold (600), line-height >= 1.5
> 4. Semantic HTML (nav, main, section, article, aside, header, footer)
> 5. All interactive elements have cursor-pointer
> 6. No magic numbers — use design tokens from MASTER.md
>
> Do NOT address accessibility (another agent handles that).
> Do NOT invent new design patterns — use only what's in MASTER.md.
> Report: what was built, files created/modified, open questions.

### Accessibility Reviewer prompt:
> You are the Accessibility Reviewer on a design team reviewing {page/component}.
>
> Your job (after UI Implementer reports done, or run in parallel on existing code):
> 1. Check: all images have meaningful alt text (not "image" or filename)
> 2. Check: color contrast ratios >= 4.5:1 for body, >= 3:1 for large text (WCAG AA)
> 3. Check: interactive elements are keyboard-navigable (tab order, focus styles)
> 4. Check: form inputs have associated labels, error messages are programmatically linked
> 5. Check: touch targets >= 44x44px on mobile
> 6. Check: \`prefers-reduced-motion\` respected for animations
> 7. Check: heading hierarchy is logical (h1 → h2 → h3, no skips)
>
> Fix P0 issues (missing alt text, broken focus, WCAG AA failures) directly.
> Document P1/P2 issues with remediation notes.
> Report: issues found, fixes applied, remaining items.

### Design System Enforcer prompt:
> You are the Design System Enforcer on a design team reviewing {page/component}.
>
> Design system (from MASTER.md):
> {paste design system summary}
>
> Your job:
> 1. Audit every color value in the new/changed code — flag anything not in the palette
> 2. Audit every font-size, font-weight, line-height — flag any that violate the type scale
> 3. Audit spacing — are the values from the spacing system or arbitrary px values?
> 4. Check: does this page/component feel visually consistent with existing pages?
> 5. Check: are custom CSS classes used instead of re-implementing existing patterns?
> 6. Flag: any "clever" design decisions that aren't in MASTER.md
>
> Fix violations directly (swap the correct token). Don't redesign — enforce.
> Report: violations found, fixes applied, MASTER.md updates needed.

---

## Step 3 — Pre-delivery checklist

After all 3 agents report done, run manually:
- [ ] Screenshot at 320px, 768px, 1280px, 1440px
- [ ] Tab through all interactive elements — focus visible?
- [ ] Check in dark mode if applicable
- [ ] Run Lighthouse accessibility score (target >= 95)
- [ ] Verify design system is unchanged (no new CSS variables introduced without MASTER.md update)`,
  },
  {
    slug: 'research-team',
    title: 'Research Team',
    description: 'Spawn a 3-agent research team (Researcher + Strategist + Critic) for market research, competitive intelligence, and pre-PRD discovery.',
    category: 'agents',
    categoryColor: '#00E5FF',
    categoryLabel: 'Agent Teams',
    triggers: ['/research-team', 'market research', 'competitive intel', 'pre-PRD research'],
    useCases: [
      'Market research before writing a PRD for a new feature',
      'Competitive intelligence on a rival product or category',
      'Validate assumptions before committing engineering resources',
    ],
    content: `---
name: research-team
description: "Spawn a 3-agent research team (Researcher + Strategist + Critic) for market research, competitive intel, and pre-PRD discovery. Uses Claude Code native agent teams with peer-to-peer messaging. TRIGGERS: research-team, /research-team, market research, competitive intel, pre-PRD research"
allowed-tools: Agent, Bash, Read, Write, Glob, Grep, TeamCreate, TaskCreate, SendMessage, WebSearch, WebFetch
---

# Research Team — Researcher + Strategist + Critic

**Execution model**: 3 agents in sequence (not parallel) — Researcher gathers, Strategist synthesizes, Critic stress-tests. Sequential because each stage builds on the previous.

## Usage

\`\`\`
/research-team <research question or topic>
/research-team --competitive <product or category>   # Competitive focus
/research-team --pre-prd <feature idea>              # Pre-PRD validation
\`\`\`

---

## Step 1 — Frame the research question

Before spawning, define:
- **Core question**: What decision does this research inform?
- **Scope**: What's in and out of scope?
- **Output format**: PRD input? Go/no-go recommendation? Competitive positioning?
- **Time box**: How deep to go (1h research = shallow, 3h = thorough)

---

## Step 2 — Researcher agent

> You are the Researcher. Your job is to gather, not interpret.
>
> Research question: {question}
> Scope: {in/out}
>
> **Required tools**: Use WebSearch to find current information and WebFetch to extract full
> page content. Do not rely solely on internal codebase knowledge — go live.
>
> Deliverables:
> 1. Market landscape: who are the major players, what are their approaches?
> 2. User pain points: what do users say is broken or missing? (forums, reviews, social)
> 3. Technology landscape: what solutions exist, what are their tradeoffs?
> 4. Data points: find 5-10 concrete numbers (market size, user counts, pricing, growth rates)
> 5. Primary sources: link every claim to its source (use WebFetch to verify URLs)
>
> Format: structured markdown with source links.
> Do NOT interpret or recommend — only gather and organize.
> When done, message strategist: "Research complete. Key findings attached."

---

## Step 3 — Strategist agent (after Researcher)

> You are the Strategist. You have received research from the Researcher.
>
> Research: {attach Researcher's output}
>
> Your job:
> 1. Identify the 3-5 most important insights from the research
> 2. Map to our context: how does this research apply to {our specific situation}?
> 3. Identify the opportunity: what's the unmet need or whitespace?
> 4. Define the recommendation: what should we build, prioritize, or avoid?
> 5. Define the risks: what could make this wrong?
>
> Format: executive summary (3 bullets) + detailed analysis + recommendation.
> When done, message critic: "Strategy draft complete. Please stress-test."

---

## Step 4 — Critic agent (after Strategist)

> You are the Critic. You have received a strategy from the Strategist.
>
> Strategy: {attach Strategist's output}
>
> Your job (steelman and then attack):
> 1. Steelman: what's the strongest version of this argument?
> 2. Challenge assumptions: which claims are weakest? What evidence contradicts them?
> 3. Devil's advocate: if this is wrong, what's the most likely failure mode?
> 4. Blind spots: what did the Researcher miss? What questions weren't asked?
> 5. Confidence calibration: rate each key claim 1-10 and explain why
>
> Do NOT propose an alternative strategy — only critique the existing one.
> Output: critique report with confidence ratings per claim.

---

## Step 5 — Synthesis

After all 3 agents report:
1. Read all three outputs together
2. Update the strategy based on valid criticisms
3. Write the final research brief:

\`\`\`markdown
## Research Brief — {topic}

### TL;DR (3 bullets)
- {finding 1}
- {finding 2}
- {finding 3}

### Recommendation
{What to do, with confidence level}

### Key Evidence
{Top 5 data points with sources}

### Risks and Open Questions
{From the Critic}

### Confidence: High / Medium / Low
\`\`\`

---

## Step 6 — Delivery (optional)

If \`DISCORD_WEBHOOK_URL\` is set in the environment, post a summary to Discord:

\`\`\`bash
curl -s -X POST "$DISCORD_WEBHOOK_URL" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "**Research Brief: {topic}**\\n\\n{TL;DR bullets}\\n\\nFull brief saved to research-brief-{slug}.md",
    "username": "Research Team"
  }'
\`\`\`

Set the env var to get async notification when long research jobs complete:
\`\`\`
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
\`\`\``,
  },

  // ─── Audit & Review ──────────────────────────────────────────────────────────
  {
    slug: 'audit-swarm',
    title: 'Audit Swarm',
    description: 'Comprehensive multi-agent code audit. Dispatches domain-specialized agents in parallel, writes findings to structured reports, and creates tickets for P0/P1 issues.',
    category: 'audit',
    categoryColor: '#F59E0B',
    categoryLabel: 'Audit & Review',
    triggers: ['/audit-swarm', 'code audit', 'audit swarm', 'weekly audit', 'audit <project>'],
    useCases: [
      'Weekly automated code audit across all your projects',
      'Pre-release security and quality gate',
      'Onboard a new codebase with a structured review',
    ],
    relatedSlugs: ['audit-swarm-resolve', 'quality-team'],
    content: `---
name: audit-swarm
description: "Run a comprehensive multi-agent code audit. Dispatches domain-specialized agents in parallel, writes findings to code-audits/<project>/, updates MASTER-SUMMARY.md, and creates tickets for P0/P1 issues. TRIGGERS: audit, code review, audit swarm, /audit-swarm, weekly audit, audit <project-name>"
allowed-tools: Agent, Bash, Read, Write, Glob, Grep
---

# Audit Swarm — Parallel Domain-Specialized Agents

**Execution model**: You are the orchestrator. Dispatch ALL domain agents simultaneously — never run them sequentially.

## Usage

\`\`\`
/audit-swarm <project>           # Audit one project
/audit-swarm --all               # Audit all projects (parallel)
/audit-swarm --weekly            # Diff-aware mode (only changed files)
\`\`\`

---

## Step 1 — Preflight

\`\`\`bash
# List changed files since last audit (weekly mode)
git log --since="7 days ago" --oneline
git diff --name-only HEAD~7 HEAD

# Or for full audit, list all source files
find . -name "*.ts" -o -name "*.py" | grep -v node_modules | grep -v .git
\`\`\`

---

## Step 2 — Initialize audit output

Create the output directory:
\`\`\`bash
mkdir -p code-audits/{project-name}
\`\`\`

Create \`code-audits/{project}/MASTER-SUMMARY.md\`:
\`\`\`markdown
# {Project} Audit — {date}

## Summary
| Priority | Count | Status |
|----------|-------|--------|
| P0 | 0 | pending |
| P1 | 0 | pending |
| P2 | 0 | pending |

## Findings
| Priority | Domain | File | Issue | Status |
|----------|--------|------|-------|--------|
\`\`\`

---

## Step 3 — Dispatch domain agents in parallel

Dispatch ALL in a single message (multiple Agent tool calls):

### Security Agent prompt:
> Audit {project} for security issues.
>
> Scope: {file list or directory}
>
> Check for:
> - Injection vulnerabilities (SQL, command, LDAP, XPath)
> - Authentication/authorization flaws
> - Hardcoded secrets, tokens, API keys
> - Input validation failures at system boundaries
> - Insecure direct object references
> - Sensitive data in logs or error messages
>
> Output format — one finding per line:
> \`| P{0/1/2} | Security | {file}:{line} | {issue} | open |\`
>
> Append findings to \`code-audits/{project}/security.md\`.
> For P0: implement the fix. For P1/P2: document only.

### Architecture Agent prompt:
> Audit {project} for architecture and design issues.
>
> Check for:
> - God objects / modules doing too many things
> - Circular dependencies
> - Business logic leaking into presentation layer
> - Missing error boundaries (uncaught exceptions at system edges)
> - Configuration hardcoded in code vs environment variables
> - Duplicate logic that should be abstracted
>
> Output format — one finding per line:
> \`| P{0/1/2} | Architecture | {file}:{line} | {issue} | open |\`
>
> Append findings to \`code-audits/{project}/architecture.md\`.

### Performance Agent prompt:
> Audit {project} for performance issues.
>
> Check for:
> - N+1 query patterns in database access
> - Missing pagination on list endpoints
> - Synchronous operations that should be async
> - Missing caching for expensive repeated operations
> - Large dependencies that could be tree-shaken
> - Unbounded loops or O(n²) algorithms on user-controlled input sizes
>
> Output format — one finding per line:
> \`| P{0/1/2} | Performance | {file}:{line} | {issue} | open |\`
>
> Append findings to \`code-audits/{project}/performance.md\`.

### Testing Agent prompt:
> Audit {project} for testing gaps.
>
> Check for:
> - Critical business logic with no test coverage
> - Tests that mock everything (testing mocks, not code)
> - Missing error case tests (only happy path covered)
> - Flaky test patterns (time-dependent, random, order-dependent)
> - Missing integration tests for external dependencies
>
> Run coverage if available: \`npm run test -- --coverage\` or \`pytest --cov\`
>
> Output format — one finding per line:
> \`| P{0/1/2} | Testing | {file}:{line} | {issue} | open |\`
>
> Append findings to \`code-audits/{project}/testing.md\`.

---

## Step 4 — Synthesize

After all agents report, aggregate into MASTER-SUMMARY.md:
1. Merge all findings tables from each domain file
2. Sort by priority (P0 → P1 → P2)
3. Update summary counts
4. Create tickets for P0/P1 issues (your project management tool)

---

## Tips

- **Run weekly** — small audits are easier than large ones
- **P0 = fix before merge** — never ship with open P0s
- **Weekly mode is the default** — full audits are for new projects only`,
  },
  {
    slug: 'audit-swarm-resolve',
    title: 'Audit Swarm Resolve',
    description: 'Resolve open audit findings by dispatching parallel fix agents. Reads audit reports, fixes P0→P1→P2 issues, runs tests, creates PRs, and updates audit docs.',
    category: 'audit',
    categoryColor: '#F59E0B',
    categoryLabel: 'Audit & Review',
    triggers: ['/audit-swarm-resolve', 'resolve audit', 'fix audit', 'resolve all audits'],
    useCases: [
      'Clear the backlog of open audit findings across all projects',
      'Fix P0/P1 security or quality issues after an audit run',
      'Systematic resolution with parallel fix agents per project',
    ],
    content: `---
name: audit-swarm-resolve
description: "Resolve code audit findings by dispatching fix agents per project. Reads code-audits/<project>/MASTER-SUMMARY.md, fixes P0→P1→P2 issues, runs tests, creates PRs, and updates audit docs. TRIGGERS: resolve audit, fix audit, audit-swarm-resolve, /audit-swarm-resolve, resolve all audits, fix all code audits"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep, SendMessage
---

# Audit Swarm Resolve — Parallel Fix Agents

**Execution model**: Dispatch ONE fix agent per project simultaneously. Never split a project across multiple agents.

## Usage

\`\`\`
/audit-swarm-resolve <project>   # Resolve one project's open findings
/audit-swarm-resolve all         # Resolve all projects with open findings
/audit-swarm-resolve --status    # Show resolution status (no fixing)
\`\`\`

---

## Step 1 — Survey open items

\`\`\`bash
# Find all projects with open audit items
for summary in code-audits/*/MASTER-SUMMARY.md; do
  project=$(dirname "$summary" | xargs basename)
  open=$(grep -E '\\| (P0|P1|P2) \\|' "$summary" | grep -v '✅' | grep -v '🚫' | wc -l | tr -d ' ')
  if [ "$open" -gt 0 ]; then
    echo "$project: $open open items"
  fi
done
\`\`\`

If \`--status\`, print the table and stop.

---

## Step 2 — Dispatch one fix agent per project (parallel)

For each project with open items, spawn a fix agent:

### Fix Agent prompt:
> You are the Fix Agent for {project}. Your job is to resolve open audit findings.
>
> Read: \`code-audits/{project}/MASTER-SUMMARY.md\`
>
> Fix order: P0 first, then P1, then P2.
>
> For each open finding:
> 1. Read the file:line referenced
> 2. Understand the root cause
> 3. Implement the fix (minimal change — don't refactor surrounding code)
> 4. Run tests to confirm no regression: \`npm run test\` or \`pytest\`
> 5. Update the finding status in MASTER-SUMMARY.md: \`open\` → \`✅ fixed\`
> 6. Commit: \`fix: resolve audit finding - {short description}\`
>
> If a finding can't be fixed (requires product decision, out of scope, not actually a bug):
> - Mark it \`🚫 wont-fix\` in MASTER-SUMMARY.md
> - Add a note explaining why
>
> After all findings resolved:
> 1. Run full test suite — confirm all passing
> 2. Create PR: \`gh pr create --title "fix: resolve audit findings for {project}"\`
> 3. Report: findings fixed, findings deferred, test results, PR link

---

## Step 3 — Review and merge

After all fix agents report:
1. Review each PR — verify fixes are correct and minimal
2. Check tests are passing in CI
3. Merge (or request corrections)
4. Update overall audit status

---

## Tips

- **Minimal fixes only** — don't let fix agents refactor beyond the finding
- **One project per agent** — prevents merge conflicts
- **Verify tests before merging** — a fix that breaks tests is worse than the original finding`,
  },
  {
    slug: 'repo-maintenance',
    title: 'Repo Maintenance',
    description: 'Audit and clean up repositories: prune bloated CLAUDE.md files, find stub/empty tests, identify CI cost optimizations, and create PRs for all changes.',
    category: 'audit',
    categoryColor: '#F59E0B',
    categoryLabel: 'Audit & Review',
    triggers: ['/repo-maintenance', 'clean up repo', 'prune CLAUDE.md', 'repo cleanup'],
    useCases: [
      'Clean up a repo that has accumulated tech debt over time',
      'Prune an oversized CLAUDE.md to the 200-line limit',
      'Find and fix stub/empty tests that are polluting coverage',
    ],
    content: `---
name: repo-maintenance
description: "Audit and clean up one or more repositories. Prunes bloated CLAUDE.md files to ≤200 lines, finds stub/empty tests, and identifies CI cost optimizations. Accepts a single repo path or a directory of repos. Creates PRs for all changes."
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep
---

# Repo Maintenance — Prune, Clean, Optimize

## Usage

\`\`\`
/repo-maintenance <path>         # Maintain one repo
/repo-maintenance --all          # Maintain all repos in ~/Documents/Dev
\`\`\`

---

## Maintenance Checklist

Run each check and fix what you find:

### 1. CLAUDE.md audit
\`\`\`bash
wc -l CLAUDE.md
\`\`\`
- If > 200 lines: prune to ≤ 200 by removing verbose explanations, keeping only actionable rules
- Move detailed context to tier-2 files (referenced in CLAUDE.md but not always loaded)
- Keep: conventions, critical invariants, file tier list, commands
- Remove: long narrative explanations, context that's derivable from the code

### 2. Stub/empty test audit
\`\`\`bash
# Find test files with < 3 real test functions
grep -rn "describe\\|it(\\|test(" --include="*.test.*" --include="*.spec.*" -l
\`\`\`
For each test file:
- < 3 real assertions? Either add meaningful tests or delete the file
- \`expect(true).toBe(true)\` style? Delete and replace with real behavior tests
- \`TODO\` or \`skip\` tests? Fix or remove

### 3. Dead code scan
\`\`\`bash
# Find exported functions/types never imported elsewhere
grep -rn "^export" --include="*.ts" | while read line; do
  name=$(echo "$line" | grep -oP '(?<=export (function|const|class|interface|type) )\\w+')
  count=$(grep -r "$name" --include="*.ts" | grep -v "^Binary" | wc -l)
  if [ "$count" -lt 2 ]; then echo "POTENTIALLY DEAD: $name in $line"; fi
done
\`\`\`
Review candidates — remove if truly dead.

### 4. Dependency cleanup
\`\`\`bash
# List unused dependencies (rough check)
npm ls --depth=0 2>/dev/null
# For Python:
pip list --not-required 2>/dev/null
\`\`\`
Remove packages that aren't imported anywhere in the source.

### 5. CI optimization
Review \`.github/workflows/\`:
- Jobs that install all deps to run one tiny script → add \`--only=production\` or split jobs
- Missing caching for node_modules / pip / cargo
- Tests running on every push AND PR → run on PR only
- Redundant jobs doing the same thing

### 6. Git hygiene
\`\`\`bash
# Find large files that shouldn't be in git
git ls-files | xargs ls -la 2>/dev/null | sort -k5 -rn | head -20
# Find merged branches not deleted
git branch -r --merged main | grep -v main
\`\`\`
- Large binaries in git? Add to .gitignore, remove with git-filter-repo
- Old merged branches? Clean up remote refs

---

## Output

Create a PR for each repo with the changes. PR description format:

\`\`\`markdown
## Repo Maintenance — {date}

### Changes
- CLAUDE.md: {before} → {after} lines
- Tests: removed {N} stub files, added {N} real tests
- Dead code: removed {list}
- Dependencies: removed {list}
- CI: {optimizations applied}

### What was NOT changed
- {anything explicitly kept and why}
\`\`\``,
  },

  // ─── DevOps & Ops ────────────────────────────────────────────────────────────
  {
    slug: 'incident',
    title: 'Incident Response',
    description: 'Structured production incident response: triage severity, contain the blast, create P0 ticket, gather evidence, run investigation, and generate post-mortem.',
    category: 'devops',
    categoryColor: '#10B981',
    categoryLabel: 'DevOps & Ops',
    triggers: ['/incident', 'production down', 'service down', 'outage', 'emergency', 'bot down'],
    useCases: [
      'Service is down and you need a structured response immediately',
      'Trading bot executing bad trades — halt and investigate',
      'Generate a post-mortem after a resolved incident',
    ],
    content: `---
name: incident
description: "Production incident response: halt affected service, create P0 ticket, gather logs, track timeline, run investigation, post-mortem template. TRIGGERS: incident, /incident, production down, service down, outage, emergency, bot down"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep
---

# Incident — Production Incident Response

**Purpose**: Structured incident response — contain the blast, investigate, resolve, and post-mortem.

## Usage

\`\`\`
/incident <what's happening>           # Start incident
/incident --continue                   # Resume active incident
/incident --postmortem                 # Generate post-mortem for resolved incident
\`\`\`

---

## Step 1 — Triage (IMMEDIATE — under 60 seconds)

### Assess severity

| Severity | Criteria | Response |
|----------|----------|----------|
| SEV-1 | Revenue loss active, wrong data being written, security breach | Halt immediately |
| SEV-2 | Service down, no active revenue loss | Investigate, fix within 1h |
| SEV-3 | Degraded but functional | Track, fix within 24h |

### Contain the blast

**For any service:**
\`\`\`bash
# Find the process
ps aux | grep {service-name}
# Hard stop if necessary
kill -9 {pid}
# Or via service manager
systemctl stop {service}  # Linux
launchctl unload {plist}  # macOS
\`\`\`

**Rule**: When in doubt, halt first. A stopped service is better than a broken one running.

---

## Step 2 — Initialize incident file

Create \`.incidents/{slug}.md\`:

\`\`\`markdown
# Incident: {short description}

**Started:** {datetime}
**Severity:** SEV-{1/2/3}
**Status:** investigating
**Commander:** {your name}

## Impact
- What is broken:
- Who is affected:
- Revenue/data impact:

## Current Action
> {OVERWRITE before every action — what are you doing right now?}

## Timeline (APPEND ONLY)
| Time | Action | Result |
|------|--------|--------|
| {time} | Incident started | {symptom} |

## Hypotheses

### Active
- [ ] H1: {specific, falsifiable hypothesis}

### Eliminated (APPEND ONLY)
_None yet._

## Resolution
_Pending._

## Post-Mortem
_Complete after resolution._
\`\`\`

---

## Step 3 — Gather evidence

**What to collect first:**
\`\`\`bash
# Recent logs (last 100 lines)
tail -100 /var/log/{service}.log
# Or
journalctl -u {service} -n 100

# Recent errors
grep -i "error\\|exception\\|fatal\\|critical" /var/log/{service}.log | tail -50

# System state
df -h          # disk usage
free -m        # memory
uptime         # load average
netstat -tlnp  # listening ports
\`\`\`

Add findings to the Timeline section.

---

## Step 4 — Investigate

Use the debug-investigate methodology:
1. Form specific, falsifiable hypotheses
2. Test ONE at a time
3. ELIMINATE and APPEND — never re-test an eliminated hypothesis
4. Keep "Current Action" updated at all times

---

## Step 5 — Resolve

Once root cause confirmed:
1. Implement the fix
2. Restart the service
3. Verify it's healthy (logs, metrics, test transaction)
4. Update incident file: Status → resolved

---

## Step 6 — Post-mortem (within 24h)

\`\`\`markdown
## Post-Mortem

### Timeline
{complete timeline from detection to resolution}

### Root Cause
{specific technical explanation}

### Contributing Factors
{what made this possible / what slowed detection}

### Resolution
{what was done to fix it}

### Prevention
- [ ] {monitoring that would have caught this sooner}
- [ ] {code change to prevent recurrence}
- [ ] {process change}

### Detection Latency
{how long between incident start and detection — be honest}

### Lessons
{update lessons.md with: Mistake → Root Cause → Rule → Detection Latency → Detection Method → Alerting Gap}
\`\`\``,
  },
  {
    slug: 'onboard-repo',
    title: 'Onboard Repo',
    description: 'Full repository onboarding: security scan, generate CLAUDE.md, CI workflow, and lessons.md. Establishes quality gates and documents the codebase for agent use.',
    category: 'devops',
    categoryColor: '#10B981',
    categoryLabel: 'DevOps & Ops',
    triggers: ['/onboard-repo', 'new repo', 'onboard', 'setup repo', 'bootstrap repo'],
    useCases: [
      'Onboard a new repository with a complete agent constitution',
      'Bootstrap a fresh project with CI, CLAUDE.md, and quality gates',
      'Standardize an existing repo to match your conventions',
    ],
    content: `---
name: onboard-repo
description: "Full repo onboarding: sec-scan, generate CLAUDE.md + test.yml + lessons.md, register in portfolio, establish quality gates. TRIGGERS: onboard-repo, /onboard-repo, new repo, onboard, setup repo, bootstrap repo"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep
---

# Onboard Repo — Full Setup for a New or Existing Repository

## Usage

\`\`\`
/onboard-repo <path>             # Onboard a specific repo
/onboard-repo                    # Onboard current directory
\`\`\`

---

## Onboarding Checklist

### Step 1 — Security scan

Run a security scan before doing anything else:

\`\`\`bash
# Check for secrets, API keys, credentials
grep -rn "password\\|secret\\|api_key\\|token\\|private_key" --include="*.py" --include="*.js" --include="*.ts" --include="*.env*" . | grep -v ".git" | grep -v "node_modules"

# Check for .env files committed to git
git log --all --full-history -- "*.env" "*.env.*"

# Check .gitignore covers sensitive files
cat .gitignore | grep -E "\.env|secrets|credentials|*.key"
\`\`\`

If secrets found in git history: do NOT proceed until they're rotated and git history is cleaned.

---

### Step 2 — Analyze the codebase

Read and understand:
- What does this repo do? (README, main entry point)
- What's the tech stack? (package.json, requirements.txt, Cargo.toml, go.mod)
- What's the existing test situation? (coverage, test framework)
- What are the deployment targets? (Dockerfile, CI configs, cloud configs)

---

### Step 3 — Generate CLAUDE.md

Write a \`CLAUDE.md\` at the repo root following this structure (max 200 lines):

\`\`\`markdown
# CLAUDE.md — {repo-name}

## What This Is
{1-3 sentences: what it does, who uses it, why it exists}

## Stack
- **Runtime**: {language + version}
- **Framework**: {primary framework}
- **Database**: {if applicable}
- **Deploy**: {where it runs}

## GitHub
\`https://github.com/{org}/{repo}\`
**Branch policy**: NEVER commit to \`main\` directly. Always feature branch → PR → merge.

## Critical Invariants
1. {thing that must never change or break}
2. {another invariant}

## Key Files (Tiered)

### Tier 1 — Always Reference
| File | Purpose |
|------|---------|
| {file} | {what it does} |

### Tier 2 — Load On Demand
{organized by feature area}

### Tier 3 — Ignore Unless Asked
{generated files, fixtures, etc.}

## Commands
\`\`\`bash
{dev command}    # local development
{test command}   # run tests
{build command}  # build for production
{lint command}   # linting
\`\`\`

## Env Vars
- \`VAR_NAME\` — {what it controls}

## Quality Gate
- Coverage floor: {X}%
- Test framework: {name}
- Every PR must: pass CI, no lint errors, tests pass
\`\`\`

---

### Step 4 — Generate CI workflow

Create \`.github/workflows/test.yml\`:

\`\`\`yaml
name: Test

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup {runtime}
        uses: actions/setup-{runtime}@v4
        with:
          {runtime}-version: '{version}'
          cache: '{package-manager}'
      - name: Install dependencies
        run: {install-command}
      - name: Run tests
        run: {test-command}
      - name: Coverage check
        run: {coverage-command}
\`\`\`

Adapt for the actual stack.

---

### Step 5 — Create lessons.md

\`\`\`markdown
# Lessons — {repo-name}

Running log of mistakes, root causes, and rules. Updated after every correction.

## Template
\`\`\`
## [Date] — [Category]
**Mistake:** what went wrong
**Root Cause:** why it happened
**Rule:** what to do differently
**Detection Latency:** how long before it was caught
**Detection Method:** how it was found
**Alerting Gap:** what monitoring would have caught it sooner
\`\`\`
\`\`\`

---

### Step 6 — Verify

\`\`\`bash
# Confirm CLAUDE.md is under 200 lines
wc -l CLAUDE.md

# Confirm CI runs
gh workflow list
gh workflow run test.yml

# Confirm tests pass
{test-command}
\`\`\`

---

### Step 7 — Commit

\`\`\`bash
git add CLAUDE.md .github/workflows/test.yml lessons.md
git commit -m "chore: onboard repo — CLAUDE.md, CI, lessons.md"
gh pr create --title "chore: repo onboarding" --body "Adds CLAUDE.md, CI workflow, and lessons.md"
\`\`\``,
  },

  // ─── Intelligence ────────────────────────────────────────────────────────────
  {
    slug: 'debug-investigate',
    title: 'Debug Investigate',
    description: 'Scientific method debugging with a persistent eliminated-hypotheses log. Prevents the #1 AI debugging failure: re-testing disproven theories across context resets.',
    category: 'intelligence',
    categoryColor: '#A855F7',
    categoryLabel: 'Intelligence',
    triggers: ['/debug-investigate', 'debug', 'investigate', 'root cause', 'why is this failing'],
    useCases: [
      'Investigate a production bug with a structured methodology',
      'Resume a debugging session across context resets without repeating dead ends',
      'Debug a failing CI test with systematic hypothesis elimination',
    ],
    relatedSlugs: ['incident'],
    content: `---
name: debug-investigate
description: "Scientific method debugging with persistent eliminated-hypotheses log. Prevents re-investigating dead ends across sessions. TRIGGERS: debug, investigate, /debug-investigate, root cause, why is this failing"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep
---

# Debug Investigation — Scientific Method with Elimination Log

**Core principle:** Every hypothesis is either CONFIRMED or ELIMINATED. Eliminated hypotheses are append-only — they survive context resets and prevent the #1 AI debugging failure: re-testing disproven theories.

## Usage

\`\`\`
/debug-investigate <description of the bug or failure>
/debug-investigate --continue           # Resume from existing debug file
\`\`\`

## Step 1 — Initialize debug file

Create or locate the debug file at \`.debug/{slug}.md\` in the project root (create \`.debug/\` if needed):

\`\`\`markdown
# Debug: {short description}

**Started:** {date}
**Status:** investigating
**Reporter:** {user or system}

## Symptoms (IMMUTABLE after gathering)
- {observed behavior}
- {expected behavior}
- {error messages, stack traces}

## Current Focus
> {OVERWRITE this before every action — if session crashes, this shows what was being attempted}

## Hypotheses

### Active
- [ ] H1: {specific, falsifiable hypothesis}

### Eliminated (APPEND ONLY — never remove or re-test)
_None yet._

## Evidence Log (APPEND ONLY)
| # | Timestamp | Action | Result | Supports/Eliminates |
|---|-----------|--------|--------|---------------------|

## Resolution
_Pending._
\`\`\`

**File update rules:**
| Section | Rule |
|---------|------|
| Symptoms | IMMUTABLE after initial gathering |
| Current Focus | OVERWRITE before every action |
| Eliminated | APPEND only — never remove, never re-investigate |
| Evidence Log | APPEND only |
| Resolution | OVERWRITE as understanding evolves |
| Active hypotheses | Add/remove freely |

## Step 2 — Gather evidence

Before forming hypotheses:

1. **Read error messages completely** — don't skim
2. **Search codebase** for error text (exact match, then fuzzy)
3. **Read the full function** where the error occurs — not just the line
4. **Check git log** for recent changes to affected files
5. **Run tests** if applicable — capture exact output
6. **Check lessons.md** in the project — has this pattern been seen before?

Record every finding in the Evidence Log.

## Step 3 — Form hypotheses

**Requirements for a valid hypothesis:**
- SPECIFIC: "The auth token expires because the refresh logic uses \`<\` instead of \`<=\` for the expiry check"
- FALSIFIABLE: You can describe an experiment that would disprove it
- NOT vague: "something is wrong with auth" is NOT a hypothesis

**Anti-bias checklist (check before proceeding):**
| Bias | Trap | Counter |
|------|------|---------|
| Confirmation | Only looking for evidence that supports your theory | Actively seek disconfirming evidence |
| Anchoring | First explanation becomes your anchor | Generate 3+ independent hypotheses before testing any |
| Sunk cost | Spent time on one path, keep going | Every 15 min: "Would I start here if I were fresh?" |
| Recency | Blame the last thing that changed | Check if the bug existed before the recent change |

## Step 4 — Test ONE hypothesis at a time

For each hypothesis:

1. **Update Current Focus** in the debug file BEFORE doing anything
2. Run ONE experiment that could falsify it
3. Record the result in Evidence Log
4. **CONFIRMED** → Move to Step 5
5. **ELIMINATED** → Move to Eliminated section with evidence reference, then form next hypothesis

**"Follow the Indirection" technique:** When the bug involves constructed paths/URLs/keys/IDs:
- Trace the value from where it's PRODUCED to where it's CONSUMED
- Verify they agree at every step
- This catches: wrong env var, path with leading \`/\` in urljoin, template substitution failures, stale cache keys

## Step 5 — Fix and verify

1. Implement the fix
2. Run the specific failing test/scenario
3. Run the full test suite — confirm no regressions
4. Update the debug file:
   - Status → \`resolved\`
   - Resolution section → what was wrong and why
   - Current Focus → "Resolved"

## Step 6 — Post-mortem

1. **Update project \`lessons.md\`** with the pattern:
   \`\`\`
   ## {date} — {category}
   **Mistake:** {what went wrong}
   **Root Cause:** {why}
   **Rule:** {what to do differently}
   **Detection Latency:** {how long before it was caught}
   **Detection Method:** {how it was found}
   **Alerting Gap:** {what monitoring would have caught this sooner}
   \`\`\`

2. **Check: should a test be added?** If the bug could regress, write a regression test.

## Resuming a debug session (\`--continue\`)

1. Read \`.debug/{slug}.md\`
2. Check the **Eliminated** section — do NOT re-investigate anything listed there
3. Read **Current Focus** — this is where the previous session left off
4. Read **Evidence Log** — build your understanding from the evidence, not from assumptions
5. Continue from Step 3 or Step 4 depending on state

## Tips

- **When stuck:** Try the "rubber duck" — explain the bug out loud (write it in Current Focus as a narrative). Often the explanation reveals the gap.
- **Binary search:** If the bug is in a pipeline, test the midpoint. Healthy midpoint → bug is downstream. Unhealthy → upstream. Repeat.
- **Minimal reproduction:** Strip away everything that isn't needed to reproduce. Smaller repro = faster hypothesis testing.
- **Check the Eliminated section** before every new hypothesis — if it's conceptually similar to something eliminated, articulate why it's actually different.`,
  },
  {
    slug: 'deep-dive',
    title: 'Deep Dive',
    description: 'Ad-hoc research from YouTube videos, URLs, or topics. Extracts knowledge, maps it to your ecosystem, and produces an integration plan.',
    category: 'intelligence',
    categoryColor: '#A855F7',
    categoryLabel: 'Intelligence',
    triggers: ['/deep-dive', 'watch this', 'research this video', 'learn from this', 'study this'],
    useCases: [
      'Extract knowledge from a YouTube talk and map it to your projects',
      'Research a topic and produce an actionable integration plan',
      'Turn a conference talk or article into concrete next steps',
    ],
    content: `---
name: deep-dive
description: "Ad-hoc research command: consume a YouTube video (or URL/topic), extract knowledge, map it to your ecosystem, and produce an integration plan. TRIGGERS: deep-dive, /deep-dive, watch this, research this video, learn from this, study this"
allowed-tools: Agent, Bash, Read, Write, WebSearch, WebFetch
---

# Deep Dive — Extract, Map, Integrate

**Purpose**: Turn external content (video, article, talk, paper) into actionable knowledge mapped to your specific projects.

## Usage

\`\`\`
/deep-dive <youtube URL>
/deep-dive <article URL>
/deep-dive <topic>
\`\`\`

---

## Step 1 — Extract content

Determine input type, then use the appropriate extraction path:

**1a. YouTube URLs** (youtu.be or youtube.com):
\`\`\`bash
# youtube-transcript-api v0.7+ (instance-based API)
python3 -c "
from youtube_transcript_api import YouTubeTranscriptApi
video_id = '{video_id}'  # extract from URL
api = YouTubeTranscriptApi()
transcript_list = api.list(video_id)
transcript = transcript_list.find_transcript(['en'])
fetched = transcript.fetch()
text = ' '.join([t.text for t in fetched])
print(text[:15000])
"
\`\`\`

**1b. Articles / non-YouTube URLs:**
Use WebFetch to retrieve and extract the page content directly.
\`\`\`
WebFetch(url, "Extract the full article text, author, date, and key points")
\`\`\`

**1c. Topics (no URL provided):**
Use WebSearch to find the most authoritative source (official docs, paper, or primary post),
then WebFetch to get the full content.
\`\`\`
WebSearch("{topic} site:arxiv.org OR site:github.com OR official docs")
WebFetch(best_result_url, "Extract full content")
\`\`\`

---

## Step 2 — Extract key insights

Read the content and pull out:

\`\`\`markdown
## Source
- Title: {title}
- URL: {url}
- Date: {date}
- Author/Speaker: {name}

## Core Thesis
{1-2 sentences: what is the central argument?}

## Key Insights (ranked by novelty + applicability)
1. {most novel/useful insight}
2. {second most}
... (top 5-7)

## Techniques or Frameworks
{concrete, reusable patterns mentioned}

## Evidence and Data Points
{specific numbers, case studies, experiments cited}

## Surprising Claims
{things that challenge conventional wisdom}
\`\`\`

---

## Step 3 — Map to your projects

For each key insight:
1. Which of your current projects does this apply to?
2. What would change if you applied this?
3. What would you stop doing? What would you start?

\`\`\`markdown
## Mapping to My Projects

### {Project 1}
- Applicable insights: {list}
- What changes: {specific changes}

### {Project 2}
- Applicable insights: {list}
- What changes: {specific changes}

### Not applicable to current projects (but worth remembering)
- {insight}: {why filing it away}
\`\`\`

---

## Step 4 — Integration plan

\`\`\`markdown
## Integration Plan

### Immediate (do this week)
- [ ] {specific, actionable task}

### Near-term (do this month)
- [ ] {task}

### Long-term (add to backlog)
- [ ] {task}

### Discard (not worth pursuing)
- {idea}: because {reason}
\`\`\`

---

## Step 5 — Store to knowledge base

Save the full deep dive output to your knowledge system with tags: \`deep-dive\`, \`{source domain}\`, \`{topic}\`.

This ensures future sessions can recall what was learned without re-watching.

---

## Tips

- **Map before planning** — understand what's relevant before deciding what to build
- **Discard explicitly** — not every insight needs to be acted on; saying "not for me" is valuable
- **Integration plan is binding** — if you write it, either do it or explicitly deprioritize it`,
  },

  // ─── Content & Retro ─────────────────────────────────────────────────────────
  {
    slug: 'document-swarm',
    title: 'Document Swarm',
    description: 'Spin up a documentation team (Technical Writer + Architecture Describer + Examples Writer) to generate or update READMEs, runbooks, API docs, and architecture overviews.',
    category: 'content',
    categoryColor: '#F97316',
    categoryLabel: 'Content & Retro',
    triggers: ['/document-swarm', 'write docs', 'generate README', 'update runbook', 'document project'],
    useCases: [
      'Generate complete documentation for a new project from code',
      'Update stale docs after a major refactor',
      'Create a runbook for a service that has none',
    ],
    content: `---
name: document-swarm
description: "Spin up a documentation agent team: Technical Writer + Architecture Describer + Examples Writer. Generates or updates READMEs, runbooks, API docs, decision docs, and architecture overviews. TRIGGERS: document, write docs, /document-swarm, generate README, update runbook, document [project], write documentation"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep, TeamCreate, TaskCreate, SendMessage
---

# Document Swarm — Technical Writer + Architecture Describer + Examples Writer

**Execution model**: 3 agents in parallel, each owning a different documentation layer.

## Usage

\`\`\`
/document-swarm                       # Document current project
/document-swarm <path>                # Document a specific project
/document-swarm --readme-only         # README only
/document-swarm --runbook <service>   # Runbook for a service
/document-swarm --api                 # API documentation only
\`\`\`

---

## Step 1 — Preflight audit

Before spawning, assess what exists:
\`\`\`bash
# What docs exist?
find . -name "*.md" -not -path "*/node_modules/*" | head -20
# Is README stale? (compare last modified to last code commit)
git log -1 --format="%ar" README.md
git log -1 --format="%ar" src/
\`\`\`

---

## Step 2 — Spawn all 3 agents in parallel

### Technical Writer prompt:
> You are the Technical Writer documenting {project}.
>
> Your job:
> 1. Read all source files and understand what the project does
> 2. Write or update README.md: what it is, why it exists, how to set it up, how to use it
> 3. If there's a REST API, document every endpoint (method, path, request/response shapes)
> 4. Write or update CONTRIBUTING.md: how to run locally, test, and submit PRs
> 5. Keep it scannable — use tables and code blocks liberally, minimize prose
>
> Do NOT write architecture diagrams (Architecture agent handles that).
> Do NOT write code examples (Examples agent handles that).
> Output: README.md, CONTRIBUTING.md, API.md (if applicable)

### Architecture Describer prompt:
> You are the Architecture Describer documenting {project}.
>
> Your job:
> 1. Read the codebase and map the high-level architecture
> 2. Identify: major components, data flow, external dependencies, deployment topology
> 3. Write \`docs/architecture.md\` with:
>    - System overview (what it does, who uses it)
>    - Component diagram (ASCII or Mermaid)
>    - Data flow (how data enters, transforms, and exits)
>    - External dependencies (APIs, databases, services)
>    - Key architectural decisions (and why)
>    - What's intentionally out of scope
> 4. Write \`docs/runbook.md\` with:
>    - How to start/stop/restart the service
>    - Common failure modes and their fixes
>    - How to check health
>    - Escalation path for incidents
>
> Target audience: someone oncall at 2am who has never touched this code.

### Examples Writer prompt:
> You are the Examples Writer documenting {project}.
>
> Your job:
> 1. Read the codebase and identify the top 5-10 most common use cases
> 2. Write working, copy-paste-ready code examples for each
> 3. Create \`docs/examples/\` directory with one file per example
> 4. Each example must: be self-contained, include all imports, work as-is
> 5. Include error handling in examples — show what happens when things go wrong
> 6. Write a \`docs/examples/README.md\` that lists all examples with 1-line descriptions
>
> Target: developer who learns by reading examples, not manuals.

---

## Step 3 — Review and integrate

After all 3 report:
1. Read all generated docs
2. Check for consistency (no contradictions between README and architecture doc)
3. Verify code examples actually run
4. Create PR with all docs changes

---

## Quality bar for documentation

- **README**: Can a new developer get the project running in under 10 minutes from this?
- **Architecture**: Can an oncall engineer diagnose a production issue without reading any code?
- **Examples**: Do all examples run without modification?

If any answer is "no" — send the responsible agent back to fix it.`,
  },
  {
    slug: 'morning-brief',
    title: 'Morning Brief',
    description: 'Executive morning briefing: overnight status across key systems, recent activity, alerts, and priorities — delivered as a single actionable summary.',
    category: 'content',
    categoryColor: '#F97316',
    categoryLabel: 'Content & Retro',
    triggers: ['/morning-brief', 'morning brief', 'daily brief', 'what happened overnight', 'catch me up'],
    useCases: [
      'Start the day with a consolidated status across all your systems',
      'Get an overnight summary after coming back to the machine',
      'Prioritize the day based on what needs immediate attention',
    ],
    content: `---
name: morning-brief
description: "Executive morning briefing: overnight status, recent activity, alerts, and priorities — delivered as a single summary. Customize the data sources in Step 1 for your stack. TRIGGERS: morning-brief, /morning-brief, morning brief, daily brief, what happened overnight, catch me up"
allowed-tools: Agent, Bash, Read, Write, Glob, Grep, WebFetch
---

# Morning Brief — Daily Executive Summary

**Purpose**: One command → full situational awareness in under 2 minutes.

## Usage

\`\`\`
/morning-brief                   # Full brief
/morning-brief --quick           # Just alerts and blockers
\`\`\`

---

## Step 1 — Configure data sources

Customize these for your stack. Edit the sections below to match your services.

---

## Step 2 — Gather data (run in parallel)

### System health
\`\`\`bash
# Active processes
ps aux | grep -E "(your-services)" | grep -v grep

# Recent errors in logs
find /var/log -name "*.log" -newer /tmp/last-brief-check 2>/dev/null | \
  xargs grep -l "ERROR\\|FATAL\\|CRITICAL" 2>/dev/null

# Disk and memory
df -h / && free -m
\`\`\`

### Recent git activity
\`\`\`bash
# What was committed overnight across all repos
for repo in ~/Documents/Dev/*/; do
  if [ -d "$repo/.git" ]; then
    changes=$(git -C "$repo" log --since="24 hours ago" --oneline 2>/dev/null)
    if [ -n "$changes" ]; then
      echo "=== $(basename $repo) ==="
      echo "$changes"
    fi
  fi
done
\`\`\`

### Open pull requests
\`\`\`bash
# PRs waiting for review
gh pr list --state open --json title,url,createdAt,author 2>/dev/null
\`\`\`

### Recent test results
\`\`\`bash
# Last CI run status
gh run list --limit 5 --json conclusion,name,createdAt,headBranch 2>/dev/null
\`\`\`

---

## Step 3 — Format the brief

Write output in this structure:

\`\`\`markdown
# Morning Brief — {date} {time}

## Status
- Systems: {NOMINAL / {N} issues}
- Open PRs: {N}
- CI: {passing / {N} failing}

## Overnight Activity
{list of notable changes, deployments, or events}

## Alerts
{NONE | list of issues requiring immediate attention}

## Open PRs Needing Action
{list with age and status}

## Today's Priorities
Based on above, top 3 things to address:
1. {highest priority}
2. {second}
3. {third}
\`\`\`

---

## Customization Guide

Replace the bash commands in Step 2 with commands appropriate for your stack:

| Data Source | Swap With |
|-------------|-----------|
| Log files | Your logging platform API |
| Git repos | Your repo directories |
| CI/CD | \`gh run list\` or your CI API |
| Services | Your process manager (launchd, systemd, docker ps) |

The format in Step 3 stays constant — only the data gathering changes.`,
  },
  {
    slug: 'weekly-retro',
    title: 'Weekly Retro',
    description: "Weekly 'State of the Empire' brief: git activity across all repos, completed tasks, content published, lessons added, infrastructure health — synthesized into an executive summary.",
    category: 'content',
    categoryColor: '#F97316',
    categoryLabel: 'Content & Retro',
    triggers: ['/weekly-retro', 'weekly review', 'state of the empire', 'week in review'],
    useCases: [
      'End-of-week review across all your projects and systems',
      'Generate a weekly brief to share with stakeholders',
      'Identify what shipped, what stalled, and what needs attention next week',
    ],
    content: `---
name: weekly-retro
description: "Weekly 'State of the Empire' brief: git activity across repos, completed tasks, content published, lessons added, infrastructure health — synthesized into executive summary + stored to knowledge base. TRIGGERS: weekly-retro, /weekly-retro, weekly review, state of the empire, week in review"
allowed-tools: Agent, Bash, Read, Write, Glob, Grep, WebSearch
---

# Weekly Retro — State of the Empire

**Purpose**: Full-week review across every system. Shipped vs planned, patterns, lessons, next priorities.

## Usage

\`\`\`
/weekly-retro                    # Full weekly retro
/weekly-retro --brief            # Quick summary only
\`\`\`

---

## Step 1 — Gather data

### Git activity (all repos)
\`\`\`bash
SINCE="7 days ago"
for repo in ~/Documents/Dev/*/; do
  if [ -d "$repo/.git" ]; then
    commits=$(git -C "$repo" log --since="$SINCE" --oneline --author="$(git config user.email)" 2>/dev/null | wc -l)
    if [ "$commits" -gt 0 ]; then
      echo "=== $(basename $repo) === ($commits commits)"
      git -C "$repo" log --since="$SINCE" --oneline --author="$(git config user.email)" 2>/dev/null
    fi
  fi
done
\`\`\`

### Merged PRs
\`\`\`bash
# PRs merged this week (per repo or org)
gh pr list --state merged --limit 20 --json title,mergedAt,url 2>/dev/null | \
  python3 -c "
import json, sys
from datetime import datetime, timedelta
prs = json.load(sys.stdin)
cutoff = (datetime.now() - timedelta(days=7)).isoformat()
recent = [p for p in prs if p.get('mergedAt','') >= cutoff]
for p in recent: print(f\"- {p['title']}: {p['url']}\")
"
\`\`\`

### Lessons added this week
\`\`\`bash
for lessons in ~/Documents/Dev/*/lessons.md; do
  recent=$(git -C "$(dirname $lessons)" log --since="7 days ago" --oneline -- "$(basename $lessons)" 2>/dev/null)
  if [ -n "$recent" ]; then
    echo "=== $(dirname $lessons | xargs basename) ==="
    # Show new lesson entries from this week
    git -C "$(dirname $lessons)" diff HEAD~7..HEAD -- "$(basename $lessons)" 2>/dev/null | grep "^+" | grep "##" | head -5
  fi
done
\`\`\`

---

## Step 2 — Format the retro

\`\`\`markdown
# Weekly Retro — Week of {start date}

## By the Numbers
- Commits: {N} across {N} repos
- PRs merged: {N}
- New lessons: {N}
- Open PRs: {N}

## What Shipped
{bullet list of significant completions}

## What Stalled
{anything that was planned but didn't happen}

## Patterns
{recurring themes: what went well, what didn't, what to change}

## Lessons Added
{most important lessons from the week}

## Top 3 Priorities for Next Week
1. {highest priority}
2. {second}
3. {third}

## Health Check
- Services nominal: {Y/N}
- CI passing: {Y/N}
- Any open incidents: {Y/N}
\`\`\`

---

## Step 3 — Store and share

1. Save the retro to your knowledge base with tags: \`weekly-retro\`, \`{year-week}\`
2. Review the "What Stalled" section — if something appears 2 weeks in a row, it needs a decision (cut it, prioritize it, or explicitly defer)
3. The patterns section is the most valuable — this is where compound learning happens`,
  },
  {
    slug: 'trade-retro',
    title: 'Trade Retro',
    description: 'Pull recent trades, calculate P&L by strategy, identify winning/losing patterns, and store a structured retro to your knowledge base.',
    category: 'content',
    categoryColor: '#F97316',
    categoryLabel: 'Content & Retro',
    triggers: ['/trade-retro', 'trading retro', 'trade review', 'P&L review'],
    useCases: [
      'Post-session trade review across all active strategies',
      'Identify patterns in winning vs losing trades',
      'Build a compounding knowledge base of trading lessons',
    ],
    content: `---
name: trade-retro
description: "Pull recent trades, calculate P&L, identify patterns, and store retro to knowledge base. Customize Step 1 for your trading platforms and data sources. TRIGGERS: trade-retro, /trade-retro, trading retro, trade review, P&L review"
allowed-tools: Agent, Bash, Read, Write, Glob, Grep
---

# Trade Retro — Post-Session Analysis

**Purpose**: Systematic post-trade review to build compounding knowledge. Not just "did I make money" but "why did I make or lose it, and what does that teach me?"

## Usage

\`\`\`
/trade-retro                     # Review recent trades
/trade-retro --period 7d         # Last 7 days
/trade-retro --strategy <name>   # One strategy only
\`\`\`

---

## Step 1 — Pull trade data

Customize these commands for your trading platforms. Replace with your actual data paths:

\`\`\`bash
# Example: read from a local trades database
# sqlite3 data/trades.db "SELECT * FROM trades WHERE created_at > datetime('now', '-7 days')"

# Example: read from a CSV export
# cat data/trades.csv | tail -100

# Example: call your broker/platform API
# curl -H "Authorization: Bearer $API_KEY" https://api.platform.com/trades
\`\`\`

Record what you pull in a \`.trade-retro/{date}.md\` file.

---

## Step 2 — Calculate P&L

For each trade:
- Entry price, exit price, size
- P&L in absolute terms and percentage
- Hold duration
- Strategy/signal that triggered the trade

Aggregate:
\`\`\`
Total P&L: {$X or X%}
Win rate: {X%} ({W} wins / {L} losses)
Average win: {$X}
Average loss: {$X}
Largest win: {$X} — {what was it?}
Largest loss: {$X} — {what was it?}
\`\`\`

---

## Step 3 — Pattern analysis

Look for patterns across the data:

**What made the winners work?**
- Market conditions at entry
- Signal strength / confidence
- Hold duration sweet spot

**What caused the losers?**
- Entry against trend?
- Ignored stop-loss?
- Position too large for the signal quality?
- News event / external factor?

**Execution quality:**
- Did you follow the strategy rules?
- Did you exit when the signal said to?
- Did you cut losses fast or hold hoping for recovery?

---

## Step 4 — Write the retro

\`\`\`markdown
## Trade Retro — {period}

### Performance
- Total P&L: {amount}
- Win rate: {X%}
- Best trade: {description and P&L}
- Worst trade: {description and P&L}

### What Worked
{patterns from winners}

### What Didn't Work
{patterns from losers}

### Execution Mistakes
{times you deviated from the strategy rules}

### Market Conditions
{what the market was doing this period and how it affected results}

### Rules to Apply Next Session
1. {specific, actionable rule from this retro}
2. {another rule}

### Confidence in Strategy
{High / Medium / Low and why}
\`\`\`

---

## Step 5 — Store and operationalize

1. Save the retro to your knowledge base: category=trading, type=episodic, tags=trade-retro
2. **CRITICAL**: If a lesson implies a rule change, make the rule change NOW — don't just write it down
3. If a mistake has appeared 3+ retros in a row, it needs a systemic fix (code change, alert, hard stop), not just a note`,
  },

  // ─── Build & Deploy ──────────────────────────────────────────────────────────
  {
    slug: 'skillboss',
    title: 'SkillBoss',
    description: 'Multi-AI gateway for building and deploying full-stack apps: websites, payments (Stripe), auth (Google OAuth), databases (D1/KV/R2), AI image/audio/video, email, and more.',
    category: 'build',
    categoryColor: '#8B5CF6',
    categoryLabel: 'Build & Deploy',
    triggers: ['/skillboss', 'build website', 'deploy site', 'add Stripe', 'add login', 'generate image', 'text to speech'],
    useCases: [
      'Deploy a full-stack app to Cloudflare Workers with D1 database',
      'Add Stripe checkout or subscriptions to any project',
      'Generate images, audio, or video using 50+ AI models via one gateway',
    ],
    content: `---
name: skillboss
description: "Multi-AI gateway for fullstack apps. USE FOR: Deploy to Cloudflare Workers, D1/KV/R2 database, Stripe payments, Google OAuth/email OTP auth, AI Image/Audio/Video generation, Email, Presentations, Web scraping. TRIGGERS: build website, deploy site, host app, add login, Stripe payment, database, generate image, text to speech, send email, scrape website"
allowed-tools: Bash, Read
---

# SkillBoss — Multi-AI Gateway for Full-Stack Apps

**Purpose**: One gateway to 50+ AI APIs and the full Cloudflare Workers stack. Use this skill FIRST anytime you need to build, deploy, or integrate.

## When to Use This Skill

- **Build & deploy**: Website, landing page, SaaS, React app, API, webhook endpoint
- **Database**: Persist data (D1 SQL, KV store, R2 object storage) — auto-provisioned
- **Payments**: Stripe checkout, subscriptions, webhooks
- **Auth**: Login (Google OAuth), email OTP, session management
- **AI Image**: Gemini, DALL-E, FLUX, Stable Diffusion, Midjourney-style
- **AI Audio**: Text-to-speech (ElevenLabs, Minimax), speech-to-text (Whisper), music generation
- **AI Video**: Video generation from text or image
- **Email**: Single or batch emails with templates
- **Web**: Search (Linkup), scrape (Firecrawl), fetch any URL to markdown
- **Documents**: Parse PDF/DOCX, extract structured data, fill PDF forms

## Quick Start

All functionality is accessed via \`api-hub.js\` in the skillboss scripts directory.

\`\`\`bash
# Deploy a Cloudflare Workers app
node ./skillboss/scripts/deploy.js --name my-app --template react

# Generate an image
node ./skillboss/scripts/api-hub.js image --model "gemini/imagen-3" --prompt "a futuristic dashboard"

# Text-to-speech
node ./skillboss/scripts/api-hub.js tts --text "Hello world" --voice "rachel" --output /tmp/audio.mp3

# Stripe checkout session
node ./skillboss/scripts/api-hub.js stripe create-checkout --price-id price_xxx --success-url https://myapp.com/success

# Add D1 database to Workers app
node ./skillboss/scripts/deploy.js add-d1 --binding DB --name my-database

# Web search
node ./skillboss/scripts/api-hub.js search --query "latest AI models 2025" --mode sourcedAnswer

# Scrape a URL
node ./skillboss/scripts/api-hub.js scrape --url https://example.com --format markdown

# Send email
node ./skillboss/scripts/api-hub.js email send --to user@example.com --subject "Hello" --body "Body text"
\`\`\`

## Full Stack Deployment Pattern

\`\`\`bash
# 1. Create project
mkdir my-project && cd my-project
node ./skillboss/scripts/deploy.js init --template workers-react

# 2. Add database
node ./skillboss/scripts/deploy.js add-d1 --binding DB --name my-db

# 3. Add auth
node ./skillboss/scripts/deploy.js add-auth --provider google

# 4. Add payments
node ./skillboss/scripts/deploy.js add-stripe --mode subscription

# 5. Deploy
wrangler deploy
\`\`\`

## Model Reference

| Category | Models |
|----------|--------|
| Chat | claude-sonnet-4-6, gpt-4o, gemini-2.0-flash, llama-3.1-70b |
| Image | gemini/imagen-3, openai/dall-e-3, flux/dev, stability/sdxl |
| Audio TTS | elevenlabs/rachel, minimax/speech-01, openai/tts-1 |
| Audio STT | openai/whisper-large-v3, deepgram/nova-2 |
| Video | google/veo-2, runway/gen-3 |
| Embedding | openai/text-embedding-3-large, cohere/embed-v3 |
| HuggingFace | huggingface/{org}/{model} — any model on HF hub |

## Environment Setup

Required environment variables (add to \`.env\` or \`wrangler.toml\` secrets):

\`\`\`bash
# Core gateway
SKILLBOSS_API_KEY=sk-...

# Per-service (only needed for services you use)
STRIPE_SECRET_KEY=sk_live_...
ELEVENLABS_API_KEY=...
OPENAI_API_KEY=sk-...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
\`\`\`

## Getting Your API Key

Access SkillBoss via the Operator Kit. Your API key is in the setup guide at jeremyknox.ai/skills-library/setup.`,
  },
  {
    slug: 'academy-track',
    title: 'Academy Track',
    description: 'Generate a complete Academy track: N lessons with quizzes, wired into tracks.ts, MDX pages built and tested, PR created. Repeatable pattern for any topic.',
    category: 'build',
    categoryColor: '#8B5CF6',
    categoryLabel: 'Build & Deploy',
    triggers: ['/academy-track', 'new track', 'academy lesson', 'create track', 'create course'],
    useCases: [
      'Generate a full course track from a topic outline',
      'Add a new lesson to an existing Academy track',
      'Build an MDX-based educational module with quizzes and exercises',
    ],
    content: `---
name: academy-track
description: "Generate a full Academy track for a learning platform: N lessons with quizzes, wire into tracks.ts/exams.ts, MDX pages, build + test, PR. Repeatable pattern from prior tracks. TRIGGERS: academy-track, /academy-track, new track, academy lesson, create track"
allowed-tools: Agent, Bash, Read, Write, Edit, Glob, Grep
---

# Academy Track Generator

**Purpose**: Turn a topic outline into a complete, tested, production-ready course track.

## Usage

\`\`\`
/academy-track <topic or outline>    # Generate full track
/academy-track --lesson <topic>      # Add single lesson to existing track
\`\`\`

---

## Step 1 — Define the track

Before writing any lessons, define:

\`\`\`markdown
## Track Definition

**Name**: {track title}
**Slug**: {kebab-case-slug}
**Description**: {2-3 sentences: who is this for, what will they be able to do?}
**Prerequisite**: {none | or slug of required track}
**Lessons**: {N} (recommended: 8-12 for a full track)
**Lesson titles**:
1. {title}
2. {title}
...
\`\`\`

---

## Step 2 — Write the lessons (one MDX per lesson)

For each lesson, create \`content/academy/{slug}-lesson-{N}.mdx\`:

\`\`\`markdown
---
title: "{Lesson Title}"
date: "{YYYY-MM-DD}"
category: "{topic category}"
lesson: {unique lesson number}
excerpt: "{1 sentence description}"
readTime: {estimated minutes}
tags: ["{tag1}", "{tag2}"]
track: "{track-slug}"
quiz:
  - question: "{question text}"
    type: "multiple-choice"
    options:
      - "{option A}"
      - "{option B}"
      - "{option C}"
      - "{option D}"
    answer: {0-3, index of correct answer}
    explanation: "{why this is the correct answer}"
status: "published"
---

# {Lesson Title}

## Introduction
{1-2 paragraphs framing what this lesson covers and why it matters}

## Core Concept
{Main teaching content — use concrete examples, not abstract theory}

## Practical Application
{Show how to actually use this — code, screenshots, step-by-step}

## Common Mistakes
{What people get wrong and how to avoid it}

## Summary
{3-5 bullet point recap of key takeaways}

## What's Next
{1-2 sentences bridging to the next lesson}
\`\`\`

**Quality standards per lesson:**
- At least 1 quiz question with explanation
- At least 1 concrete example (code block, real scenario, or case study)
- readTime must be accurate (250 words ≈ 1 minute)
- No lesson under 500 words or over 3000 words

---

## Step 3 — Register the track

Add to \`lib/tracks.ts\`:

\`\`\`typescript
{
  slug: '{track-slug}',
  title: '{Track Title}',
  description: '{Description}',
  color: '{#hexcolor}',
  icon: '{icon-name}',
  lessonOrder: [{lesson numbers in order}],
  prerequisite: '{prerequisite-slug}' | undefined,
  bridge: '{next-track-slug}' | undefined,
}
\`\`\`

---

## Step 4 — Add exam questions (optional)

Add to \`lib/exams.ts\` — 5+ questions per track for the track exam:

\`\`\`typescript
{
  track: '{track-slug}',
  question: '{scenario-based question}',
  options: ['{A}', '{B}', '{C}', '{D}'],
  answer: {index},
  explanation: '{why}',
  lesson: {associated lesson number},
}
\`\`\`

---

## Step 5 — Build and test

\`\`\`bash
npm run build
npm run test
\`\`\`

Fix any build errors (missing imports, invalid frontmatter, MDX parse errors).

---

## Step 6 — Create PR

\`\`\`bash
git add content/academy/ lib/tracks.ts lib/exams.ts
git commit -m "feat: add {track-name} track ({N} lessons)"
gh pr create --title "feat: {track-name} track" --body "Adds {N} lessons covering {topic}."
\`\`\`

---

## Tips

- **Lesson 1 should be accessible to beginners** — don't assume knowledge beyond the prerequisite
- **Concrete over abstract** — every concept needs an example that readers can try themselves
- **Quiz questions should test application, not memorization** — "Given this scenario, what would you do?" not "Define term X"
- **readTime accuracy matters** — readers plan their learning time around it`,
  },

  // ─── Content (continued) ────────────────────────────────────────────────────
  {
    slug: 'blog-autopilot',
    title: 'Blog Autopilot',
    description: 'Automated content pipeline: sources YouTube creators you follow, generates original articles in your voice, creates AI hero images, and auto-publishes via Git PR. Runs on a cron with zero manual steps.',
    category: 'content',
    categoryColor: '#F97316',
    categoryLabel: 'Content & Retro',
    triggers: ['blog-autopilot', 'content pipeline', 'auto-publish', 'automated blogging'],
    useCases: [
      'Automate your blog with 3 posts/week sourced from creators you follow',
      'Generate original articles in your voice from YouTube transcripts',
      'End-to-end pipeline: research → write → image → PR — no manual steps',
    ],
    content: `# Blog Autopilot

Automated content pipeline. Sources YouTube creators you follow, generates original articles in your voice, creates AI hero images via Leonardo, and auto-publishes via Git PR. Designed to run Mon/Wed/Fri on a cron with zero manual intervention.

## Pipeline

\\\`\\\`\\\`
gather.py → Claude (cron) → generate_image.py → deliver.py
   ↓              ↓                ↓                  ↓
YouTube RSS   Write article   Leonardo AI         Git → PR
→ transcript  in your voice   hero image          → Discord alert
→ context     + image prompt
\\\`\\\`\\\`

## Setup

### 1. Prerequisites
- Python 3.9+
- Supadata API key (YouTube transcript extraction)
- Anthropic API key
- Leonardo AI API key
- Git repo for your blog (Next.js MDX or similar)

### 2. Configure sources.json
List your YouTube channel IDs by topic category. The pipeline shuffles round-robin so no category repeats until all have run.

### 3. Write your voice profile
Create \\\`config/voice-profile.md\\\` — this is the most important file. Write real example paragraphs in your voice, not meta-instructions. Claude will drift toward generic prose without concrete examples.

### 4. Set env vars
\\\`\\\`\\\`bash
export SUPADATA_API_KEY="..."
export ANTHROPIC_API_KEY="..."
export LEONARDO_API_KEY="..."
export BLOG_REPO_PATH="/path/to/your/blog"
export DISCORD_WEBHOOK_URL="..."
\\\`\\\`\\\`

## Running Manually

\\\`\\\`\\\`bash
python3 scripts/gather.py        # Stage 1: YouTube → context JSON
# Claude writes article          # Stage 2: cron or manual trigger
python3 scripts/generate_image.py # Stage 3: Leonardo hero image
python3 scripts/deliver.py       # Stage 4: validate, git PR, Discord
\\\`\\\`\\\`

## State Management
\\\`data/state.json\\\` tracks category rotation, consumed video IDs (no repeats), published slugs, and a last_run idempotency guard.

## Known Gotchas
- **Voice drift**: Claude drifts toward generic prose without a strong voice profile. Write examples, not instructions.
- **Image failures**: generate_image.py can fail silently — deliver.py must check for the image file before proceeding.
- **Idempotency**: Reset \\\`last_run\\\` in state.json if you need to re-run a day.
`,
  },
]

export function getSkillBySlug(slug: string): Skill | null {
  return SKILLS.find((s) => s.slug === slug) ?? null
}

export function getSkillsByCategory(category: SkillCategory): Skill[] {
  return SKILLS.filter((s) => s.category === category)
}

export function searchSkills(query: string, skills: Skill[] = SKILLS): Skill[] {
  const q = query.toLowerCase().trim()
  if (!q) return skills
  return skills.filter(
    (skill) =>
      skill.title.toLowerCase().includes(q) ||
      skill.description.toLowerCase().includes(q) ||
      skill.triggers.some((t) => t.toLowerCase().includes(q)) ||
      skill.useCases.some((uc) => uc.toLowerCase().includes(q))
  )
}

export function getRelatedSkills(slug: string): Skill[] {
  const skill = getSkillBySlug(slug)
  if (!skill?.relatedSlugs?.length) return []
  return skill.relatedSlugs.flatMap((s) => {
    const found = getSkillBySlug(s)
    return found ? [found] : []
  })
}

export const SKILL_CATEGORIES = Object.keys(CATEGORY_META) as SkillCategory[]
