import { FREE_WEEKLY_HINTS } from '@/features/hints/constants'
import type { HintBalance } from '@/features/hints/types'
import { supabaseAdmin } from '@/lib/supabase/server'

const BRT_OFFSET_MS = 3 * 3600_000

// The free allowance resets every Sunday 23:59 America/Sao_Paulo (fixed
// UTC-3 — Brazil no longer observes DST).
function currentPeriod(): { start: Date; resetsAt: Date } {
  const wall = new Date(Date.now() - BRT_OFFSET_MS)
  const boundary = new Date(
    Date.UTC(
      wall.getUTCFullYear(),
      wall.getUTCMonth(),
      wall.getUTCDate(),
      23,
      59,
      0,
    ),
  )
  boundary.setUTCDate(boundary.getUTCDate() - boundary.getUTCDay())
  if (boundary.getTime() > wall.getTime()) {
    boundary.setUTCDate(boundary.getUTCDate() - 7)
  }
  const start = new Date(boundary.getTime() + BRT_OFFSET_MS)
  return { start, resetsAt: new Date(start.getTime() + 7 * 24 * 3600_000) }
}

export async function getBalance(userId: string): Promise<HintBalance> {
  const { start, resetsAt } = currentPeriod()

  const { data: used } = await supabaseAdmin
    .from('hints_used')
    .select('id')
    .eq('user_id', userId)
    .gte('used_at', start.toISOString())
  const usedThisWeek = used?.length ?? 0

  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  const bonus = Number((prof as { bonus_hints?: number } | null)?.bonus_hints ?? 0)

  const freeRemaining = Math.max(0, FREE_WEEKLY_HINTS - usedThisWeek)
  return {
    usedThisWeek,
    freeLimit: FREE_WEEKLY_HINTS,
    bonus,
    remaining: freeRemaining + bonus,
    resetsAt: resetsAt.toISOString(),
  }
}

export async function consumeHints(
  userId: string,
  sessionId: string,
  level: 1 | 2 | 3,
  cost: number,
  isSolve = false,
): Promise<number | null> {
  const b = await getBalance(userId)
  if (b.remaining < cost) return null

  const freeRemaining = Math.max(0, b.freeLimit - b.usedThisWeek)
  const fromBonus = Math.max(0, cost - freeRemaining)

  if (fromBonus > 0) {
    const { data, error } = await supabaseAdmin.rpc(
      'consume_bonus_hints' as never,
      { p_user: userId, p_amount: fromBonus } as never,
    )
    if (error || data === null) return null
  }

  const rows = Array.from({ length: cost }, () => ({
    session_id: sessionId,
    user_id: userId,
    hint_level: level,
    is_solve: isSolve,
  }))
  const { error } = await supabaseAdmin.from('hints_used').insert(rows)
  if (error) return null

  return b.remaining - cost
}

export async function addBonus(
  userId: string,
  amount: number,
): Promise<number | null> {
  const { data, error } = await supabaseAdmin.rpc(
    'add_bonus_hints' as never,
    { p_user: userId, p_amount: amount } as never,
  )
  if (error) return null
  return data as number
}
