import { describe, expect, it } from 'vitest'
import {
  actualMicros,
  estimateMicros,
  FALLBACK_PRICE,
  IMAGE_TOKENS,
  PRICES,
  priceFor,
  toMicros,
} from './pricing'

describe('priceFor', () => {
  it('knows the models the product actually calls', () => {
    expect(priceFor('claude-sonnet-5')).toEqual({
      input: 2,
      output: 10,
      cacheRead: 0.2,
      cacheWrite: 2.5,
    })
  })

  it('falls back to the most expensive known price, never a cheap default', () => {
    const unknown = priceFor('claude-something-new')
    for (const field of ['input', 'output', 'cacheRead', 'cacheWrite'] as const) {
      const worst = Math.max(...Object.values(PRICES).map((p) => p[field]))
      expect(unknown[field]).toBe(worst)
      // The guarantee that matters: a model swap cannot uncap the budget.
      for (const known of Object.values(PRICES)) {
        expect(unknown[field]).toBeGreaterThanOrEqual(known[field])
      }
    }
    expect(unknown).toEqual(FALLBACK_PRICE)
  })
})

describe('toMicros', () => {
  it('rounds up, so a reservation never under-charges', () => {
    expect(toMicros(1)).toBe(1_000_000)
    expect(toMicros(0.0000004)).toBe(1)
    expect(toMicros(0)).toBe(0)
  })
})

describe('actualMicros', () => {
  it('prices each token class separately', () => {
    // 1M input + 1M output on Sonnet 5 = 2 + 10 dollars.
    expect(
      actualMicros('claude-sonnet-5', {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
      }),
    ).toBe(12_000_000)
  })

  it('charges cache reads an order of magnitude less than fresh input', () => {
    const fresh = actualMicros('claude-sonnet-5', { input_tokens: 1_000_000 })
    const cached = actualMicros('claude-sonnet-5', {
      cache_read_tokens: 1_000_000,
    })
    expect(cached * 10).toBe(fresh)
  })

  it('treats missing fields as zero', () => {
    expect(actualMicros('claude-sonnet-5', {})).toBe(0)
  })

  it('reproduces a measured call from the ledger', () => {
    // The most expensive row on 2026-11-19: solve/design, US$ 0.0316.
    const micros = actualMicros('claude-sonnet-5', {
      input_tokens: 1523,
      output_tokens: 2767,
      cache_read_tokens: 0,
      cache_write_tokens: 0,
    })
    expect(micros / 1_000_000).toBeCloseTo(0.0307, 3)
  })
})

describe('estimateMicros', () => {
  it('bills the whole maxTokens as output — the call has not happened yet', () => {
    const micros = estimateMicros({
      model: 'claude-sonnet-5',
      promptChars: 0,
      maxTokens: 1_000_000,
    })
    expect(micros).toBe(10_000_000)
  })

  it('assumes every input token is uncached', () => {
    const micros = estimateMicros({
      model: 'claude-sonnet-5',
      promptChars: 3_000_000, // 1M tokens at 3 chars each
      maxTokens: 0,
    })
    expect(micros).toBe(2_000_000)
  })

  it('never estimates below the real cost of the same call', () => {
    // A tutor reply: ~6k chars of prompt, 1024 max output. Real cost once the
    // model answers in 300 tokens must be under the reservation.
    const reserved = estimateMicros({
      model: 'claude-sonnet-5',
      promptChars: 6000,
      maxTokens: 1024,
    })
    const real = actualMicros('claude-sonnet-5', {
      input_tokens: 1500,
      output_tokens: 300,
    })
    expect(reserved).toBeGreaterThan(real)
  })

  it('prices an image per image, not by its base64 length', () => {
    const withImage = estimateMicros({
      model: 'claude-sonnet-5',
      promptChars: 0,
      maxTokens: 0,
      images: 1,
    })
    expect(withImage).toBe(toMicros((IMAGE_TOKENS * 2) / 1_000_000))
    // 8 MB of base64 counted as text would be ~5 dollars; it is cents.
    expect(withImage).toBeLessThan(10_000)
  })

  it('treats negative input as zero instead of crediting the user', () => {
    expect(
      estimateMicros({
        model: 'claude-sonnet-5',
        promptChars: -100,
        maxTokens: -5,
      }),
    ).toBe(0)
  })
})
