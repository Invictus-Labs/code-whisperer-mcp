import { describe, it, expect, afterEach, vi } from 'vitest'
import { validateApiKey, extractApiKey, getConfiguredKey, AuthError } from '../src/auth.js'

describe('getConfiguredKey', () => {
  afterEach(() => {
    delete process.env.CODEWHISPERER_API_KEY
  })

  it('returns null when env var not set', () => {
    delete process.env.CODEWHISPERER_API_KEY
    expect(getConfiguredKey()).toBeNull()
  })

  it('returns the env var value when set', () => {
    process.env.CODEWHISPERER_API_KEY = 'test-key-123'
    expect(getConfiguredKey()).toBe('test-key-123')
  })
})

describe('validateApiKey', () => {
  afterEach(() => {
    delete process.env.CODEWHISPERER_API_KEY
    delete process.env.CODEWHISPERER_WORKER_URL
  })

  it('passes with no configured key (dev mode)', async () => {
    delete process.env.CODEWHISPERER_API_KEY
    await expect(validateApiKey(undefined)).resolves.toBeUndefined()
    await expect(validateApiKey('anything')).resolves.toBeUndefined()
  })

  it('passes when provided key matches configured key', async () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    await expect(validateApiKey('valid-key')).resolves.toBeUndefined()
  })

  it('throws AuthError when key is missing but one is configured', async () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    await expect(validateApiKey(undefined)).rejects.toThrow(AuthError)
    await expect(validateApiKey(undefined)).rejects.toThrow('Missing API key')
  })

  it('throws AuthError when empty string provided', async () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    await expect(validateApiKey('')).rejects.toThrow(AuthError)
  })

  it('throws AuthError when wrong key provided', async () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    await expect(validateApiKey('wrong-key')).rejects.toThrow(AuthError)
    await expect(validateApiKey('wrong-key')).rejects.toThrow('Invalid API key')
  })

  it('trims whitespace before comparing', async () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    await expect(validateApiKey('  valid-key  ')).resolves.toBeUndefined()
  })

  it('AuthError has correct name', async () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    try {
      await validateApiKey('wrong')
    } catch (e) {
      expect(e).toBeInstanceOf(AuthError)
      expect((e as AuthError).name).toBe('AuthError')
    }
  })
})

describe('validateApiKey (remote mode)', () => {
  afterEach(() => {
    delete process.env.CODEWHISPERER_API_KEY
    delete process.env.CODEWHISPERER_WORKER_URL
    vi.restoreAllMocks()
  })

  it('passes when worker returns valid=true', async () => {
    process.env.CODEWHISPERER_WORKER_URL = 'https://worker.example.com'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    }))
    await expect(validateApiKey('cw_valid_001')).resolves.toBeUndefined()
  })

  it('throws AuthError when worker returns valid=false', async () => {
    process.env.CODEWHISPERER_WORKER_URL = 'https://worker.example.com'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false }),
    }))
    await expect(validateApiKey('cw_invalid_001')).rejects.toThrow(AuthError)
  })

  it('throws AuthError when worker returns non-ok response', async () => {
    process.env.CODEWHISPERER_WORKER_URL = 'https://worker.example.com'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    // Use unique key so cache doesn't interfere
    await expect(validateApiKey('cw_notok_001')).rejects.toThrow(AuthError)
  })

  it('throws AuthError when fetch throws (network error)', async () => {
    process.env.CODEWHISPERER_WORKER_URL = 'https://worker.example.com'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    // Use unique key so cache doesn't interfere
    await expect(validateApiKey('cw_neterr_001')).rejects.toThrow(AuthError)
  })

  it('uses cache on second call (fetch called once)', async () => {
    process.env.CODEWHISPERER_WORKER_URL = 'https://worker.example.com'
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    })
    vi.stubGlobal('fetch', mockFetch)
    const uniqueKey = `cw_cache_${Math.random()}`
    await validateApiKey(uniqueKey)
    await validateApiKey(uniqueKey)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throws when missing key in remote mode', async () => {
    process.env.CODEWHISPERER_WORKER_URL = 'https://worker.example.com'
    await expect(validateApiKey(undefined)).rejects.toThrow('Missing API key')
  })

  it('re-fetches after cache expires', async () => {
    process.env.CODEWHISPERER_WORKER_URL = 'https://worker.example.com'
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    })
    vi.stubGlobal('fetch', mockFetch)
    vi.useFakeTimers()
    try {
      const expiredKey = `cw_expired_${Math.random()}`
      await validateApiKey(expiredKey)
      // Advance past TTL (5 min + 1ms)
      vi.advanceTimersByTime(5 * 60 * 1000 + 1)
      await validateApiKey(expiredKey)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('extractApiKey', () => {
  it('returns string value for api_key field', () => {
    expect(extractApiKey({ api_key: 'my-key' })).toBe('my-key')
  })

  it('returns undefined when api_key missing', () => {
    expect(extractApiKey({})).toBeUndefined()
  })

  it('returns undefined when api_key is not a string', () => {
    expect(extractApiKey({ api_key: 123 })).toBeUndefined()
    expect(extractApiKey({ api_key: null })).toBeUndefined()
  })
})
