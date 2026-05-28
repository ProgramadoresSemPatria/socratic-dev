'use server'

import {
  generateChallenge as runGenerate,
  type GenLevel,
} from '@/lib/ai/generate-challenge'
import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Challenge } from './types'

export async function startSession(args: {
  userId: string
  challengeId: string
}): Promise<{ id: string } | null> {
  const { data } = await supabaseAdmin
    .from('sessions')
    .insert({ user_id: args.userId, challenge_id: args.challengeId })
    .select()
    .single()
  return data ? { id: (data as { id: string }).id } : null
}

export async function completeSession(args: {
  id: string
  status?: 'completed' | 'abandoned'
  durationSeconds?: number
}): Promise<void> {
  const status = args.status ?? 'completed'
  const update =
    typeof args.durationSeconds === 'number'
      ? {
          status,
          completed_at: new Date().toISOString(),
          duration_seconds: args.durationSeconds,
        }
      : { status, completed_at: new Date().toISOString() }
  await supabaseAdmin.from('sessions').update(update).eq('id', args.id)
  revalidatePath('/dashboard')
  revalidatePath('/profile')
}

export type SessionRow = {
  id: string
  challenge_id: string
  status: string
  started_at: string
  challenges: { title: string; stack: string; kind?: string } | null
}

export async function listSessionsForUser(
  userId: string,
): Promise<SessionRow[]> {
  const { data } = await supabaseAdmin
    .from('sessions')
    .select(
      'id, challenge_id, status, started_at, challenges(title, stack, kind)',
    )
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
  return (data ?? []) as unknown as SessionRow[]
}

export async function generateChallenge(input: {
  kind: 'code' | 'design'
  stack?: string
  level: GenLevel
}): Promise<Challenge | { error: string }> {
  try {
    const { data, error } = await runGenerate({
      kind: input.kind,
      stack: input.stack,
      level: input.level,
    })
    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return data as unknown as Challenge
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro inesperado' }
  }
}

export async function getNextChallenge(input: {
  userId?: string
  kind: 'code' | 'design'
  stack?: string
  level: GenLevel
}): Promise<Challenge | { error: string }> {
  const kind = input.kind
  const level: GenLevel =
    input.level === 'intermediate' || input.level === 'advanced'
      ? input.level
      : 'beginner'
  const stack = input.stack === 'javascript' ? 'javascript' : 'typescript'

  let seenIds: string[] = []
  if (input.userId) {
    const { data: seen } = await supabaseAdmin
      .from('sessions')
      .select('challenge_id')
      .eq('user_id', input.userId)
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
    return pool[Math.floor(Math.random() * pool.length)] as unknown as Challenge
  }

  return generateChallenge({ kind, stack, level })
}
