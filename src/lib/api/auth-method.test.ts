import { describe, expect, it } from 'vitest'
import { isBlockedAuthMethod, sessionAuthMethod } from './auth-method'

// Builds a JWT-shaped string. Only the payload matters here: the signature is
// verified by the Auth server before this code ever runs.
function jwt(payload: unknown): string {
  const b64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `header.${b64}.signature`
}

describe('sessionAuthMethod', () => {
  it('reads the method from a single-entry amr', () => {
    const token = jwt({ sub: 'u1', amr: [{ method: 'otp', timestamp: 100 }] })
    expect(sessionAuthMethod(token)).toBe('otp')
  })

  it('picks the most recent method when the session accumulated several', () => {
    const token = jwt({
      amr: [
        { method: 'password', timestamp: 100 },
        { method: 'totp', timestamp: 200 },
      ],
    })
    expect(sessionAuthMethod(token)).toBe('totp')
  })

  it('does not depend on the order of the amr entries', () => {
    const token = jwt({
      amr: [
        { method: 'totp', timestamp: 200 },
        { method: 'password', timestamp: 100 },
      ],
    })
    expect(sessionAuthMethod(token)).toBe('totp')
  })

  it('returns null when amr is absent, empty or not an array', () => {
    expect(sessionAuthMethod(jwt({ sub: 'u1' }))).toBeNull()
    expect(sessionAuthMethod(jwt({ amr: [] }))).toBeNull()
    expect(sessionAuthMethod(jwt({ amr: 'password' }))).toBeNull()
  })

  it('returns null for a malformed token instead of throwing', () => {
    expect(sessionAuthMethod('')).toBeNull()
    expect(sessionAuthMethod('not-a-jwt')).toBeNull()
    expect(sessionAuthMethod('header..signature')).toBeNull()
    expect(sessionAuthMethod('header.$$$nonsense$$$.signature')).toBeNull()
  })
})

describe('isBlockedAuthMethod', () => {
  it('blocks the three methods the Borderless bridge never uses', () => {
    for (const method of ['password', 'oauth', 'anonymous']) {
      expect(isBlockedAuthMethod(jwt({ amr: [{ method }] }))).toBe(true)
    }
  })

  it('allows the magic-link exchange, whichever name it records', () => {
    for (const method of ['otp', 'magiclink', 'email', 'email/otp']) {
      expect(isBlockedAuthMethod(jwt({ amr: [{ method }] }))).toBe(false)
    }
  })

  it('fails open on an unknown or unreadable method', () => {
    expect(isBlockedAuthMethod(jwt({ sub: 'u1' }))).toBe(false)
    expect(isBlockedAuthMethod('not-a-jwt')).toBe(false)
  })

  it('blocks a session that ended on a password even if it started elsewhere', () => {
    const token = jwt({
      amr: [
        { method: 'otp', timestamp: 100 },
        { method: 'password', timestamp: 200 },
      ],
    })
    expect(isBlockedAuthMethod(token)).toBe(true)
  })
})
