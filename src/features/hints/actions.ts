'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { FREE_DAILY_HINTS } from './constants'
import type { HintBalance } from './types'

const BONUS_PACK_SIZE = 10

async function readBalance(userId: string): Promise<HintBalance> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const { data: used } = await supabaseAdmin
    .from('hints_used')
    .select('id')
    .eq('user_id', userId)
    .gte('used_at', startOfDay.toISOString())
  const usedToday = used?.length ?? 0

  const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
  const bonus = Number(
    (data?.user?.user_metadata as { bonus_hints?: number } | undefined)
      ?.bonus_hints ?? 0,
  )

  const freeRemaining = Math.max(0, FREE_DAILY_HINTS - usedToday)
  return {
    usedToday,
    freeLimit: FREE_DAILY_HINTS,
    bonus,
    remaining: freeRemaining + bonus,
  }
}

export async function getHintBalance(userId: string): Promise<HintBalance> {
  return readBalance(userId)
}

export async function logHint(args: {
  sessionId: string
  userId: string
  hintLevel: 1 | 2 | 3
  cost?: number
}): Promise<{ remaining: number } | { error: string }> {
  if (![1, 2, 3].includes(args.hintLevel)) {
    return { error: 'hint_level must be 1, 2, or 3' }
  }

  const spend = Math.min(Math.max(Number(args.cost) || 1, 1), 10)
  const b = await readBalance(args.userId)
  if (b.remaining < spend) {
    return { error: 'Limite de hints atingido' }
  }

  const freeRemaining = Math.max(0, b.freeLimit - b.usedToday)
  const fromBonus = Math.max(0, spend - freeRemaining)
  if (fromBonus > 0) {
    await supabaseAdmin.auth.admin.updateUserById(args.userId, {
      user_metadata: { bonus_hints: b.bonus - fromBonus },
    })
  }

  const rows = Array.from({ length: spend }, () => ({
    session_id: args.sessionId,
    user_id: args.userId,
    hint_level: args.hintLevel,
  }))
  const { error } = await supabaseAdmin.from('hints_used').insert(rows)
  if (error) return { error: error.message }

  return { remaining: b.remaining - spend }
}

export async function buyHints(
  userId: string,
): Promise<{ bonus: number; added: number } | { error: string }> {
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
  const bonus = Number(
    (data?.user?.user_metadata as { bonus_hints?: number } | undefined)
      ?.bonus_hints ?? 0,
  )
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { bonus_hints: bonus + BONUS_PACK_SIZE },
  })
  if (error) return { error: error.message }
  revalidatePath('/challenge')
  revalidatePath('/design')
  return { bonus: bonus + BONUS_PACK_SIZE, added: BONUS_PACK_SIZE }
}
