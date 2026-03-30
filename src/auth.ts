// src/auth.ts — API key validation for the Code Whisperer MCP server.
// Keys are validated against CODEWHISPERER_API_KEY env var (single key for now).
// Multi-key allowlist support can be added later via a keys.json file or
// a webhook-seeded list when purchase automation is wired up.

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Returns the configured API key from the environment.
 * Returns null if not set (server runs in unauthenticated mode — dev/test only).
 */
export function getConfiguredKey(): string | null {
  return process.env.CODEWHISPERER_API_KEY ?? null
}

/**
 * Validates the provided key against the configured key.
 * Throws AuthError if authentication fails.
 * If no key is configured, skips auth (allows dev/test without a key).
 */
export function validateApiKey(provided: string | undefined): void {
  const configured = getConfiguredKey()

  // No key configured — skip auth (dev/test mode)
  if (!configured) return

  if (!provided || provided.trim() === '') {
    throw new AuthError(
      'Missing API key. Set CODEWHISPERER_API_KEY in your Claude config:\n' +
      '  "env": { "CODEWHISPERER_API_KEY": "<your-key>" }'
    )
  }

  if (provided.trim() !== configured.trim()) {
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
