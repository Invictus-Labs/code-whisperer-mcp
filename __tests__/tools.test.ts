import { describe, it, expect, afterEach } from 'vitest'
import {
  handleListSkills,
  handleGetSkill,
  handleListTemplates,
  handleGetTemplate,
  handleListPrompts,
  handleGetPrompt,
} from '../src/tools.js'
import { SKILLS } from '../src/data/skills.js'
import { TEMPLATES } from '../src/data/templates.js'
import { PROMPTS } from '../src/data/prompts.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function text(result: ReturnType<typeof handleListSkills>): Promise<string> {
  return (await result).content[0].text
}

// ─── list_skills ─────────────────────────────────────────────────────────────

describe('handleListSkills', () => {
  afterEach(() => { delete process.env.CODEWHISPERER_API_KEY })

  it('returns all skill slugs in output (no auth configured)', async () => {
    delete process.env.CODEWHISPERER_API_KEY
    const out = await text(handleListSkills({}))
    for (const skill of SKILLS) {
      expect(out).toContain(skill.slug)
    }
  })

  it('returns all skill titles', async () => {
    const out = await text(handleListSkills({}))
    for (const skill of SKILLS) {
      expect(out).toContain(skill.title)
    }
  })

  it('is not an error result', async () => {
    const result = await handleListSkills({})
    expect(result.isError).toBeFalsy()
  })

  it('returns auth error when key configured but missing', async () => {
    process.env.CODEWHISPERER_API_KEY = 'secret'
    const result = await handleListSkills({})
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Missing API key')
  })

  it('returns auth error when key is wrong', async () => {
    process.env.CODEWHISPERER_API_KEY = 'secret'
    const result = await handleListSkills({ api_key: 'wrong' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('Invalid API key')
  })

  it('succeeds with correct key', async () => {
    process.env.CODEWHISPERER_API_KEY = 'secret'
    const result = await handleListSkills({ api_key: 'secret' })
    expect(result.isError).toBeFalsy()
    expect(result.content[0].text).toContain('feature-team')
  })
})

// ─── get_skill ───────────────────────────────────────────────────────────────

describe('handleGetSkill', () => {
  afterEach(() => { delete process.env.CODEWHISPERER_API_KEY })

  it('returns full skill content for a valid slug', async () => {
    const result = await handleGetSkill({ slug: 'feature-team' })
    expect(result.isError).toBeFalsy()
    expect(result.content[0].text).toContain('feature-team')
    expect(result.content[0].text.length).toBeGreaterThan(100)
  })

  it('returns error for unknown slug', async () => {
    const result = await handleGetSkill({ slug: 'does-not-exist' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('not found')
  })

  it('includes available slugs in error message', async () => {
    const result = await handleGetSkill({ slug: 'does-not-exist' })
    expect(result.content[0].text).toContain('feature-team')
  })

  it('returns error when slug is missing', async () => {
    const result = await handleGetSkill({})
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('slug')
  })

  it('returns skill content for all 18 skills', async () => {
    for (const skill of SKILLS) {
      const result = await handleGetSkill({ slug: skill.slug })
      expect(result.isError, `${skill.slug} returned error`).toBeFalsy()
      expect(result.content[0].text.length, `${skill.slug} has empty content`).toBeGreaterThan(50)
    }
  })

  it('respects auth when configured', async () => {
    process.env.CODEWHISPERER_API_KEY = 'secret'
    const denied = await handleGetSkill({ slug: 'feature-team' })
    expect(denied.isError).toBe(true)

    const allowed = await handleGetSkill({ slug: 'feature-team', api_key: 'secret' })
    expect(allowed.isError).toBeFalsy()
  })
})

// ─── list_templates ───────────────────────────────────────────────────────────

describe('handleListTemplates', () => {
  afterEach(() => { delete process.env.CODEWHISPERER_API_KEY })

  it('returns all template slugs', async () => {
    const out = await text(handleListTemplates({}))
    for (const t of TEMPLATES) {
      expect(out).toContain(t.slug)
    }
  })

  it('is not an error result', async () => {
    expect((await handleListTemplates({})).isError).toBeFalsy()
  })

  it('returns auth error when key configured but not provided', async () => {
    process.env.CODEWHISPERER_API_KEY = 'secret'
    const result = await handleListTemplates({})
    expect(result.isError).toBe(true)
  })
})

// ─── get_template ─────────────────────────────────────────────────────────────

describe('handleGetTemplate', () => {
  it('returns template content for valid slug', async () => {
    const result = await handleGetTemplate({ slug: 'nextjs-saas' })
    expect(result.isError).toBeFalsy()
    expect(result.content[0].text.length).toBeGreaterThan(100)
  })

  it('returns error for unknown slug', async () => {
    const result = await handleGetTemplate({ slug: 'does-not-exist' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('not found')
  })

  it('returns error when slug missing', async () => {
    const result = await handleGetTemplate({})
    expect(result.isError).toBe(true)
  })

  it('returns content for all templates', async () => {
    for (const t of TEMPLATES) {
      const result = await handleGetTemplate({ slug: t.slug })
      expect(result.isError, `${t.slug} returned error`).toBeFalsy()
    }
  })
})

// ─── list_prompts ─────────────────────────────────────────────────────────────

describe('handleListPrompts', () => {
  it('returns all prompt slugs', async () => {
    const out = await text(handleListPrompts({}))
    for (const p of PROMPTS) {
      expect(out).toContain(p.slug)
    }
  })

  it('includes tags in output', async () => {
    const out = await text(handleListPrompts({}))
    expect(out).toContain('Tags:')
  })

  it('is not an error result', async () => {
    expect((await handleListPrompts({})).isError).toBeFalsy()
  })
})

// ─── non-AuthError catch paths ────────────────────────────────────────────────

describe('non-AuthError catch fallback', () => {
  afterEach(() => { delete process.env.CODEWHISPERER_API_KEY })

  it('handleGetTemplate returns error for wrong key', async () => {
    process.env.CODEWHISPERER_API_KEY = 'secret'
    const r1 = await handleGetTemplate({ api_key: 'wrong', slug: 'nextjs-saas' })
    expect(r1.isError).toBe(true)
    expect(r1.content[0].text).toContain('Invalid API key')

    const r2 = await handleGetPrompt({ api_key: 'wrong', slug: 'feature-planning' })
    expect(r2.isError).toBe(true)
    expect(r2.content[0].text).toContain('Invalid API key')

    const r3 = await handleListTemplates({ api_key: 'wrong' })
    expect(r3.isError).toBe(true)

    const r4 = await handleListPrompts({ api_key: 'wrong' })
    expect(r4.isError).toBe(true)
  })
})

// ─── get_prompt ───────────────────────────────────────────────────────────────

describe('handleGetPrompt', () => {
  it('returns prompt content for valid slug', async () => {
    const result = await handleGetPrompt({ slug: 'feature-planning' })
    expect(result.isError).toBeFalsy()
    expect(result.content[0].text.length).toBeGreaterThan(100)
  })

  it('returns error for unknown slug', async () => {
    const result = await handleGetPrompt({ slug: 'does-not-exist' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('not found')
  })

  it('returns error when slug missing', async () => {
    const result = await handleGetPrompt({})
    expect(result.isError).toBe(true)
  })

  it('returns content for all prompts', async () => {
    for (const p of PROMPTS) {
      const result = await handleGetPrompt({ slug: p.slug })
      expect(result.isError, `${p.slug} returned error`).toBeFalsy()
    }
  })
})
