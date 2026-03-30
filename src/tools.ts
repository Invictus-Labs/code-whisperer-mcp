// src/tools.ts — MCP tool definitions and handlers for the Code Whisperer server.

import { SKILLS, getSkillBySlug } from './data/skills.js'
import { TEMPLATES, getTemplateBySlug } from './data/templates.js'
import { PROMPTS, getPromptBySlug } from './data/prompts.js'
import { validateApiKey, extractApiKey, AuthError } from './auth.js'

// ─── Tool definitions (passed to server.tool()) ──────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: 'list_skills',
    description: 'List all available Claude Code skills with their slug, title, category, and description. Use get_skill to fetch the full SKILL.md content for a specific skill.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        api_key: { type: 'string', description: 'Your Code Whisperer API key' },
      },
      required: [],
    },
  },
  {
    name: 'get_skill',
    description: 'Get the full SKILL.md content for a specific Claude Code skill by slug. Use list_skills to discover available slugs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'The skill slug (e.g. "feature-team", "audit-swarm")' },
        api_key: { type: 'string', description: 'Your Code Whisperer API key' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'list_templates',
    description: 'List all available CLAUDE.md templates with slug, title, and category. Use get_template to fetch the full template content.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        api_key: { type: 'string', description: 'Your Code Whisperer API key' },
      },
      required: [],
    },
  },
  {
    name: 'get_template',
    description: 'Get the full CLAUDE.md template content for a specific project type by slug.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'The template slug (e.g. "nextjs-saas", "python-service")' },
        api_key: { type: 'string', description: 'Your Code Whisperer API key' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'list_prompts',
    description: 'List all available prompt patterns with slug, title, category, and tags. Use get_prompt to fetch the full prompt content.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        api_key: { type: 'string', description: 'Your Code Whisperer API key' },
      },
      required: [],
    },
  },
  {
    name: 'get_prompt',
    description: 'Get the full prompt pattern content by slug.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'The prompt slug (e.g. "feature-planning", "code-review-checklist")' },
        api_key: { type: 'string', description: 'Your Code Whisperer API key' },
      },
      required: ['slug'],
    },
  },
] as const

// ─── Tool handlers ───────────────────────────────────────────────────────────

type ToolResult = { content: Array<{ type: 'text'; text: string }>; isError?: boolean }

function ok(text: string): ToolResult {
  return { content: [{ type: 'text', text }] }
}

function err(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true }
}

export function handleListSkills(args: Record<string, unknown>): ToolResult {
  try {
    validateApiKey(extractApiKey(args))
  } catch (e) {
    return err((e as Error).message)
  }

  const lines = SKILLS.map((s) =>
    `${s.slug} | ${s.categoryLabel} | ${s.title}\n  ${s.description}`
  )
  return ok(`# Code Whisperer — ${SKILLS.length} Claude Code Skills\n\n${lines.join('\n\n')}`)
}

export function handleGetSkill(args: Record<string, unknown>): ToolResult {
  try {
    validateApiKey(extractApiKey(args))
  } catch (e) {
    return err((e as Error).message)
  }

  const slug = typeof args['slug'] === 'string' ? args['slug'] : ''
  if (!slug) return err('Missing required argument: slug')

  const skill = getSkillBySlug(slug)
  if (!skill) {
    const available = SKILLS.map((s) => s.slug).join(', ')
    return err(`Skill "${slug}" not found.\n\nAvailable slugs: ${available}`)
  }

  return ok(skill.content)
}

export function handleListTemplates(args: Record<string, unknown>): ToolResult {
  try {
    validateApiKey(extractApiKey(args))
  } catch (e) {
    return err((e as Error).message)
  }

  const lines = TEMPLATES.map((t) =>
    `${t.slug} | ${t.categoryLabel} | ${t.title}\n  ${t.description}`
  )
  return ok(`# Code Whisperer — ${TEMPLATES.length} CLAUDE.md Templates\n\n${lines.join('\n\n')}`)
}

export function handleGetTemplate(args: Record<string, unknown>): ToolResult {
  try {
    validateApiKey(extractApiKey(args))
  } catch (e) {
    return err((e as Error).message)
  }

  const slug = typeof args['slug'] === 'string' ? args['slug'] : ''
  if (!slug) return err('Missing required argument: slug')

  const template = getTemplateBySlug(slug)
  if (!template) {
    const available = TEMPLATES.map((t) => t.slug).join(', ')
    return err(`Template "${slug}" not found.\n\nAvailable slugs: ${available}`)
  }

  return ok(template.content)
}

export function handleListPrompts(args: Record<string, unknown>): ToolResult {
  try {
    validateApiKey(extractApiKey(args))
  } catch (e) {
    return err((e as Error).message)
  }

  const lines = PROMPTS.map((p) =>
    `${p.slug} | ${p.categoryLabel} | ${p.title}\n  Tags: ${p.tags.join(', ')}\n  ${p.description}`
  )
  return ok(`# Code Whisperer — ${PROMPTS.length} Prompt Patterns\n\n${lines.join('\n\n')}`)
}

export function handleGetPrompt(args: Record<string, unknown>): ToolResult {
  try {
    validateApiKey(extractApiKey(args))
  } catch (e) {
    return err((e as Error).message)
  }

  const slug = typeof args['slug'] === 'string' ? args['slug'] : ''
  if (!slug) return err('Missing required argument: slug')

  const prompt = getPromptBySlug(slug)
  if (!prompt) {
    const available = PROMPTS.map((p) => p.slug).join(', ')
    return err(`Prompt "${slug}" not found.\n\nAvailable slugs: ${available}`)
  }

  return ok(prompt.content)
}
