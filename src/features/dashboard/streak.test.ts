import { describe, expect, it } from 'vitest'
import { calcStreak } from './streak'

const NOW = new Date('2026-07-07T15:00:00Z')

describe('calcStreak', () => {
  it('is zero with no activity', () => {
    expect(calcStreak([], NOW)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(
      calcStreak(
        [
          '2026-07-07T10:00:00Z',
          '2026-07-06T22:00:00Z',
          '2026-07-05T08:00:00Z',
        ],
        NOW,
      ),
    ).toBe(3)
  })

  it('stays alive when the last activity was yesterday', () => {
    expect(calcStreak(['2026-07-06T10:00:00Z'], NOW)).toBe(1)
  })

  it('resets when the last activity is older than yesterday', () => {
    expect(
      calcStreak(['2026-07-04T10:00:00Z', '2026-07-03T10:00:00Z'], NOW),
    ).toBe(0)
  })

  it('breaks at gaps', () => {
    expect(
      calcStreak(
        [
          '2026-07-07T10:00:00Z',
          '2026-07-06T10:00:00Z',
          '2026-07-03T10:00:00Z',
        ],
        NOW,
      ),
    ).toBe(2)
  })

  it('dedupes several sessions on the same day', () => {
    expect(
      calcStreak(
        ['2026-07-07T09:00:00Z', '2026-07-07T18:00:00Z'],
        NOW,
      ),
    ).toBe(1)
  })
})
