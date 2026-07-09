import { describe, expect, it } from 'vitest'
import { seasonEndsAt, seasonIndex, seasonKey } from './season'

const EPOCH = Date.UTC(2026, 0, 5, 3)
const WEEK = 7 * 24 * 3600_000

describe('season math', () => {
  it('starts at S1 on the epoch', () => {
    expect(seasonKey(EPOCH)).toBe('S1')
    expect(seasonIndex(EPOCH)).toBe(0)
  })

  it('stays in the same season for four weeks', () => {
    expect(seasonKey(EPOCH + 4 * WEEK - 1)).toBe('S1')
    expect(seasonKey(EPOCH + 4 * WEEK)).toBe('S2')
  })

  it('computes the end of the current season', () => {
    const mid = EPOCH + 2 * WEEK
    expect(seasonEndsAt(mid).getTime()).toBe(EPOCH + 4 * WEEK)
  })

  it('never goes below S1 before the epoch', () => {
    expect(seasonKey(EPOCH - WEEK)).toBe('S1')
  })
})
