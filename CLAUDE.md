# CLAUDE.md — code-whisperer-mcp

## What This Is
MCP server package for The Code Whisperer skills library. Exposes 18 Claude Code skills,
5 CLAUDE.md templates, and 10+ prompt patterns via MCP stdio transport.

## Live Package
`@code-whisperer/skills` on npm (pending publish)

## Stack
- **Runtime:** Node.js 18+, ESM
- **MCP:** `@modelcontextprotocol/sdk` stdio transport
- **Types:** TypeScript strict mode
- **Tests:** Vitest, 100% coverage on src/auth.ts + src/tools.ts
- **Data:** Bundled from the-code-whisperer lib/ (copy-on-update workflow)

## GitHub
`https://github.com/Invictus-Labs/code-whisperer-mcp`
**Branch policy:** NEVER commit to `main` directly. Always feature branch → PR → merge.

## Critical Invariants
1. `src/index.ts` is excluded from coverage — it's stdio glue, not unit-testable
2. `src/data/` is excluded from coverage — it's data, not logic
3. Auth skips when `CODEWHISPERER_API_KEY` is unset (dev mode) — this is intentional
4. Skills data in `src/data/` must stay in sync with `the-code-whisperer/lib/` after updates

## Updating Skills Data
When skills/templates/prompts are updated in the-code-whisperer:
```bash
cp ~/Documents/Dev/the-code-whisperer/lib/skills.ts src/data/skills.ts
cp ~/Documents/Dev/the-code-whisperer/lib/templates.ts src/data/templates.ts
cp ~/Documents/Dev/the-code-whisperer/lib/prompt-library.ts src/data/prompts.ts
npm test  # verify
```
Then bump the package version and publish.

## Commands
```bash
npm test              # vitest run
npm run test:coverage # vitest run --coverage
npm run build         # tsc → dist/
npm publish           # publish to npm (runs build + test first)
```

## Publishing
```bash
npm version patch  # or minor/major
npm publish --access public
```
