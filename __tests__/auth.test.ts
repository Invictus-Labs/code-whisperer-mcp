import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
  })

  it('passes with no configured key (dev mode)', () => {
    delete process.env.CODEWHISPERER_API_KEY
    expect(() => validateApiKey(undefined)).not.toThrow()
    expect(() => validateApiKey('anything')).not.toThrow()
  })

  it('passes when provided key matches configured key', () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    expect(() => validateApiKey('valid-key')).not.toThrow()
  })

  it('throws AuthError when key is missing but one is configured', () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    expect(() => validateApiKey(undefined)).toThrow(AuthError)
    expect(() => validateApiKey(undefined)).toThrow('Missing API key')
  })

  it('throws AuthError when empty string provided', () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    expect(() => validateApiKey('')).toThrow(AuthError)
  })

  it('throws AuthError when wrong key provided', () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    expect(() => validateApiKey('wrong-key')).toThrow(AuthError)
    expect(() => validateApiKey('wrong-key')).toThrow('Invalid API key')
  })

  it('trims whitespace before comparing', () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    expect(() => validateApiKey('  valid-key  ')).not.toThrow()
  })

  it('AuthError has correct name', () => {
    process.env.CODEWHISPERER_API_KEY = 'valid-key'
    try {
      validateApiKey('wrong')
    } catch (e) {
      expect(e).toBeInstanceOf(AuthError)
      expect((e as AuthError).name).toBe('AuthError')
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
