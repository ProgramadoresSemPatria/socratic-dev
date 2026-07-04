'use server'

import { askClaude } from '@/lib/ai/client'
import {
  generateChallenge as runGenerate,
  type GenLevel,
} from '@/lib/ai/generate-challenge'
import { recommendSystem } from '@/lib/ai/prompts/recommend'
import { challengePoints, computeIndependence } from '@/domain/scoring'
import { authActionUser } from '@/lib/api/guard'
import { rateLimit } from '@/lib/api/guard'
import { getLocale } from '@/lib/i18n/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Challenge } from './types'

export async function startSession(args: {
  token: string
  challengeId: string
}): Promise<{ id: string } | null> {
  const a = await authActionUser(args.token)
  if ('error' in a) return null

  // Reuse the open session for this challenge instead of creating a new row on
  // every mount (reopening, refreshing, or coming back to the same challenge).
  const { data: open } = await supabaseAdmin
    .from('sessions')
    .select('id')
    .eq('user_id', a.userId)
    .eq('challenge_id', args.challengeId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (open) return { id: (open as { id: string }).id }

  const { data } = await supabaseAdmin
    .from('sessions')
    .insert({ user_id: a.userId, challenge_id: args.challengeId })
    .select()
    .single()
  return data ? { id: (data as { id: string }).id } : null
}

export async function completeSession(args: {
  token: string
  id: string
  status?: 'completed' | 'abandoned'
  durationSeconds?: number
}): Promise<void> {
  const a = await authActionUser(args.token)
  if ('error' in a) return
  const { data: own } = await supabaseAdmin
    .from('sessions')
    .select('user_id, challenge_id, points, challenges(level)')
    .eq('id', args.id)
    .maybeSingle()
  const session = own as {
    user_id: string
    challenge_id: string
    points: number | null
    challenges: { level: string } | null
  } | null
  if (!session || session.user_id !== a.userId) return

  const { data: hints } = await supabaseAdmin
    .from('hints_used')
    .select('hint_level, is_solve')
    .eq('session_id', args.id)
  const independence = computeIndependence(
    (hints ?? []) as { hint_level: number; is_solve: boolean }[],
  )

  const status = args.status ?? 'completed'

  // Ranking points: awarded once per (user, challenge) — repeating a challenge
  // or re-submitting the same session must not farm points.
  let points = session.points ?? 0
  if (status === 'completed' && session.points === null) {
    const { data: prior } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('user_id', a.userId)
      .eq('challenge_id', session.challenge_id)
      .eq('status', 'completed')
      .gt('points', 0)
      .neq('id', args.id)
      .limit(1)
      .maybeSingle()
    points = prior
      ? 0
      : challengePoints(session.challenges?.level ?? 'beginner', independence)
    if (points > 0) {
      await supabaseAdmin.rpc(
        'add_points' as never,
        { p_user: a.userId, p_amount: points } as never,
      )
    }
  }

  const base =
    typeof args.durationSeconds === 'number'
      ? {
          status,
          completed_at: new Date().toISOString(),
          duration_seconds: Math.max(0, Math.floor(args.durationSeconds)),
        }
      : { status, completed_at: new Date().toISOString() }
  await supabaseAdmin
    .from('sessions')
    .update({ ...base, independence, points })
    .eq('id', args.id)
  revalidatePath('/dashboard')
  revalidatePath('/profile')
  revalidatePath('/ranking')
}

export type SessionRow = {
  id: string
  challenge_id: string
  status: string
  started_at: string
  challenges: { title: string; stack: string; kind?: string } | null
}

export async function listSessionsForUser(
  token: string,
): Promise<SessionRow[]> {
  const a = await authActionUser(token)
  if ('error' in a) return []
  const { data } = await supabaseAdmin
    .from('sessions')
    .select(
      'id, challenge_id, status, started_at, challenges(title, stack, kind)',
    )
    .eq('user_id', a.userId)
    .order('started_at', { ascending: false })
  return (data ?? []) as unknown as SessionRow[]
}

export async function getTrainingRecommendation(input: {
  token: string
  kind: 'code' | 'design'
  stack?: string
  level: GenLevel
}): Promise<{ text: string } | { error: string }> {
  const a = await authActionUser(input.token)
  if ('error' in a) return { error: 'Não autenticado.' }
  if (!rateLimit(`recommend:${a.userId}`, 10, 60_000)) {
    return { error: 'Muitas requisições. Aguarde um momento.' }
  }

  try {
    const [profileR, sessionsR, hintsR, communityR] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('total_challenges_completed, total_hints_used')
        .eq('id', a.userId)
        .maybeSingle(),
      supabaseAdmin
        .from('sessions')
        .select('status, challenges(title, stack, level)')
        .eq('user_id', a.userId)
        .order('started_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('hints_used')
        .select('hint_level')
        .eq('user_id', a.userId)
        .order('used_at', { ascending: false })
        .limit(30),
      supabaseAdmin
        .from('challenges')
        .select('title')
        .eq('kind', input.kind)
        .eq('level', input.level)
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    const prof = profileR.data
    const recent = (sessionsR.data ?? []) as unknown as {
      status: string
      challenges: { title: string; stack: string; level: string } | null
    }[]
    const recentTitles = recent
      .map((s) =>
        s.challenges
          ? `${s.challenges.title} (${s.status === 'completed' ? 'completado' : s.status})`
          : null,
      )
      .filter(Boolean)
      .slice(0, 8) as string[]
    const hintLevels = (hintsR.data ?? []).map((h) => h.hint_level)
    const communityTitles = (communityR.data ?? []).map((c) => c.title)

    const user = [
      `Trilha: ${input.kind === 'design' ? 'system design (arquitetura)' : 'código'}`,
      input.stack ? `Linguagem: ${input.stack}` : '',
      `Nível: ${input.level}`,
      `Desafios completados na vida: ${prof?.total_challenges_completed ?? 0}`,
      `Hints usados na vida: ${prof?.total_hints_used ?? 0}`,
      recentTitles.length
        ? `Desafios recentes do aluno:\n- ${recentTitles.join('\n- ')}`
        : 'O aluno ainda não fez nenhum desafio.',
      hintLevels.length
        ? `Níveis dos hints recentes (1=leve, 3=quase resposta): ${hintLevels.join(', ')}`
        : '',
      communityTitles.length
        ? `Temas que outros alunos desse nível estão treinando:\n- ${communityTitles.join('\n- ')}`
        : '',
      '',
      'Gere a recomendação do que treinar agora.',
    ]
      .filter(Boolean)
      .join('\n')

    const text = await askClaude({
      system: recommendSystem(await getLocale()),
      user,
      maxTokens: 300,
      effort: 'low',
    })
    if (!text.trim()) return { error: 'Sem recomendação.' }
    return { text: text.trim() }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro inesperado' }
  }
}

async function doGenerate(input: {
  kind: 'code' | 'design'
  stack?: string
  level: GenLevel
  userPrompt?: string
}): Promise<Challenge | { error: string }> {
  try {
    const { data, error } = await runGenerate({
      kind: input.kind,
      stack: input.stack,
      level: input.level,
      userPrompt: input.userPrompt,
      locale: await getLocale(),
    })
    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return data as unknown as Challenge
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro inesperado' }
  }
}

export async function generateChallenge(input: {
  token: string
  kind: 'code' | 'design'
  stack?: string
  level: GenLevel
  userPrompt?: string
}): Promise<Challenge | { error: string }> {
  const a = await authActionUser(input.token)
  if ('error' in a) return a
  if (!rateLimit(`generate:${a.userId}`, 10, 60_000)) {
    return { error: 'Muitas requisições. Aguarde um momento.' }
  }
  return doGenerate(input)
}

export async function getNextChallenge(input: {
  token: string
  kind: 'code' | 'design'
  stack?: string
  level: GenLevel
}): Promise<Challenge | { error: string }> {
  const a = await authActionUser(input.token)
  if ('error' in a) return a
  if (!rateLimit(`next-challenge:${a.userId}`, 20, 60_000)) {
    return { error: 'Muitas requisições. Aguarde um momento.' }
  }

  const kind = input.kind
  const level: GenLevel =
    input.level === 'intermediate' || input.level === 'advanced'
      ? input.level
      : 'beginner'
  const stackMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    react: 'react',
    python: 'python',
  }
  const stack = stackMap[input.stack ?? ''] ?? 'typescript'

  const { data: seen } = await supabaseAdmin
    .from('sessions')
    .select('challenge_id')
    .eq('user_id', a.userId)
  const seenIds = [...new Set((seen ?? []).map((s) => s.challenge_id))]

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

  return doGenerate({ kind, stack, level })
}
