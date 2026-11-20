// LABS01-203 — the spend cap itself (audit finding 3.5, "teto").
//
// Three buckets, checked together in one atomic round trip (migration 029):
//
//   user:<id>:2026-11      the monthly per-user cap the audit asks for
//   user:<id>:2026-11-20   a daily cap, because monthly alone is not a brake:
//                          a month's budget can be spent in ten minutes and
//                          then the student has no tutor for thirty days
//   global:2026-11         insurance against a new bug, not against a user
//
// The amounts come from measurement, not from taste. On 2026-11-19 the ledger
// held US$ 0.79 of spend across 8 users since 2026-08-29: the heaviest
// user-month was US$ 0.19 and the median US$ 0.057. US$ 3.00/month is ~16x the
// heaviest real month and ~230 generated challenges — it cannot get in the way
// of normal use, which is what makes the fail-closed choice below cheap.

import { supabaseAdmin } from '@/lib/supabase/server'
import { toMicros } from './pricing'

export type BudgetScope =
  | 'user-month'
  | 'user-day'
  | 'global-month'
  | 'unavailable'

export class AiBudgetError extends Error {
  constructor(
    readonly scope: BudgetScope,
    readonly bucket?: string,
  ) {
    super(`ai budget exceeded: ${scope}${bucket ? ` (${bucket})` : ''}`)
    this.name = 'AiBudgetError'
  }

  /** Shown to the student, so it says what happened and when it ends. */
  get userMessage(): string {
    switch (this.scope) {
      case 'user-month':
        return 'Limite mensal de uso de IA atingido. Ele reinicia no primeiro dia do mês.'
      case 'user-day':
        return 'Limite diário de uso de IA atingido. Tente de novo amanhã.'
      case 'global-month':
        return 'O limite de uso de IA do produto foi atingido neste mês. Já estamos olhando.'
      case 'unavailable':
        return 'Não foi possível verificar o limite de uso de IA. Tente de novo em instantes.'
    }
  }
}

export type BudgetLimits = {
  userMonthMicros: number
  userDayMicros: number
  globalMonthMicros: number
}

function usd(name: string, fallback: number): number {
  const raw = process.env[name]
  const parsed = raw === undefined ? NaN : Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function limitsFromEnv(): BudgetLimits {
  return {
    userMonthMicros: toMicros(usd('AI_BUDGET_USER_MONTH_USD', 3)),
    userDayMicros: toMicros(usd('AI_BUDGET_USER_DAY_USD', 0.5)),
    globalMonthMicros: toMicros(usd('AI_BUDGET_GLOBAL_MONTH_USD', 50)),
  }
}

/** Fixed UTC-3, the same wall clock the hint allowance resets on. */
const BRT_OFFSET_MS = 3 * 3600_000

export function periodKeys(now: number = Date.now()): {
  month: string
  day: string
} {
  const wall = new Date(now - BRT_OFFSET_MS)
  const month = `${wall.getUTCFullYear()}-${String(wall.getUTCMonth() + 1).padStart(2, '0')}`
  return {
    month,
    day: `${month}-${String(wall.getUTCDate()).padStart(2, '0')}`,
  }
}

export type Bucket = { bucket: string; limit: number; scope: BudgetScope }

/**
 * The buckets one call is charged against. A call with no user — only
 * /api/agents/library-topup, which runs from a cron with a shared secret —
 * is charged against the global bucket alone, which is the one thing a
 * per-user cap can never reach.
 */
export function budgetBuckets(
  userId: string | null | undefined,
  limits: BudgetLimits = limitsFromEnv(),
  now: number = Date.now(),
): Bucket[] {
  const { month, day } = periodKeys(now)
  const buckets: Bucket[] = [
    {
      bucket: `global:${month}`,
      limit: limits.globalMonthMicros,
      scope: 'global-month',
    },
  ]
  if (userId) {
    buckets.unshift(
      {
        bucket: `user:${userId}:${month}`,
        limit: limits.userMonthMicros,
        scope: 'user-month',
      },
      {
        bucket: `user:${userId}:${day}`,
        limit: limits.userDayMicros,
        scope: 'user-day',
      },
    )
  }
  return buckets
}

export type Reservation = { buckets: string[]; micros: number }

/**
 * Charges `micros` against every bucket before the call happens. Throws
 * AiBudgetError when any of them would be exceeded — the reservation is given
 * back inside the RPC in that case, so a user hammering their own limit does
 * not inflate the counter.
 *
 * FAILS CLOSED. Unlike rateLimit, which lets requests through on a database
 * error so a transient outage cannot take the app down, a budget check that
 * cannot run denies the call. That costs nothing: every AI route already calls
 * requireUser first, which asks Supabase to verify the token, so when this
 * query cannot run the request was never going to be served anyway.
 */
export async function reserve(
  userId: string | null | undefined,
  micros: number,
): Promise<Reservation | null> {
  if (!(micros > 0)) return null
  const buckets = budgetBuckets(userId)
  const { data, error } = await supabaseAdmin.rpc('check_ai_budget' as never, {
    p_buckets: buckets.map((b) => b.bucket),
    p_limits: buckets.map((b) => b.limit),
    p_micros: micros,
  } as never)

  if (error) {
    console.error('[aiBudget] check failed', error.message)
    throw new AiBudgetError('unavailable')
  }
  if (typeof data === 'string' && data) {
    const hit = buckets.find((b) => b.bucket === data)
    throw new AiBudgetError(hit?.scope ?? 'global-month', data)
  }
  return { buckets: buckets.map((b) => b.bucket), micros }
}

/**
 * Replaces the pessimistic reservation with what the call really cost. The
 * delta is positive in the normal case (the estimate assumed every input
 * token uncached and the full maxTokens as output), and the counter is
 * corrected within seconds of the answer.
 *
 * Never throws: a failed reconciliation leaves the user slightly
 * over-charged, which is the safe direction.
 */
export async function settle(
  reservation: Reservation | null,
  actualMicros: number,
): Promise<void> {
  if (!reservation) return
  const delta = reservation.micros - Math.max(0, actualMicros)
  if (delta === 0) return
  try {
    const { error } = await supabaseAdmin.rpc('settle_ai_budget' as never, {
      p_buckets: reservation.buckets,
      p_delta: delta,
    } as never)
    if (error) console.error('[aiBudget] settle failed', error.message)
  } catch (e) {
    console.error('[aiBudget] settle failed', e)
  }
}
