import { aiErrorResponse } from '@/lib/ai/client'
import { generateChallenge, type GenLevel } from '@/lib/ai/generate-challenge'
import { supabaseAdmin } from '@/lib/supabase-server'

// Returns a challenge FAST: reuses an existing one the user hasn't done yet
// (instant, no token cost). Only generates a new one when the pool is
// exhausted. This is the main speed lever + grows a shared library.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const kind = body.kind === 'design' ? 'design' : 'code'
    const level: GenLevel =
      body.level === 'intermediate' || body.level === 'advanced'
        ? body.level
        : 'beginner'
    const stack = body.stack === 'javascript' ? 'javascript' : 'typescript'
    const userId: string | undefined = body.user_id

    // Challenges this user already started (exclude them).
    let seenIds: string[] = []
    if (userId) {
      const { data: seen } = await supabaseAdmin
        .from('sessions')
        .select('challenge_id')
        .eq('user_id', userId)
      seenIds = [...new Set((seen ?? []).map((s) => s.challenge_id))]
    }

    let query = supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('kind', kind)
      .eq('level', level)
    if (kind === 'code') query = query.eq('stack', stack)
    if (seenIds.length) query = query.not('id', 'in', `(${seenIds.join(',')})`)

    const { data: pool } = await query.limit(12)
    if (pool && pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * pool.length)]
      return Response.json(pick)
    }

    // Nothing unseen → generate a fresh one (also enriches the library).
    const { data, error } = await generateChallenge({ kind, stack, level })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data, { status: 201 })
  } catch (e) {
    return aiErrorResponse(e)
  }
}
