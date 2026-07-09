'use client'

import {
  Halftone,
  glyph,
  paintArchitecture,
} from '@/features/landing/components/halftone'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { copy } from './copy'
import { SummaryItem, Tile } from './tile'

const paintCode = glyph('>_', 1.5)

export function TrackStep({
  track,
  stack,
  onTrack,
  onStack,
}: {
  track: string | null
  stack: string | null
  onTrack: (id: string) => void
  onStack: (id: string) => void
}) {
  const t = useT(copy)
  return (
    <div className='space-y-8'>
      <div className='grid gap-4 sm:grid-cols-2'>
        {t.tracks.map((tk) => (
          <Tile
            key={tk.id}
            selected={track === tk.id}
            onClick={() => onTrack(tk.id)}
            className={cn(tk.fill, 'p-6')}
          >
            <span
              className={cn(
                'pointer-events-none relative block h-24 mix-blend-multiply transition-opacity duration-500 dark:mix-blend-screen',
                track === tk.id
                  ? 'opacity-70'
                  : 'opacity-35 group-hover:opacity-60',
              )}
            >
              <Halftone
                draw={tk.id === 'code' ? paintCode : paintArchitecture}
                active={track === tk.id}
                spacing={7}
              />
            </span>
            <span className='mt-6 block font-heading text-xl font-light tracking-tight text-ink'>
              {tk.name}
            </span>
            <span className='mt-1 block text-sm text-muted-foreground'>
              {tk.desc}
            </span>
          </Tile>
        ))}
      </div>

      {track === 'code' && (
        <div>
          <p className='eyebrow mb-4'>{t.language}</p>
          <div className='flex flex-wrap gap-2'>
            {t.stacks.map((s) => (
              <button
                key={s.id}
                type='button'
                onClick={() => onStack(s.id)}
                aria-pressed={stack === s.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-full border px-4 py-2.5 transition-colors duration-200',
                  stack === s.id
                    ? 'border-ink bg-ink text-background'
                    : 'border-border text-muted-foreground hover:border-ink hover:text-ink',
                )}
              >
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    stack === s.id
                      ? 'text-background/60'
                      : 'text-muted-foreground/70',
                  )}
                >
                  {s.icon}
                </span>
                <span className='text-sm font-medium'>{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {track === 'design' && (
        <div className='rounded-lg bg-pastel-sage p-5 text-sm text-muted-foreground'>
          {t.designNotePre}
          <span className='font-medium text-ink'>{t.designNoteBold}</span>
          {t.designNotePost}
        </div>
      )}
    </div>
  )
}

export function LevelStep({
  level,
  onLevel,
}: {
  level: string | null
  onLevel: (id: string) => void
}) {
  const t = useT(copy)
  return (
    <div className='space-y-4'>
      {t.levels.map((l) => (
        <Tile
          key={l.id}
          selected={level === l.id}
          onClick={() => onLevel(l.id)}
          className={cn(
            l.fill,
            'flex items-center gap-5 p-5 pr-12 sm:p-6 sm:pr-14',
          )}
        >
          <span className='flex shrink-0 items-center gap-1'>
            {Array.from({ length: 4 }).map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  'size-[10px] rounded-[3px]',
                  idx < l.intensity ? 'bg-primary/75' : 'bg-ink/10',
                )}
              />
            ))}
          </span>
          <span className='flex-1'>
            <span className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
              <span className='font-heading text-lg font-light tracking-tight text-ink'>
                {l.name}
              </span>
              <span className='font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase'>
                {l.tag}
              </span>
            </span>
            <span className='mt-1 block text-sm text-muted-foreground'>
              {l.desc}
            </span>
          </span>
        </Tile>
      ))}
    </div>
  )
}

export function SummaryStep({
  track,
  stack,
  level,
}: {
  track: string | null
  stack: string | null
  level: string | null
}) {
  const t = useT(copy)
  return (
    <div className='grid grid-cols-2 gap-6 pt-2 sm:gap-10'>
      <SummaryItem
        label={t.trackLabel}
        value={
          track === 'design'
            ? t.designValue
            : (t.stacks.find((s) => s.id === stack)?.name ?? t.codeValue)
        }
      />
      <SummaryItem
        label={t.levelLabel}
        value={t.levels.find((l) => l.id === level)?.name ?? '—'}
      />
    </div>
  )
}
