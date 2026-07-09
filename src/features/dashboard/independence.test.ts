import { describe, expect, it } from 'vitest'
import {
  independenceTrend,
  skillBreakdown,
  skillTarget,
  weakestSkill,
  type SkillSession,
} from './independence'

function session(over: Partial<SkillSession>): SkillSession {
  return {
    challengeId: 'c1',
    independence: 100,
    completedAt: '2026-07-01T10:00:00Z',
    stack: 'javascript',
    kind: 'code',
    ...over,
  }
}

describe('skillBreakdown', () => {
  it('is empty with no sessions', () => {
    expect(skillBreakdown([])).toEqual([])
  })

  it('groups by stack and averages independence', () => {
    const stats = skillBreakdown([
      session({ challengeId: 'a', stack: 'javascript', independence: 80 }),
      session({ challengeId: 'b', stack: 'javascript', independence: 60 }),
      session({ challengeId: 'c', stack: 'python', independence: 40 }),
    ])
    const js = stats.find((s) => s.key === 'javascript')
    const py = stats.find((s) => s.key === 'python')
    expect(js).toMatchObject({ avgIndependence: 70, completed: 2 })
    expect(py).toMatchObject({ avgIndependence: 40, completed: 1 })
  })

  it('classifies design challenges by kind regardless of stack', () => {
    const stats = skillBreakdown([
      session({ challengeId: 'd', kind: 'design', stack: null, independence: 55 }),
    ])
    expect(stats).toHaveLength(1)
    expect(stats[0]).toMatchObject({ key: 'design', label: 'System Design' })
  })

  it('counts each challenge once, keeping the most recent completion', () => {
    const stats = skillBreakdown([
      session({ challengeId: 'a', completedAt: '2026-07-01T10:00:00Z', independence: 20 }),
      session({ challengeId: 'a', completedAt: '2026-07-05T10:00:00Z', independence: 90 }),
    ])
    expect(stats[0]).toMatchObject({ completed: 1, avgIndependence: 90 })
  })

  it('ignores sessions with an unknown stack', () => {
    const stats = skillBreakdown([
      session({ challengeId: 'x', stack: 'rust', kind: 'code' }),
    ])
    expect(stats).toEqual([])
  })

  it('attaches a tier derived from the average', () => {
    const stats = skillBreakdown([
      session({ challengeId: 'a', stack: 'react', independence: 90 }),
    ])
    expect(stats[0].tier).toBe('high')
  })
})

describe('independenceTrend', () => {
  it('returns points oldest to newest', () => {
    const trend = independenceTrend([
      session({ challengeId: 'b', completedAt: '2026-07-02T10:00:00Z', independence: 70 }),
      session({ challengeId: 'a', completedAt: '2026-07-01T10:00:00Z', independence: 40 }),
    ])
    expect(trend.map((p) => p.value)).toEqual([40, 70])
  })

  it('dedupes by challenge before plotting', () => {
    const trend = independenceTrend([
      session({ challengeId: 'a', completedAt: '2026-07-01T10:00:00Z', independence: 30 }),
      session({ challengeId: 'a', completedAt: '2026-07-04T10:00:00Z', independence: 80 }),
    ])
    expect(trend).toEqual([{ date: '2026-07-04T10:00:00Z', value: 80 }])
  })

  it('keeps only the last N points', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      session({
        challengeId: `c${i}`,
        completedAt: `2026-07-0${i + 1}T10:00:00Z`,
        independence: i * 10,
      }),
    )
    expect(independenceTrend(many, 2).map((p) => p.value)).toEqual([30, 40])
  })
})

describe('weakestSkill', () => {
  it('returns null when nothing meets the minimum sample', () => {
    const breakdown = skillBreakdown([
      session({ challengeId: 'a', stack: 'javascript', independence: 50 }),
    ])
    expect(weakestSkill(breakdown, 2)).toBeNull()
  })

  it('picks the lowest average', () => {
    const breakdown = skillBreakdown([
      session({ challengeId: 'a', stack: 'javascript', independence: 90 }),
      session({ challengeId: 'b', stack: 'python', independence: 30 }),
    ])
    expect(weakestSkill(breakdown)?.key).toBe('python')
  })

  it('breaks ties toward more evidence', () => {
    const breakdown = skillBreakdown([
      session({ challengeId: 'a', stack: 'javascript', independence: 50 }),
      session({ challengeId: 'b', stack: 'python', independence: 50 }),
      session({ challengeId: 'c', stack: 'python', independence: 50 }),
    ])
    expect(weakestSkill(breakdown)?.key).toBe('python')
  })
})

describe('skillTarget', () => {
  it('maps a code stack to a code challenge target', () => {
    expect(skillTarget('typescript')).toEqual({ kind: 'code', stack: 'typescript' })
  })

  it('maps design to a design challenge target', () => {
    expect(skillTarget('design')).toEqual({ kind: 'design' })
  })
})
