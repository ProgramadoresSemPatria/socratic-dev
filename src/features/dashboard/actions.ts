'use server'

import { computeIndependence } from '@/domain/scoring'
import { authActionUser } from '@/lib/api/guard'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Stats } from './types'

function getDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function calcStreak(startedAtDates: string[]): number {
  if (startedAtDates.length === 0) return 0
  const days = Array.from(
    new Set(startedAtDates.map((d) => d.slice(0, 10))),
  ).sort((a, b) => b.localeCompare(a))

  const today = new Date().toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== getYesterday()) return 0

  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) streak++
    else break
  }
  return streak
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
        'id, status, started_at, completed_at, challenge_id, independence',
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

  return {
    total_completed: completedCount,
    total_hints: totalHints,
    avg_hints_per_session: avgHintsPerSession,
    independence_score: independenceScore,
    streak_days: streak,
    week_progress: weekProgress,
  }
}
