'use client'

import type { SkillStat } from '@/features/dashboard/independence'
import { useT } from '@/lib/i18n'
import { motion } from 'motion/react'

const copy = {
  en: {
    eyebrow: 'By skill',
    title: 'Where you stand',
    empty: 'Finish a challenge and your skills show up here.',
    completedOne: 'challenge',
    completedMany: 'challenges',
    tierLabel: {
      high: 'Independent',
      mid: 'Getting there',
      low: 'Leaning on hints',
    },
  },
  pt: {
    eyebrow: 'Por skill',
    title: 'Onde você está',
    empty: 'Conclua um desafio e suas skills aparecem aqui.',
    completedOne: 'desafio',
    completedMany: 'desafios',
    tierLabel: {
      high: 'Independente',
      mid: 'Chegando lá',
      low: 'Dependendo de hints',
    },
  },
}

export const TIER_BAR: Record<SkillStat['tier'], string> = {
  high: 'bg-chart-1',
  mid: 'bg-chart-2',
  low: 'bg-chart-3',
}

const EASE = [0.16, 1, 0.3, 1] as const

export function SkillBreakdown({ breakdown }: { breakdown: SkillStat[] }) {
  const t = useT(copy)

  return (
    <div className='lg:pr-12'>
      <p className='eyebrow'>{t.eyebrow}</p>
      <h2 className='type-h4 mt-2'>{t.title}</h2>

      {breakdown.length === 0 ? (
        <p className='mt-8 text-sm text-muted-foreground'>{t.empty}</p>
      ) : (
        <ul className='mt-8 flex flex-col gap-6'>
          {breakdown.map((skill, i) => (
            <motion.li
              key={skill.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }}
            >
              <div className='flex items-baseline justify-between gap-4'>
                <span className='truncate text-sm font-medium text-ink'>
                  {skill.label}
                </span>
                <span className='font-heading text-xl font-light tracking-tight text-ink tabular-nums'>
                  {skill.avgIndependence}%
                </span>
              </div>
              <div
                className='mt-2 h-2 w-full overflow-hidden rounded-full bg-pastel-mist'
                role='meter'
                aria-valuenow={skill.avgIndependence}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={skill.label}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.avgIndependence}%` }}
                  transition={{
                    delay: 0.1 + i * 0.06,
                    duration: 0.6,
                    ease: EASE,
                  }}
                  className={`h-full rounded-full ${TIER_BAR[skill.tier]}`}
                />
              </div>
              <div className='mt-1.5 flex items-center justify-between gap-4 font-mono text-[11px] text-muted-foreground'>
                <span>{t.tierLabel[skill.tier]}</span>
                <span>
                  {skill.completed}{' '}
                  {skill.completed === 1 ? t.completedOne : t.completedMany}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
