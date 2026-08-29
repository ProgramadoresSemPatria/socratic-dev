'use client'

import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip'
import { getStreak } from '@/features/dashboard/actions'
import { currentPeriod } from '@/features/hints/period'
import { getHintBalance } from '@/features/hints/actions'
import { getMyRank } from '@/features/ranking/actions'
import { apiFetch, getAccessToken } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Flame, Lightbulb, Trophy } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { copy } from './copy'

export function useHints(enabled: boolean) {
  const [remaining, setRemaining] = React.useState<number | null>(null)
  const [buying, setBuying] = React.useState(false)

  const refresh = React.useCallback(() => {
    if (!enabled) return
    getAccessToken()
      .then((tk) => getHintBalance(tk))
      .then((b) => setRemaining(b.remaining))
      .catch(() => {})
  }, [enabled])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const buy = React.useCallback(async () => {
    if (buying) return
    setBuying(true)
    try {
      const res = await apiFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string }
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      refresh()
    } finally {
      setBuying(false)
    }
  }, [buying, refresh])

  return { remaining, buying, buy }
}

export type Hints = ReturnType<typeof useHints>

export function useRank(enabled: boolean) {
  const [position, setPosition] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getAccessToken()
      .then((tk) => getMyRank(tk))
      .then((r) => {
        if (!cancelled && r) setPosition(r.position)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled])

  return position
}

export function useStreak(enabled: boolean) {
  const [streak, setStreak] = React.useState<number>(0)

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getAccessToken()
      .then((tk) => getStreak(tk))
      .then((s) => {
        if (!cancelled) setStreak(s)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled])

  return streak
}

// Whole days until the weekly allowance resets (Sunday 23:59 BRT), for
// the tooltip on the hints counter.
function daysToReset(): number {
  const ms = currentPeriod().resetsAt.getTime() - Date.now()
  return Math.max(1, Math.ceil(ms / 86_400_000))
}

export function StatusCluster({
  position,
  hints,
  streak,
}: {
  position: number | null
  hints: Hints
  streak: number
}) {
  const t = useT(copy)
  if (position === null && hints.remaining === null && streak <= 0) return null
  return (
    <div className='border-border bg-background hidden h-9 items-stretch overflow-hidden rounded-full border sm:inline-flex'>
      {streak > 0 && (
        <span
          title={`${streak} ${t.streakTitle}`}
          className='text-muted-foreground flex items-center gap-1 pr-2.5 pl-3'
        >
          <Flame className='text-ember size-3.5' strokeWidth={1.5} />
          <span className='font-mono text-[12px] tabular-nums'>{streak}</span>
        </span>
      )}
      {streak > 0 && (position !== null || hints.remaining !== null) && (
        <span aria-hidden className='bg-border my-2 w-px' />
      )}
      {position !== null && (
        <Link
          href='/ranking'
          title={t.yourRank}
          className='text-muted-foreground hover:text-ink hover:bg-secondary flex items-center gap-1.5 pr-2.5 pl-3 transition-colors duration-200'
        >
          <Trophy className='text-primary size-3.5' strokeWidth={1.5} />
          <span className='font-mono text-[12px] tabular-nums'>
            #{position}
          </span>
        </Link>
      )}
      {position !== null && hints.remaining !== null && (
        <span aria-hidden className='bg-border my-2 w-px' />
      )}
      {hints.remaining !== null && (
        <Tooltip>
          <TooltipTrigger
            render={
              <div className='flex cursor-default items-center gap-1.5 pr-3 pl-2.5' />
            }
          >
            <Lightbulb className='text-primary size-3.5' strokeWidth={1.5} />
            <span
              className={cn(
                'font-mono text-[12px] tabular-nums',
                hints.remaining <= 0
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              {hints.remaining}
            </span>
          </TooltipTrigger>
          <TooltipPopup>{t.hintsResetIn(daysToReset())}</TooltipPopup>
        </Tooltip>
      )}
    </div>
  )
}
