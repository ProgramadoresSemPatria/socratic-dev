import { FREE_DAILY_HINTS } from '@/features/hints/constants'
import type { HintBalance } from '@/features/hints/types'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function getBalance(userId: string): Promise<HintBalance> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const { data: used } = await supabaseAdmin
    .from('hints_used')
    .select('id')
    .eq('user_id', userId)
    .gte('used_at', startOfDay.toISOString())
  const usedToday = used?.length ?? 0

  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  const bonus = Number((prof as { bonus_hints?: number } | null)?.bonus_hints ?? 0)

  const freeRemaining = Math.max(0, FREE_DAILY_HINTS - usedToday)
  return {
    usedToday,
    freeLimit: FREE_DAILY_HINTS,
    bonus,
    remaining: freeRemaining + bonus,
  }
}

export async function consumeHints(
  userId: string,
  sessionId: string,
  level: 1 | 2 | 3,
  cost: number,
): Promise<number | null> {
  const b = await getBalance(userId)
  if (b.remaining < cost) return null

  const freeRemaining = Math.max(0, b.freeLimit - b.usedToday)
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
