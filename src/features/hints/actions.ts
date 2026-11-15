'use server'

import { authActionUser, ownsSession } from '@/lib/api/guard'
import { consumeHints, getBalance } from '@/lib/api/hints-server'
import type { HintBalance } from './types'

const EMPTY: HintBalance = {
  usedThisWeek: 0,
  freeLimit: 0,
  bonus: 0,
  remaining: 0,
  resetsAt: '',
}

export async function getHintBalance(token: string): Promise<HintBalance> {
  const a = await authActionUser(token)
  if ('error' in a) return EMPTY
  return getBalance(a.userId)
}

export async function logHint(args: {
  token: string
  sessionId: string
  hintLevel: 1 | 2 | 3
  cost?: number
}): Promise<{ remaining: number } | { error: string }> {
  const a = await authActionUser(args.token)
  if ('error' in a) return a
  if (![1, 2, 3].includes(args.hintLevel)) {
    return { error: 'hint_level inválido' }
  }
  // LABS01-201: consume_hints refuses a foreign session too (migration 027),
  // but it answers with the generic "no credits" error — check here so the
  // client gets the real reason.
  if (!(await ownsSession(a.userId, args.sessionId)))
    return { error: 'Sessão inválida' }
  const spend = Math.min(Math.max(Number(args.cost) || 1, 1), 10)
  const remaining = await consumeHints(
    a.userId,
    args.sessionId,
    args.hintLevel,
    spend,
  )
  if (remaining === null) return { error: 'Limite de hints atingido' }
  return { remaining }
}
