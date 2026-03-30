# @code-whisperer/skills

MCP server for [The Code Whisperer](https://jeremyknox.ai/skills-library) — 18 battle-tested Claude Code skills, 5 CLAUDE.md templates, and 10+ prompt patterns from a system running 49+ apps, 6 live bots, and real money on the line.

Install once. Use everywhere.

## Prerequisites

- Node.js >= 18
- Claude Code CLI or any MCP-compatible client (Cursor, Windsurf)
- A Code Whisperer API key — get one at [jeremyknox.ai/skills-library](https://jeremyknox.ai/skills-library)

## Install

Add to your `~/.claude.json` (Claude Code) or equivalent MCP config:

```json
{
  "mcpServers": {
    "code-whisperer": {
      "command": "npx",
      "args": ["-y", "@code-whisperer/skills@latest"],
      "env": {
        "CODEWHISPERER_API_KEY": "<your-key>"
      }
    }
  }
}
```

Restart Claude Code. The tools are now available in every session.

## Tools

| Tool | Description |
|---|---|
| `list_skills` | List all 18 skills with slug, category, and description |
| `get_skill(slug)` | Get the full SKILL.md content for a skill |
| `list_templates` | List all 5 CLAUDE.md templates |
| `get_template(slug)` | Get the full CLAUDE.md template content |
| `list_prompts` | List all prompt patterns with tags |
| `get_prompt(slug)` | Get the full prompt content |

## Usage in Claude Code

Once installed, ask Claude to use the tools directly:

```
Use the code-whisperer MCP to get the feature-team skill
```

Or reference skills by name and Claude will fetch them:

```
/feature-team build the new dashboard page per the PRD
```

## Available Skills

| Slug | Category | What it does |
|---|---|---|
| `feature-team` | Agent Teams | 3-agent (Backend + Frontend + QA) feature implementation |
| `quality-team` | Agent Teams | Pre-release QA gate + coverage remediation |
| `security-team` | Agent Teams | Security review (Static + Dependency + Threat Model) |
| `design-team` | Agent Teams | UI implementation + accessibility + design system |
| `research-team` | Agent Teams | Market research, competitive intel, pre-PRD discovery |
| `audit-swarm` | Audit & Review | Parallel multi-agent code audit with P0/P1 tickets |
| `audit-swarm-resolve` | Audit & Review | Resolve audit findings with fix agents per project |
| `repo-maintenance` | Audit & Review | CLAUDE.md pruning, stub test detection, CI optimization |
| `incident` | DevOps & Ops | P0 incident response: halt, ticket, logs, timeline, postmortem |
| `onboard-repo` | DevOps & Ops | Full repo onboarding: sec-scan, CLAUDE.md, CI, quality gates |
| `debug-investigate` | Intelligence | Scientific method debugging with hypothesis elimination log |
| `deep-dive` | Intelligence | Extract knowledge from YouTube, URLs, or topics → integration plan |
| `document-swarm` | Content & Retro | Generate READMEs, runbooks, API docs via agent team |
| `morning-brief` | Content & Retro | Executive morning briefing: overnight status + priorities |
| `weekly-retro` | Content & Retro | Weekly 'State of the Empire' brief stored to knowledge base |
| `trade-retro` | Content & Retro | P&L review and trading pattern analysis |
| `skillboss` | Build & Deploy | Multi-AI gateway: Cloudflare Workers, D1/KV, Stripe, auth, AI |
| `academy-track` | Build & Deploy | Generate full Academy tracks with lessons, quizzes, and CI |
| `blog-autopilot` | Content & Retro | Automated content pipeline: YouTube → article → PR |

## Available CLAUDE.md Templates

| Slug | What it covers |
|---|---|
| `nextjs-saas` | Next.js 14 App Router SaaS — auth, DB, Stripe, Vercel |
| `python-service` | Python microservice — FastAPI, launchd, Discord alerts |
| `discord-bot` | Discord bot with slash commands and D1 persistence |
| `react-vite` | React + Vite component library or standalone app |
| `python-cli` | Python CLI / automation script — argparse, logging, CI |

## Authentication

Pass your API key as the `api_key` argument to any tool, or set `CODEWHISPERER_API_KEY` in the MCP server env (recommended — set once in your config, never passed again).

If `CODEWHISPERER_API_KEY` is not set in the server environment, the server runs in unauthenticated mode (dev/testing only).

## License

MIT — [Jeremy Knox](https://jeremyknox.ai)
