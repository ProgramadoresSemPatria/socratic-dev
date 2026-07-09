import { independenceTier } from '@/domain/scoring'
import { stackById } from '@/domain/stacks'

// The dimensions we break the independence score down by: the four code stacks
// plus system design. Derived from a challenge's `stack` (code) or `kind`
// (design), so no extra tagging is needed on challenges.
export type SkillKey = 'javascript' | 'typescript' | 'python' | 'react' | 'design'

export type SkillSession = {
  challengeId: string
  independence: number
  completedAt: string
  stack: string | null
  kind: string | null
}

export type SkillStat = {
  key: SkillKey
  label: string
  avgIndependence: number
  completed: number
  tier: ReturnType<typeof independenceTier>
}

export type TrendPoint = { date: string; value: number }

const SKILL_ORDER: readonly SkillKey[] = [
  'javascript',
  'typescript',
  'python',
  'react',
  'design',
] as const

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)))
}

function labelFor(key: SkillKey): string {
  return key === 'design' ? 'System Design' : (stackById(key)?.label ?? key)
}

function categoryOf(s: SkillSession): SkillKey | null {
  if (s.kind === 'design') return 'design'
  switch (s.stack) {
    case 'javascript':
    case 'typescript':
    case 'python':
    case 'react':
      return s.stack
    default:
      return null
  }
}

// The same challenge can be completed in several sessions. Count each challenge
// once, keeping its most recent completion — mirrors getDashboardStats' distinct
// count so the breakdown and the headline number stay consistent.
function uniqueByChallenge(sessions: SkillSession[]): SkillSession[] {
  const byChallenge = new Map<string, SkillSession>()
  for (const s of sessions) {
    const prev = byChallenge.get(s.challengeId)
    if (!prev || s.completedAt > prev.completedAt) byChallenge.set(s.challengeId, s)
  }
  return [...byChallenge.values()]
}

/** Average independence per skill category, for skills with at least one completed challenge. */
export function skillBreakdown(sessions: SkillSession[]): SkillStat[] {
  const groups = new Map<SkillKey, number[]>()
  for (const s of uniqueByChallenge(sessions)) {
    const key = categoryOf(s)
    if (!key) continue
    const list = groups.get(key) ?? []
    list.push(clampScore(s.independence))
    groups.set(key, list)
  }

  const stats: SkillStat[] = []
  for (const key of SKILL_ORDER) {
    const values = groups.get(key)
    if (!values?.length) continue
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    stats.push({
      key,
      label: labelFor(key),
      avgIndependence: avg,
      completed: values.length,
      tier: independenceTier(avg),
    })
  }
  return stats
}

/** Chronological independence for the last `limit` unique completed challenges (oldest → newest). */
export function independenceTrend(
  sessions: SkillSession[],
  limit = 20,
): TrendPoint[] {
  return uniqueByChallenge(sessions)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .slice(-limit)
    .map((s) => ({ date: s.completedAt, value: clampScore(s.independence) }))
}

/** The skill with the lowest average independence, among those with enough evidence. */
export function weakestSkill(
  breakdown: SkillStat[],
  minSample = 1,
): SkillStat | null {
  const eligible = breakdown.filter((s) => s.completed >= minSample)
  if (!eligible.length) return null
  return eligible.reduce((worst, cur) => {
    if (cur.avgIndependence < worst.avgIndependence) return cur
    // Tie-break toward the skill with more evidence behind the low score.
    if (cur.avgIndependence === worst.avgIndependence && cur.completed > worst.completed)
      return cur
    return worst
  })
}

/** Map a skill key back to the params getNextChallenge / getTrainingRecommendation expect. */
export function skillTarget(key: SkillKey): {
  kind: 'code' | 'design'
  stack?: string
} {
  return key === 'design' ? { kind: 'design' } : { kind: 'code', stack: key }
}
