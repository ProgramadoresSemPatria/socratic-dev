import { FREE_DAILY_HINTS } from '@/features/hints/constants'
import type { HintBalance } from '@/features/hints/types'
import { supabaseAdmin } from '@/lib/supabase/server'

async function getBalance(userId: string): Promise<HintBalance> {
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

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get('user_id')
  if (!userId) {
    return Response.json({ error: 'user_id is required' }, { status: 400 })
  }
  return Response.json(await getBalance(userId))
}

export async function POST(request: Request) {
  const { session_id, user_id, hint_level, cost } = await request.json()

  if (!session_id || !user_id || !hint_level) {
    return Response.json(
      { error: 'session_id, user_id, and hint_level are required' },
      { status: 400 },
    )
  }
  if (![1, 2, 3].includes(hint_level)) {
    return Response.json(
      { error: 'hint_level must be 1, 2, or 3' },
      { status: 400 },
    )
  }

  const spend = Math.min(Math.max(Number(cost) || 1, 1), 10)
  const b = await getBalance(user_id)
  if (b.remaining < spend) {
    return Response.json(
      { error: 'Limite de hints atingido', remaining: 0 },
      { status: 429 },
    )
  }

  // Consume free first, then bonus credits.
  const freeRemaining = Math.max(0, b.freeLimit - b.usedToday)
  const fromBonus = Math.max(0, spend - freeRemaining)
  if (fromBonus > 0) {
    await supabaseAdmin.auth.admin.updateUserById(user_id, {
      user_metadata: { bonus_hints: b.bonus - fromBonus },
    })
  }

  const rows = Array.from({ length: spend }, () => ({
    session_id,
    user_id,
    hint_level,
  }))
  const { error } = await supabaseAdmin.from('hints_used').insert(rows)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ remaining: b.remaining - spend }, { status: 201 })
}
