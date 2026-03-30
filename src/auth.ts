// src/auth.ts — API key validation for the Code Whisperer MCP server.
//
// Two validation modes (selected automatically at runtime):
//
// 1. Remote validation (production)
//    CODEWHISPERER_WORKER_URL is set → POST /api/keys/validate with the raw key.
//    Validated keys are cached in-memory for CACHE_TTL_MS (5 min) to avoid a
//    round-trip on every tool call.
//
// 2. Local env-var validation (dev / self-hosted)
//    CODEWHISPERER_WORKER_URL is not set, CODEWHISPERER_API_KEY is set →
//    compare the provided key directly (original behavior, still supported).
//
// If neither env var is set, auth is skipped entirely (open dev mode).

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// ─── In-memory validation cache ──────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  valid: boolean
  expiresAt: number
}

const validationCache = new Map<string, CacheEntry>()

function getCached(key: string): boolean | null {
  const entry = validationCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    validationCache.delete(key)
    return null
  }
  return entry.valid
}

function setCached(key: string, valid: boolean): void {
  validationCache.set(key, { valid, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ─── Remote validation ────────────────────────────────────────────────────────

async function validateRemote(key: string, workerUrl: string): Promise<boolean> {
  const cached = getCached(key)
  if (cached !== null) return cached

  try {
    const res = await fetch(`${workerUrl}/api/keys/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    if (!res.ok) {
      setCached(key, false)
      return false
    }
    const data = await res.json() as { valid: boolean }
    setCached(key, data.valid === true)
    return data.valid === true
  } catch {
    // Network failure — don't cache, let it retry
    return false
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getConfiguredKey(): string | null {
  return process.env.CODEWHISPERER_API_KEY ?? null
}

/**
 * Validates the provided key.
 * Throws AuthError if authentication fails.
 * If no auth is configured (no worker URL, no local key), skips auth.
 */
export async function validateApiKey(provided: string | undefined): Promise<void> {
  const workerUrl = process.env.CODEWHISPERER_WORKER_URL?.replace(/\/$/, '') ?? null
  const localKey = getConfiguredKey()

  // No auth configured — skip (dev mode)
  if (!workerUrl && !localKey) return

  if (!provided || provided.trim() === '') {
    throw new AuthError(
      'Missing API key. Set CODEWHISPERER_API_KEY in your Claude config:\n' +
      '  "env": { "CODEWHISPERER_API_KEY": "<your-key>" }'
    )
  }

  const trimmed = provided.trim()

  // Remote validation mode
  if (workerUrl) {
    const valid = await validateRemote(trimmed, workerUrl)
    if (!valid) {
      throw new AuthError(
        'Invalid API key. Get access at https://jeremyknox.ai/skills-library'
      )
    }
    return
  }

  // Local env-var mode
  if (localKey && trimmed !== localKey.trim()) {
    throw new AuthError(
      'Invalid API key. Purchase access at https://jeremyknox.ai/skills-library'
    )
  }
}

/**
 * Extracts the API key from an MCP tool call's arguments.
 * The key is passed as `api_key` in the tool arguments.
 */
export function extractApiKey(args: Record<string, unknown>): string | undefined {
  const key = args['api_key']
  return typeof key === 'string' ? key : undefined
}
