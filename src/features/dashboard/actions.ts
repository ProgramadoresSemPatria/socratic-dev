'use server'

import { computeIndependence } from '@/domain/scoring'
import { authActionUser } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  independenceTrend,
  skillBreakdown,
  type SkillSession,
} from './independence'
import { calcStreak } from './streak'
import type { Stats } from './types'

function getDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export async function getStreak(token: string): Promise<number> {
  const a = await authActionUser(token)
  if ('error' in a) return 0
  const { data } = await supabaseAdmin
    .from('sessions')
    .select('started_at')
    .eq('user_id', a.userId)
    .eq('status', 'completed')
    .gte('started_at', getDateDaysAgo(120))
  return calcStreak((data ?? []).map((s) => s.started_at))
}

function buildWeekProgress(
  startedAtDates: string[],
): { day: string; value: number }[] {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const result: { day: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = days[d.getDay()]
    const count = startedAtDates.filter((s) => s.startsWith(dateStr)).length
    result.push({ day: label, value: count })
  }
  return result
}

export async function getDashboardStats(
  token: string,
): Promise<Stats | { error: string }> {
  const a = await authActionUser(token)
  if ('error' in a) return { error: 'Não autenticado.' }
  const userId = a.userId
  const [sessionsResult, hintsResult, weekResult] = await Promise.all([
    supabaseAdmin
      .from('sessions')
      .select(
        'id, status, started_at, completed_at, challenge_id, independence, challenges(stack, kind)',
      )
      .eq('user_id', userId),
    supabaseAdmin
      .from('hints_used')
      .select('hint_level, used_at, session_id, is_solve')
      .eq('user_id', userId),
    supabaseAdmin
      .from('sessions')
      .select('started_at, id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', getDateDaysAgo(7)),
  ])

  if (sessionsResult.error || hintsResult.error || weekResult.error) {
    return { error: 'Não foi possível carregar as estatísticas.' }
  }

  const sessions = sessionsResult.data
  const hints = hintsResult.data
  const weekSessions = weekResult.data

  const completed = sessions.filter((s) => s.status === 'completed')

  // Count distinct challenges, not raw completed rows: the same challenge can
  // have several completed sessions. Keep the most recent one per challenge.
  const completedByChallenge = new Map<string, (typeof completed)[number]>()
  for (const s of completed) {
    const prev = completedByChallenge.get(s.challenge_id)
    if (!prev || s.started_at > prev.started_at) {
      completedByChallenge.set(s.challenge_id, s)
    }
  }
  const uniqueCompleted = [...completedByChallenge.values()]
  const completedCount = uniqueCompleted.length

  const realHints = hints.filter((h) => !h.is_solve)
  const totalHints = realHints.length
  const avgHintsPerSession =
    completedCount > 0
      ? Math.round((totalHints / completedCount) * 10) / 10
      : 0

  const hintsBySession = new Map<string, typeof hints>()
  for (const h of hints) {
    const list = hintsBySession.get(h.session_id) ?? []
    list.push(h)
    hintsBySession.set(h.session_id, list)
  }
  const independenceScore =
    completedCount > 0
      ? Math.round(
          uniqueCompleted.reduce(
            (sum, s) =>
              sum +
              (s.independence ??
                computeIndependence(hintsBySession.get(s.id) ?? [])),
            0,
          ) / completedCount,
        )
      : 100

  const streak = calcStreak(completed.map((s) => s.started_at))
  const weekProgress = buildWeekProgress(weekSessions.map((s) => s.started_at))

  // Per-skill breakdown and progress-over-time: the helper dedupes by challenge
  // and resolves independence with the same hint fallback used above.
  const skillSessions: SkillSession[] = completed.map((s) => {
    const challenge = (s as { challenges: { stack: string; kind: string | null } | null })
      .challenges
    return {
      challengeId: s.challenge_id,
      independence: s.independence ?? computeIndependence(hintsBySession.get(s.id) ?? []),
      completedAt: s.completed_at ?? s.started_at,
      stack: challenge?.stack ?? null,
      kind: challenge?.kind ?? null,
    }
  })

  return {
    total_completed: completedCount,
    total_hints: totalHints,
    avg_hints_per_session: avgHintsPerSession,
    independence_score: independenceScore,
    streak_days: streak,
    week_progress: weekProgress,
    skill_breakdown: skillBreakdown(skillSessions),
    independence_trend: independenceTrend(skillSessions),
  }
}
