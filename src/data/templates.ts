// lib/templates.ts — Operator Kit CLAUDE.md template catalog
// Gated behind Elite Discord role (same gate as skills library for now).

export type TemplateCategory = 'nextjs' | 'python' | 'discord' | 'react' | 'cli'

export interface Template {
  slug: string
  title: string
  description: string
  category: TemplateCategory
  categoryLabel: string
  categoryColor: string
  useCases: string[]
  content: string  // full CLAUDE.md text — gated
}

export const TEMPLATE_CATEGORY_META: Record<TemplateCategory, { label: string; color: string }> = {
  nextjs:  { label: 'Next.js SaaS',      color: '#00E5FF' },
  python:  { label: 'Python Service',    color: '#10B981' },
  discord: { label: 'Discord Bot',       color: '#5865F2' },
  react:   { label: 'React App',         color: '#A855F7' },
  cli:     { label: 'CLI / Automation',  color: '#F59E0B' },
}

export const TEMPLATES: Template[] = [
  {
    slug: 'nextjs-saas',
    title: 'Next.js App Router SaaS',
    description: 'Production CLAUDE.md for a Next.js 14 App Router SaaS — auth, database, Stripe, Vercel deploy. Based on the pattern running jeremyknox.ai and Blueprint.',
    category: 'nextjs',
    categoryLabel: 'Next.js SaaS',
    categoryColor: '#00E5FF',
    useCases: [
      'Starting a new Next.js SaaS from scratch',
      'Adding Claude Code context to an existing Next.js project',
      'Standardizing agent behavior across a multi-contributor Next.js app',
    ],
    content: `# CLAUDE.md — [Project Name]

## What This Is
[One sentence: what this app does and who uses it.]

## Live URL
\`https://yourapp.com\`

## Stack
- **Framework:** Next.js 14, App Router
- **Styling:** Tailwind CSS v3
- **Database:** Neon (Postgres) + Drizzle ORM
- **Auth:** [Clerk / NextAuth / custom JWT]
- **Payments:** Stripe
- **Deploy:** Vercel (auto-deploy on merge to \`main\`)
- **Analytics:** PostHog

## GitHub
\`https://github.com/your-org/your-repo\`
**Branch policy:** NEVER commit to \`main\` directly. Always feature branch → PR → merge.

## Critical Invariants
1. All \`/app/api/\` routes MUST validate auth before touching data — use \`lib/auth.ts\`
2. Never log tokens, passwords, or PII — use placeholder values in logs
3. Stripe webhooks must verify signature via \`stripe.webhooks.constructEvent\`
4. Database mutations go through service functions in \`lib/\` — never raw SQL in routes

## Key Files (Tiered)

### Tier 1 — Always Reference
| File | Purpose |
|------|---------|
| \`app/layout.tsx\` | Root layout (providers, fonts) |
| \`app/page.tsx\` | Home / landing page |
| \`lib/db.ts\` | Drizzle client + connection |
| \`lib/auth.ts\` | Auth helpers (getCurrentUser, requireAuth) |
| \`lib/stripe.ts\` | Stripe client + webhook handler |
| \`components/layout/Nav.tsx\` | Navigation |

### Tier 2 — Load On Demand
- \`app/api/\` — API routes (auth, stripe webhooks, data endpoints)
- \`app/dashboard/\` — Authenticated app pages
- \`app/onboarding/\` — New user flow
- \`lib/\` — Service functions by domain
- \`components/\` — UI components organized by feature

### Tier 3 — Ignore Unless Asked
- \`node_modules/\`, \`.next/\`, \`out/\`
- \`drizzle/migrations/\` — Generated, never manually edit

## Database Schema Convention
- All tables snake_case
- Every table has \`created_at\` and \`updated_at\`
- Soft-delete with \`deleted_at\` — never hard delete user data
- Foreign keys always indexed

## API Route Convention
\`\`\`typescript
// Every protected route follows this pattern:
export async function POST(req: Request) {
  const user = await requireAuth()  // throws 401 if not authed
  const body = await req.json()
  // validate body...
  // call service function...
  return Response.json({ ... })
}
\`\`\`

## Commands
\`\`\`bash
npm run dev          # local dev (port 3000)
npm run build        # production build
npm run test         # vitest unit tests
npm run test:e2e     # playwright e2e (requires dev server)
npm run lint         # eslint + biome
npm run db:push      # push schema to Neon
npm run db:studio    # Drizzle Studio GUI
\`\`\`

## Env Vars
\`\`\`
DATABASE_URL                     # Neon Postgres connection string
NEXTAUTH_SECRET                  # or your auth provider's secret
STRIPE_SECRET_KEY                # Stripe secret
STRIPE_WEBHOOK_SECRET            # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL              # https://yourapp.com
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
\`\`\`

## Agent Behavior Rules
- Never commit to \`main\` — always feature branch → PR
- Run \`npm run test\` before marking any feature done
- New API routes need a corresponding test in \`__tests__/api/\`
- New pages need a Playwright smoke test in \`e2e/\`
- Stripe price IDs live in \`lib/stripe.ts\` as constants — never hardcoded in components
- Auth checks belong in \`lib/auth.ts\` — never inline in routes
`,
  },
  {
    slug: 'python-service',
    title: 'Python Microservice (FastAPI)',
    description: 'CLAUDE.md for a Python FastAPI microservice — async routes, Pydantic models, SQLAlchemy, Docker, 90% test coverage floor. Based on the pattern running Knox\'s trading and intelligence services.',
    category: 'python',
    categoryLabel: 'Python Service',
    categoryColor: '#10B981',
    useCases: [
      'Building a new Python API or data service',
      'Standardizing agent behavior on a FastAPI project',
      'Adding Claude Code context to a Python service with CI/CD',
    ],
    content: `# CLAUDE.md — [Service Name]

## What This Is
[What this service does, what consumes it, and what data it owns.]

## Stack
- **Framework:** FastAPI (async)
- **Database:** PostgreSQL + SQLAlchemy (async)
- **Validation:** Pydantic v2
- **Testing:** pytest + pytest-asyncio, 90%+ coverage floor
- **Deploy:** Docker + [Railway / Fly.io / EC2]
- **CI:** GitHub Actions

## GitHub
\`https://github.com/your-org/your-repo\`
**Branch policy:** NEVER commit to \`main\`. Always feature branch → PR → merge.

## Critical Invariants
1. All endpoints validate auth via \`dependencies/auth.py\` — never skip
2. \`os.getenv()\` is BANNED in route files — use \`config/settings.py\` (Pydantic Settings)
3. Database sessions created per-request via dependency injection — never global sessions
4. All background tasks go through the task queue — never \`asyncio.create_task\` in routes
5. 90% test coverage enforced in CI — \`pytest --cov --cov-fail-under=90\`

## Project Structure
\`\`\`
src/
├── main.py              # FastAPI app, router registration
├── config/
│   └── settings.py      # Pydantic Settings — all env vars here
├── routers/             # Route handlers (thin — business logic in services)
├── services/            # Business logic
├── models/              # SQLAlchemy ORM models
├── schemas/             # Pydantic request/response schemas
├── dependencies/        # FastAPI dependencies (auth, db session)
└── lib/                 # Shared utilities
tests/
├── conftest.py          # fixtures, test DB setup
├── test_<router>.py     # one test file per router
└── test_<service>.py    # one test file per service
\`\`\`

## Key Files (Tiered)

### Tier 1 — Always Reference
| File | Purpose |
|------|---------|
| \`src/main.py\` | App entry point, router registration, lifespan |
| \`src/config/settings.py\` | All configuration — add new env vars here |
| \`src/dependencies/auth.py\` | Auth dependency (JWT verify, get current user) |
| \`src/dependencies/db.py\` | DB session dependency |

### Tier 2 — Load On Demand
- \`src/routers/\` — route handlers
- \`src/services/\` — business logic
- \`src/models/\` — database models

### Tier 3 — Ignore Unless Asked
- \`__pycache__/\`, \`.pytest_cache/\`, \`.coverage\`
- \`alembic/versions/\` — Generated migrations

## Route Convention
\`\`\`python
# Routes are thin — delegate to services
@router.post("/items", response_model=ItemSchema)
async def create_item(
    body: CreateItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await item_service.create(db, user_id=current_user.id, data=body)
\`\`\`

## Commands
\`\`\`bash
python -m uvicorn src.main:app --reload  # dev
pytest tests/ -v --cov=src               # tests
pytest --cov --cov-fail-under=90         # CI gate
docker compose up                        # full stack
alembic upgrade head                     # apply migrations
alembic revision --autogenerate -m "..."  # generate migration
\`\`\`

## Env Vars (all in config/settings.py)
\`\`\`
DATABASE_URL          # PostgreSQL async URL
SECRET_KEY            # JWT signing key
ALLOWED_ORIGINS       # CORS allowed origins
LOG_LEVEL             # debug/info/warning
\`\`\`

## Testing Rules
- Every new router file → test file with ≥ 3 test functions
- Every new service → test file with happy path + error cases
- Use \`TestClient\` for route tests, mock services at the boundary
- Fixture for authenticated user in \`conftest.py\` — use it everywhere
- Never hit external APIs in tests — always mock at the HTTP client level

## Agent Behavior Rules
- \`from __future__ import annotations\` on every file (Python 3.9 compat)
- Never \`os.getenv()\` — always import from \`config.settings\`
- New endpoint = new test. No exceptions.
- Migrations: generate, review, commit — never edit generated files
`,
  },
  {
    slug: 'discord-bot',
    title: 'Discord Bot (Python)',
    description: 'CLAUDE.md for a Python Discord bot — discord.py, command handling, role-gated features, persistent state, launchd deployment. Based on the indecision-discord-bot pattern.',
    category: 'discord',
    categoryLabel: 'Discord Bot',
    categoryColor: '#5865F2',
    useCases: [
      'Building a community Discord bot with commands and role gating',
      'Adding Claude Code context to an existing Discord bot project',
      'Standardizing a Discord bot that runs as a persistent service',
    ],
    content: `# CLAUDE.md — [Bot Name]

## What This Is
[What this Discord bot does, which server(s) it serves, and who owns it.]

## Live Environment
- **Guild:** [Server Name] (\`GUILD_ID\`)
- **Bot invite:** [link]
- **Runtime:** Knox Mac Mini (launchd: \`com.knox.[bot-name]\`)

## Stack
- **Language:** Python 3.12
- **Library:** discord.py 2.x
- **Database:** SQLite (simple state) or Postgres (multi-guild)
- **Testing:** pytest + pytest-asyncio
- **Deploy:** macOS launchd (persistent service)

## GitHub
\`https://github.com/your-org/your-repo\`
**Branch policy:** NEVER commit to \`main\`. Always feature branch → PR → merge.

## Critical Invariants
1. **User-Agent on every Discord API call:** \`DiscordBot (https://yourapp.com, 1.0)\`
2. **Intents must be explicitly declared** — never use privileged intents without registering in Dev Portal
3. **Never hardcode tokens** — all secrets in \`~/.env\` or environment
4. **Rate limit awareness** — check \`x-ratelimit-remaining\` before bulk operations
5. **Server Members Intent** must be enabled in Discord Dev Portal if you read member lists

## Project Structure
\`\`\`
src/
├── main.py              # Bot init, event loop
├── bot.py               # Bot class, cog loading
├── cogs/                # Command groups (one file per feature area)
│   ├── admin.py         # Admin/mod commands
│   ├── community.py     # Community feature commands
│   └── events.py        # Event listeners
├── services/            # Business logic (no discord.py deps)
├── db/                  # Database layer
│   ├── client.py        # DB connection
│   └── queries.py       # All queries here
└── lib/
    └── utils.py         # Shared helpers
tests/
\`\`\`

## Key Files (Tiered)

### Tier 1 — Always Reference
| File | Purpose |
|------|---------|
| \`src/main.py\` | Entry point — starts the bot |
| \`src/bot.py\` | Bot class, intents config, cog loading |
| \`src/db/client.py\` | DB connection (reuse — don't create new connections in cogs) |

### Tier 2 — Load On Demand
- \`src/cogs/\` — feature command groups
- \`src/services/\` — business logic

### Tier 3 — Ignore Unless Asked
- \`__pycache__/\`, \`.pytest_cache/\`

## Command Convention
\`\`\`python
# Cogs keep commands thin — delegate to services
@app_commands.command(name="command-name")
@app_commands.guild_only()
async def my_command(self, interaction: discord.Interaction, arg: str):
    await interaction.response.defer(ephemeral=True)
    result = await self.bot.my_service.do_thing(arg)
    await interaction.followup.send(result)
\`\`\`

## Deployment (launchd)
\`\`\`xml
<!-- ~/Library/LaunchAgents/com.knox.[bot-name].plist -->
<key>ProgramArguments</key>
<array>
  <string>/opt/homebrew/bin/python3</string>
  <string>/path/to/src/main.py</string>
</array>
<key>KeepAlive</key>
<true/>
<key>EnvironmentVariables</key>
<dict>
  <key>PATH</key>
  <string>/opt/homebrew/bin:/usr/bin:/bin</string>
</dict>
\`\`\`
\`\`\`bash
launchctl load ~/Library/LaunchAgents/com.knox.[bot-name].plist
launchctl unload ~/Library/LaunchAgents/com.knox.[bot-name].plist
\`\`\`

## Commands
\`\`\`bash
python3 src/main.py              # run bot
pytest tests/ -v --cov=src      # tests
\`\`\`

## Env Vars
\`\`\`
DISCORD_BOT_TOKEN     # Bot token (from Discord Dev Portal)
DISCORD_GUILD_ID      # Primary guild ID
DISCORD_CLIENT_ID     # Application client ID
DATABASE_URL          # DB connection string
\`\`\`

## Agent Behavior Rules
- Never commit tokens — check \`.gitignore\` before every commit
- \`"Server Members Intent"\` must be enabled in Discord Dev Portal if you read member lists
- New command group → new cog file
- Services must be unit-testable without discord.py (no \`Interaction\` in service params)
- All user-facing strings in \`lib/messages.py\` (not hardcoded in cogs)
`,
  },
  {
    slug: 'react-vite',
    title: 'React App (Vite + TypeScript)',
    description: 'CLAUDE.md for a React + Vite + TypeScript SPA — Tailwind, Zustand state, React Router, Radix UI primitives, Vitest. Based on the Blueprint frontend pattern.',
    category: 'react',
    categoryLabel: 'React App',
    categoryColor: '#A855F7',
    useCases: [
      'Building a React SPA frontend for an API-backed service',
      'Adding Claude Code context to an existing Vite/React project',
      'Standardizing frontend conventions across a React codebase',
    ],
    content: `# CLAUDE.md — [App Name] Frontend

## What This Is
[What this React app does — the user-facing frontend for [backend service].]

## Stack
- **Framework:** React 18 + Vite
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v3
- **State:** Zustand
- **Routing:** React Router v6
- **UI Primitives:** Radix UI
- **Icons:** Lucide React
- **Testing:** Vitest + React Testing Library
- **Deploy:** Vercel (auto-deploy on merge to \`main\`)

## GitHub
\`https://github.com/your-org/your-repo\`
**Branch policy:** NEVER commit to \`main\`. Always feature branch → PR → merge.

## Critical Invariants
1. **No \`dangerouslySetInnerHTML\`** without DOMPurify sanitization — XSS risk
2. All API calls go through \`src/lib/api.ts\` — never \`fetch()\` directly in components
3. Sensitive data (tokens) in Zustand store — never \`localStorage\` directly
4. \`useEffect\` cleanup for all subscriptions and timers — no memory leaks
5. All user inputs validated client-side before submission — use Zod schemas

## Project Structure
\`\`\`
src/
├── main.tsx             # App entry point
├── App.tsx              # Router setup, providers
├── pages/               # Route-level components (one per route)
├── components/          # Reusable UI components
│   ├── ui/              # Primitive wrappers (Button, Input, Modal, etc.)
│   └── [feature]/       # Feature-specific components
├── stores/              # Zustand stores (one per domain)
├── hooks/               # Custom React hooks
├── lib/
│   ├── api.ts           # API client (all fetch calls here)
│   └── utils.ts         # Shared utilities
├── types/               # TypeScript type definitions
└── constants/           # App-wide constants
\`\`\`

## Key Files (Tiered)

### Tier 1 — Always Reference
| File | Purpose |
|------|---------|
| \`src/App.tsx\` | Router config, provider tree |
| \`src/lib/api.ts\` | API client — all server calls go through here |
| \`src/stores/auth.ts\` | Auth state (user, token, login/logout) |

### Tier 2 — Load On Demand
- \`src/pages/\` — page components
- \`src/components/\` — UI components
- \`src/stores/\` — Zustand stores

### Tier 3 — Ignore Unless Asked
- \`dist/\`, \`node_modules/\`

## API Client Convention
\`\`\`typescript
// src/lib/api.ts — all fetch calls here
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = useAuthStore.getState().token
  const res = await fetch(\`\${API_BASE}\${path}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new APIError(res.status, await res.json())
  return res.json() as Promise<T>
}
\`\`\`

## State Convention
\`\`\`typescript
// One Zustand store per domain — keep stores small
export const useFeatureStore = create<FeatureState>((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true })
    const items = await apiGet('/items')
    set({ items, loading: false })
  },
}))
\`\`\`

## Commands
\`\`\`bash
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build to dist/
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run — CI)
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
\`\`\`

## Env Vars (.env.local)
\`\`\`
VITE_API_BASE_URL     # Backend API URL (e.g., https://api.yourapp.com)
VITE_POSTHOG_KEY      # Analytics (optional)
\`\`\`

## Agent Behavior Rules
- New page = new file in \`src/pages/\`, registered in \`App.tsx\` router
- New API endpoint = new function in \`src/lib/api.ts\`, not inline fetch
- Component files: named export, no default exports (except pages)
- Never put business logic in components — extract to hooks or stores
- \`any\` type is banned — use \`unknown\` + type guard if truly unknown
`,
  },
  {
    slug: 'python-cli',
    title: 'Python CLI / Automation Script',
    description: 'CLAUDE.md for a Python CLI tool or automation script — argparse, structured logging, retry logic, launchd/cron deployment. Based on the OpenClaw skills pattern.',
    category: 'cli',
    categoryLabel: 'CLI / Automation',
    categoryColor: '#F59E0B',
    useCases: [
      'Building a Python CLI tool or automation script',
      'Packaging an existing script for recurring cron execution',
      'Standardizing agent behavior on a Python automation project',
    ],
    content: `# CLAUDE.md — [Script/Tool Name]

## What This Is
[What this script does, what it consumes, what it produces, when it runs.]

## Stack
- **Language:** Python 3.12
- **Key deps:** requests/httpx, pydantic (validation), tenacity (retry)
- **Testing:** pytest, 90%+ coverage floor
- **Schedule:** [cron / launchd / manual]
- **Runtime:** [machine it runs on]

## GitHub
\`https://github.com/your-org/your-repo\`
**Branch policy:** NEVER commit to \`main\`. Always feature branch → PR → merge.

## Critical Invariants
1. **All secrets in \`~/.env\` or environment** — never hardcoded, never committed
2. **Idempotency guard** — every run checks state before acting (no double-execution)
3. **Atomic state writes** — write temp → fsync → rename. Never corrupt state on crash.
4. **Retry with backoff** on all external API calls — use tenacity: 3 attempts, 2x backoff
5. **Discord alert on failure** — silent failures are unacceptable

## Project Structure
\`\`\`
scripts/
├── main.py              # Entry point + CLI arg parsing
├── [stage1].py          # Pipeline stage 1
├── [stage2].py          # Pipeline stage 2
└── [stage3].py          # Pipeline stage 3
lib/
├── config.py            # Load + validate env vars (Pydantic Settings)
├── state.py             # State read/write with atomic writes
├── notify.py            # Discord/Slack notification helpers
└── retry.py             # Retry decorator (tenacity wrapper)
config/
└── settings.json        # Non-secret config (committed)
data/
└── state.json           # Runtime state (never committed if sensitive)
tests/
└── test_[stage].py      # One test file per script/stage
\`\`\`

## Key Files (Tiered)

### Tier 1 — Always Reference
| File | Purpose |
|------|---------|
| \`scripts/main.py\` | Entry point — CLI args, stage orchestration |
| \`lib/config.py\` | All env vars + config — reference before adding new vars |
| \`lib/state.py\` | State management — use this, never direct JSON writes |
| \`data/state.json\` | Current runtime state |

### Tier 2 — Load On Demand
- \`scripts/\` — individual pipeline stages
- \`lib/\` — shared utilities

### Tier 3 — Ignore Unless Asked
- \`__pycache__/\`, \`.pytest_cache/\`
- \`data/\` unless debugging state issues

## Retry Convention
\`\`\`python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
def call_external_api(url: str) -> dict:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.json()
\`\`\`

## State Convention
\`\`\`python
# lib/state.py — atomic writes prevent corruption on crash
import json, tempfile, os

def save_state(path: str, data: dict) -> None:
    dir_ = os.path.dirname(path)
    with tempfile.NamedTemporaryFile('w', dir=dir_, delete=False, suffix='.tmp') as f:
        json.dump(data, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
        tmp = f.name
    os.replace(tmp, path)  # atomic on POSIX
\`\`\`

## launchd Deployment (macOS)
\`\`\`xml
<!-- ~/Library/LaunchAgents/com.knox.[script-name].plist -->
<key>ProgramArguments</key>
<array>
  <string>/opt/homebrew/bin/python3</string>
  <string>/path/to/scripts/main.py</string>
</array>
<key>StartCalendarInterval</key>
<dict>
  <key>Hour</key><integer>9</integer>
  <key>Minute</key><integer>0</integer>
</dict>
<key>EnvironmentVariables</key>
<dict>
  <key>PATH</key>
  <string>/opt/homebrew/bin:/usr/bin:/bin</string>
</dict>
<key>StandardOutPath</key>
<string>/tmp/[script-name].log</string>
<key>StandardErrorPath</key>
<string>/tmp/[script-name].error.log</string>
\`\`\`

## Commands
\`\`\`bash
python3 scripts/main.py                       # manual run
python3 scripts/main.py --dry-run             # preview without side effects
pytest tests/ -v --cov=scripts --cov=lib      # tests
pytest --cov-fail-under=90                    # CI gate
\`\`\`

## Env Vars (all loaded via lib/config.py)
\`\`\`
API_KEY               # Primary API key
DISCORD_WEBHOOK_URL   # Failure/success alerts
STATE_PATH            # Path to state.json (default: ./data/state.json)
LOG_LEVEL             # debug/info/warning (default: info)
\`\`\`

## Agent Behavior Rules
- \`from __future__ import annotations\` on every file (Python 3.9 compat)
- All external calls: retry wrapper + timeout — no bare \`requests.get\`
- State mutations only after downstream success — don't mark done before delivery
- Every new script stage gets a test file
- CI fails below 90% coverage — no exceptions
- Silent failures are bugs: always Discord-alert on exception in main()
`,
  },
]

export const TEMPLATE_CATEGORIES = Object.keys(TEMPLATE_CATEGORY_META) as TemplateCategory[]

export function getTemplateBySlug(slug: string): Template | null {
  return TEMPLATES.find((t) => t.slug === slug) ?? null
}

export function searchTemplates(query: string, templates: Template[] = TEMPLATES): Template[] {
  const q = query.toLowerCase().trim()
  if (!q) return templates
  return templates.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.useCases.some((uc) => uc.toLowerCase().includes(q))
  )
}
