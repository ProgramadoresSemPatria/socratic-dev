import { describe, expect, it } from 'vitest'
import {
  AiBudgetError,
  budgetBuckets,
  limitsFromEnv,
  periodKeys,
  type BudgetLimits,
} from './budget'
import { toMicros } from './pricing'

const LIMITS: BudgetLimits = {
  userMonthMicros: toMicros(3),
  userDayMicros: toMicros(0.5),
  globalMonthMicros: toMicros(50),
}

/** 2026-11-20 01:30 UTC — still 2026-11-19 in São Paulo (UTC-3). */
const LATE_NIGHT_UTC = Date.UTC(2026, 10, 20, 1, 30)
/** 2026-11-20 15:00 UTC — the same day in both clocks. */
const MIDDAY_UTC = Date.UTC(2026, 10, 20, 15, 0)

describe('periodKeys', () => {
  it('uses the São Paulo wall clock, like the hint allowance', () => {
    expect(periodKeys(LATE_NIGHT_UTC)).toEqual({
      month: '2026-11',
      day: '2026-11-19',
    })
    expect(periodKeys(MIDDAY_UTC)).toEqual({
      month: '2026-11',
      day: '2026-11-20',
    })
  })

  it('rolls the month on the first of the month, not the last', () => {
    // 2026-12-01 02:00 UTC is still November 30th in São Paulo.
    expect(periodKeys(Date.UTC(2026, 11, 1, 2, 0))).toEqual({
      month: '2026-11',
      day: '2026-11-30',
    })
    expect(periodKeys(Date.UTC(2026, 11, 1, 12, 0)).month).toBe('2026-12')
  })

  it('zero-pads so the keys sort as text', () => {
    expect(periodKeys(Date.UTC(2027, 0, 5, 12, 0))).toEqual({
      month: '2027-01',
      day: '2027-01-05',
    })
  })
})

describe('budgetBuckets', () => {
  it('charges a user against month, day and the global bucket', () => {
    const buckets = budgetBuckets('u1', LIMITS, MIDDAY_UTC)
    expect(buckets.map((b) => b.bucket)).toEqual([
      'user:u1:2026-11',
      'user:u1:2026-11-20',
      'global:2026-11',
    ])
    expect(buckets.map((b) => b.scope)).toEqual([
      'user-month',
      'user-day',
      'global-month',
    ])
  })

  it('charges a call with no user against the global bucket alone', () => {
    // /api/agents/library-topup runs from a cron with no user, which is why a
    // per-user cap can never reach it.
    for (const noUser of [null, undefined, '']) {
      const buckets = budgetBuckets(noUser, LIMITS, MIDDAY_UTC)
      expect(buckets).toHaveLength(1)
      expect(buckets[0].bucket).toBe('global:2026-11')
      expect(buckets[0].limit).toBe(toMicros(50))
    }
  })

  it('keeps the daily limit below the monthly one', () => {
    const buckets = budgetBuckets('u1', LIMITS, MIDDAY_UTC)
    const month = buckets.find((b) => b.scope === 'user-month')!
    const day = buckets.find((b) => b.scope === 'user-day')!
    expect(day.limit).toBeLessThan(month.limit)
  })

  it('separates users and days', () => {
    const a = budgetBuckets('u1', LIMITS, MIDDAY_UTC).map((b) => b.bucket)
    const b = budgetBuckets('u2', LIMITS, MIDDAY_UTC).map((b) => b.bucket)
    const later = budgetBuckets('u1', LIMITS, LATE_NIGHT_UTC).map(
      (x) => x.bucket,
    )
    expect(a).not.toEqual(b)
    expect(a).not.toEqual(later)
    // Same month, so the monthly bucket is shared across the two days.
    expect(a[0]).toBe(later[0])
  })
})

describe('limitsFromEnv', () => {
  it('defaults to the measured sizing when nothing is set', () => {
    const before = { ...process.env }
    delete process.env.AI_BUDGET_USER_MONTH_USD
    delete process.env.AI_BUDGET_USER_DAY_USD
    delete process.env.AI_BUDGET_GLOBAL_MONTH_USD
    expect(limitsFromEnv()).toEqual(LIMITS)
    process.env = before
  })

  it('ignores junk and zero instead of uncapping', () => {
    const before = { ...process.env }
    for (const junk of ['', 'abc', '0', '-5', 'NaN']) {
      process.env.AI_BUDGET_USER_MONTH_USD = junk
      expect(limitsFromEnv().userMonthMicros).toBe(toMicros(3))
    }
    process.env = before
  })

  it('reads an override', () => {
    const before = { ...process.env }
    process.env.AI_BUDGET_USER_MONTH_USD = '12.5'
    expect(limitsFromEnv().userMonthMicros).toBe(toMicros(12.5))
    process.env = before
  })
})

describe('AiBudgetError', () => {
  it('says which limit and when it ends', () => {
    expect(new AiBudgetError('user-month').userMessage).toMatch(/mensal/i)
    expect(new AiBudgetError('user-day').userMessage).toMatch(/di[áa]rio/i)
    expect(new AiBudgetError('global-month').userMessage).toMatch(/produto/i)
    expect(new AiBudgetError('unavailable').userMessage).toMatch(
      /verificar|instantes/i,
    )
  })

  it('never leaks a bucket key to the student', () => {
    const err = new AiBudgetError('user-month', 'user:abc-123:2026-11')
    expect(err.userMessage).not.toContain('abc-123')
    // ...but keeps it on the error for the log.
    expect(err.message).toContain('user:abc-123:2026-11')
  })
})
