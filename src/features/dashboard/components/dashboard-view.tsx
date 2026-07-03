'use client'

import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { stackById } from '@/domain/stacks'
import {
  getNextChallenge,
  listSessionsForUser,
  type SessionRow,
} from '@/features/challenges/actions'
import { CustomChallengeDialog } from '@/features/challenges/components/custom-challenge-dialog'
import { getDashboardStats } from '@/features/dashboard/actions'
import type { Stats } from '@/features/dashboard/types'
import { activityLevel } from '@/features/dashboard/utils'
import { Halftone, glyph } from '@/features/landing/components/halftone'
import { getAccessToken } from '@/lib/api/client'
import { useLocale, useT } from '@/lib/i18n'
import type { User } from '@supabase/supabase-js'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Network,
  PenLine,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts'

const copy = {
  en: {
    welcome: 'Welcome back',
    youAre: "You're",
    independentSuffix: '% independent',
    keepGoing:
      'Every challenge you solve without copy-paste counts. Socrates would approve.',
    startPrompt: 'Start a challenge to build your progress.',
    custom: 'Custom',
    newChallenge: 'New challenge',
    statStreak: 'Streak',
    statStreakHint: 'days in a row',
    statChallenges: 'Challenges',
    statChallengesHint: 'completed',
    statHintsPer: 'Hints/challenge',
    statHintsPerHint: 'average',
    statTotalHints: 'Total hints',
    statTotalHintsHint: 'used',
    journeyEyebrow: 'Your journey',
    journeyTitle: 'Activity over the past few months',
    dow: ['', 'Mon', '', 'Wed', '', 'Fri', ''],
    challengeOne: 'challenge',
    challengeMany: 'challenges',
    less: 'Less',
    more: 'More',
    scoreEyebrow: 'Current score',
    scoreTitle: 'Total independence',
    scoreCaption: 'how much you solve on your own',
    historyEyebrow: 'History',
    historyTitle: 'Recent challenges',
    of: 'of',
    historyEmpty: "No challenges yet. Start one and it'll show up here.",
    challengeFallback: 'Challenge',
    status: {
      completed: 'Completed',
      in_progress: 'In progress',
      abandoned: 'Failed',
    },
    open: 'Open',
    resume: 'Resume',
    loadError: "Couldn't load your data.",
    retry: 'Retry',
    startFailed: "Couldn't generate the challenge. Try again.",
    quote:
      'What comes out of your head is worth a thousand times more than what comes out of mine.',
    quoteBy: 'Socratic tutor, just now',
  },
  pt: {
    welcome: 'Bem-vindo de volta',
    youAre: 'Você está',
    independentSuffix: '% independente',
    keepGoing: 'Cada desafio sem cola conta. Sócrates aprovaria.',
    startPrompt: 'Comece um desafio para construir seu progresso.',
    custom: 'Sob medida',
    newChallenge: 'Novo desafio',
    statStreak: 'Streak',
    statStreakHint: 'dias seguidos',
    statChallenges: 'Desafios',
    statChallengesHint: 'concluídos',
    statHintsPer: 'Hints/desafio',
    statHintsPerHint: 'média',
    statTotalHints: 'Hints totais',
    statTotalHintsHint: 'usados',
    journeyEyebrow: 'Sua jornada',
    journeyTitle: 'Atividade dos últimos meses',
    dow: ['', 'Seg', '', 'Qua', '', 'Sex', ''],
    challengeOne: 'desafio',
    challengeMany: 'desafios',
    less: 'Menos',
    more: 'Mais',
    scoreEyebrow: 'Score atual',
    scoreTitle: 'Independência total',
    scoreCaption: 'quanto você resolve sozinho',
    historyEyebrow: 'Histórico',
    historyTitle: 'Desafios recentes',
    of: 'de',
    historyEmpty: 'Nenhum desafio ainda. Comece um para aparecer aqui.',
    challengeFallback: 'Desafio',
    status: {
      completed: 'Concluído',
      in_progress: 'Em andamento',
      abandoned: 'Reprovado',
    },
    open: 'Abrir',
    resume: 'Retomar',
    loadError: 'Não foi possível carregar seus dados.',
    retry: 'Tentar novamente',
    startFailed: 'Não foi possível gerar o desafio. Tente novamente.',
    quote:
      'O que sai da sua cabeça vale mil vezes mais que o que sai da minha.',
    quoteBy: 'Tutor Socrático, agora há pouco',
  },
}

const CELL = [
  'bg-muted',
  'bg-pastel-sage',
  'bg-primary/35',
  'bg-primary/75',
  'bg-primary',
]

const EASE = [0.16, 1, 0.3, 1] as const

export function DashboardView({ user }: { user: User }) {
  const t = useT(copy)
  const router = useRouter()
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [sessions, setSessions] = React.useState<SessionRow[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [loadError, setLoadError] = React.useState(false)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [startError, setStartError] = React.useState<string | null>(null)
  const [genDesign, setGenDesign] = React.useState(false)
  const [genCode, setGenCode] = React.useState(false)
  const [customOpen, setCustomOpen] = React.useState(false)

  React.useEffect(() => {
    if (!startError) return
    const id = setTimeout(() => setStartError(null), 6000)
    return () => clearTimeout(id)
  }, [startError])

  async function startDesign() {
    if (genDesign || !user) return
    setGenDesign(true)
    try {
      const level =
        (user?.user_metadata?.preferred_level as string | undefined) ??
        'intermediate'
      const data = await getNextChallenge({
        kind: 'design',
        level: level as 'beginner' | 'intermediate' | 'advanced',
        token: await getAccessToken(),
      })
      if (!('error' in data) && data?.id) router.push(`/design?id=${data.id}`)
      else {
        setStartError('error' in data ? data.error : t.startFailed)
        setGenDesign(false)
      }
    } catch {
      setStartError(t.startFailed)
      setGenDesign(false)
    }
  }

  async function startCode() {
    if (genCode || !user) return
    const meta = user.user_metadata as
      | { preferred_stack?: string; preferred_level?: string }
      | undefined
    if (!meta?.preferred_stack || !meta?.preferred_level) {
      router.push('/onboarding')
      return
    }
    setGenCode(true)
    try {
      const data = await getNextChallenge({
        kind: 'code',
        stack: meta.preferred_stack,
        level: meta.preferred_level as 'beginner' | 'intermediate' | 'advanced',
        token: await getAccessToken(),
      })
      if (!('error' in data) && data?.id)
        router.push(`/challenge?id=${data.id}`)
      else {
        setStartError('error' in data ? data.error : t.startFailed)
        setGenCode(false)
      }
    } catch {
      setStartError(t.startFailed)
      setGenCode(false)
    }
  }

  React.useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      try {
        const token = await getAccessToken()
        const [s, sess] = await Promise.all([
          getDashboardStats(token),
          listSessionsForUser(token),
        ])
        if (!active) return
        if (s && !('error' in s)) setStats(s)
        else setLoadError(true)
        setSessions(sess)
      } catch {
        if (active) setLoadError(true)
      } finally {
        if (active) setLoaded(true)
      }
    })()
    return () => {
      active = false
    }
  }, [user, reloadKey])

  function retryLoad() {
    setLoaded(false)
    setLoadError(false)
    setReloadKey((k) => k + 1)
  }

  const score = stats?.independence_score ?? 100

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-background'>
      <Navbar />

      <main className='flex-1 pt-[88px] pb-20 md:pt-24'>
        <div className='container-main max-w-6xl'>
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className='relative mb-12 overflow-hidden rounded-lg bg-pastel-greige/60 px-6 py-10 sm:px-10 lg:px-12 lg:py-12'
          >
            <div className='pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] opacity-20 mix-blend-multiply sm:block dark:mix-blend-screen'>
              <Halftone
                draw={glyph('>_', 1.5)}
                ambient
                spacing={9}
                className='absolute inset-0'
              />
            </div>
            <div className='relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between'>
              <div className='min-w-0'>
                <p className='eyebrow mb-3'>{t.welcome}</p>
                {!loaded ? (
                  <>
                    <Skeleton className='h-11 w-[22rem] max-w-full lg:h-14' />
                    <Skeleton className='mt-4 h-5 w-64 max-w-full' />
                  </>
                ) : loadError ? (
                  <h1 className='type-h2 text-balance'>{t.startPrompt}</h1>
                ) : (
                  <>
                    <h1 className='type-h2 text-balance'>
                      {t.youAre}{' '}
                      <span className='font-serif font-normal text-primary italic'>
                        {score}
                        {t.independentSuffix}
                      </span>
                      .
                    </h1>
                    <div className='mt-5 flex flex-wrap items-center gap-3'>
                      {stats && stats.streak_days > 0 && (
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-ink uppercase dark:text-background'>
                          <TrendingUp className='size-3.5' strokeWidth={1.5} />
                          {stats.streak_days} {t.statStreakHint}
                        </span>
                      )}
                      <p className='type-body'>
                        {stats && stats.total_completed > 0
                          ? t.keepGoing
                          : t.startPrompt}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className='flex flex-col gap-2 lg:shrink-0 lg:items-end'>
                <div className='flex flex-col gap-2 sm:flex-row lg:justify-end'>
                  <Button
                    variant='outline'
                    size='lg'
                    onClick={() => setCustomOpen(true)}
                  >
                    <PenLine strokeWidth={1.5} />
                    {t.custom}
                  </Button>
                  <Button
                    variant='outline'
                    size='lg'
                    onClick={startDesign}
                    loading={genDesign}
                  >
                    <Network strokeWidth={1.5} />
                    System Design
                  </Button>
                  <Button
                    variant='ink'
                    size='lg'
                    onClick={startCode}
                    loading={genCode}
                    className='group'
                  >
                    <Sparkles strokeWidth={1.5} />
                    {t.newChallenge}
                    <ArrowRight className='transition-transform duration-200 group-hover:translate-x-0.5' />
                  </Button>
                </div>
                {startError && (
                  <p role='alert' className='text-sm text-destructive'>
                    {startError}
                  </p>
                )}
              </div>
            </div>
          </motion.section>

          {!loaded ? (
            <DashboardSkeleton />
          ) : loadError ? (
            <div className='flex flex-col items-center rounded-lg border border-border bg-card px-6 py-14 text-center'>
              <p className='text-sm text-muted-foreground'>{t.loadError}</p>
              <Button variant='outline' className='mt-5' onClick={retryLoad}>
                {t.retry}
              </Button>
            </div>
          ) : (
            <>
              <div className='mb-14 grid grid-cols-2 gap-y-10 lg:grid-cols-4'>
                <StatCol
                  i={0}
                  label={t.statStreak}
                  value={String(stats?.streak_days ?? 0)}
                  hint={t.statStreakHint}
                />
                <StatCol
                  i={1}
                  label={t.statChallenges}
                  value={String(stats?.total_completed ?? 0)}
                  hint={t.statChallengesHint}
                />
                <StatCol
                  i={2}
                  label={t.statHintsPer}
                  value={String(stats?.avg_hints_per_session ?? 0)}
                  hint={t.statHintsPerHint}
                />
                <StatCol
                  i={3}
                  label={t.statTotalHints}
                  value={String(stats?.total_hints ?? 0)}
                  hint={t.statTotalHintsHint}
                />
              </div>

              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6, ease: EASE }}
                className='mb-10 border-t border-border pt-8'
              >
                <div className='grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-0'>
                  <ActivityHeatmap sessions={sessions} />
                  <IndependenceRing score={score} />
                </div>
              </motion.section>

              <RecentChallenges
                items={sessions}
                onNew={startCode}
                creating={genCode}
              />

              <motion.figure
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
                className='mt-14 rounded-lg bg-ink px-6 py-12 lg:px-14 lg:py-14 dark:border dark:border-border dark:bg-card'
              >
                <blockquote className='max-w-[720px] font-serif text-2xl leading-snug font-light text-background italic lg:text-[32px] dark:text-foreground'>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className='mt-8 flex items-center gap-3'>
                  <span className='grid size-10 shrink-0 place-items-center rounded-full bg-lime font-heading text-lg font-light text-ink dark:text-background'>
                    Σ
                  </span>
                  <span className='font-mono text-xs tracking-wide text-background/50 dark:text-foreground/50'>
                    {t.quoteBy}
                  </span>
                </figcaption>
              </motion.figure>
            </>
          )}
        </div>
      </main>
      <CustomChallengeDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        defaultLevel={
          (user?.user_metadata?.preferred_level as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | undefined) ?? 'intermediate'
        }
      />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className='mb-14 grid grid-cols-2 gap-y-10 lg:grid-cols-4'>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`border-border px-5 lg:px-8 ${
              i === 0 ? '' : i === 2 ? 'lg:border-l' : 'border-l'
            }`}
          >
            <Skeleton className='h-12 w-16' />
            <Skeleton className='mt-3 h-3 w-20' />
            <Skeleton className='mt-2 h-3 w-14' />
          </div>
        ))}
      </div>
      <div className='mb-10 border-t border-border pt-8'>
        <div className='grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:gap-0'>
          <div className='lg:pr-10'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='mt-3 h-6 w-56 max-w-full' />
            <Skeleton className='mt-8 h-36 w-full' />
          </div>
          <div className='border-t border-border pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10'>
            <Skeleton className='h-3 w-20' />
            <Skeleton className='mt-3 h-6 w-40 max-w-full' />
            <div className='mt-8 grid place-items-center'>
              <Skeleton className='size-40 rounded-full' />
            </div>
          </div>
        </div>
      </div>
      <div className='border-t border-border pt-8'>
        <Skeleton className='h-3 w-20' />
        <Skeleton className='mt-3 h-6 w-48 max-w-full' />
        <div className='mt-8'>
          {[0, 1, 2].map((i) => (
            <div key={i} className='border-t border-border py-5'>
              <Skeleton className='h-5 w-2/3' />
              <Skeleton className='mt-2 h-3 w-40' />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function StatCol({
  i,
  label,
  value,
  hint,
}: {
  i: number
  label: string
  value: string
  hint: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }}
      className={`border-border px-5 lg:px-8 ${
        i === 0 ? '' : i === 2 ? 'lg:border-l' : 'border-l'
      }`}
    >
      <div className='font-heading text-5xl leading-none font-light tracking-tight text-ink tabular-nums lg:text-[56px]'>
        {value}
      </div>
      <div className='mt-3 font-mono text-[11px] tracking-wider text-muted-foreground uppercase'>
        {label}
      </div>
      <div className='mt-1 font-mono text-[11px] text-muted-foreground/70'>
        {hint}
      </div>
    </motion.div>
  )
}

const WEEKS = 18

function localDateKey(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ActivityHeatmap({ sessions }: { sessions: SessionRow[] }) {
  const t = useT(copy)
  const counts: Record<string, number> = {}
  for (const s of sessions) {
    if (!s.started_at) continue
    const key = localDateKey(s.started_at)
    counts[key] = (counts[key] ?? 0) + 1
  }
  const max = Math.max(1, ...Object.values(counts))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7)

  const days: { key: string; count: number; future: boolean }[] = []
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({
      key: localDateKey(d),
      count: counts[localDateKey(d)] ?? 0,
      future: d > today,
    })
  }

  return (
    <div className='lg:pr-12'>
      <p className='eyebrow'>{t.journeyEyebrow}</p>
      <h2 className='type-h4 mt-2'>{t.journeyTitle}</h2>
      <div className='mt-8 flex gap-2 overflow-x-auto pb-1'>
        <div className='grid grid-rows-7 gap-1 pr-1'>
          {t.dow.map((l, i) => (
            <span
              key={i}
              className='flex h-[14px] items-center font-mono text-[9px] text-muted-foreground'
            >
              {l}
            </span>
          ))}
        </div>
        <div className='grid grid-flow-col grid-rows-7 gap-1'>
          {days.map((d) => (
            <div
              key={d.key}
              title={`${d.key}: ${d.count} ${d.count === 1 ? t.challengeOne : t.challengeMany}`}
              className={
                d.future
                  ? 'size-[14px] opacity-0'
                  : `size-[14px] rounded-[4px] ${CELL[activityLevel(d.count, max)]}`
              }
            />
          ))}
        </div>
      </div>
      <div className='mt-6 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground'>
        <span>{t.less}</span>
        {CELL.map((c, l) => (
          <span key={l} className={`size-[14px] rounded-[4px] ${c}`} />
        ))}
        <span>{t.more}</span>
      </div>
    </div>
  )
}

function IndependenceRing({ score }: { score: number }) {
  const t = useT(copy)
  const data = [{ name: 'indep', value: score, fill: 'var(--chart-1)' }]
  return (
    <div className='flex flex-col items-start border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12'>
      <p className='eyebrow'>{t.scoreEyebrow}</p>
      <h2 className='type-h4 mt-2'>{t.scoreTitle}</h2>
      <div className='relative mx-auto mt-5 size-[170px]'>
        <ResponsiveContainer width='100%' height='100%'>
          <RadialBarChart
            innerRadius='76%'
            outerRadius='100%'
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type='number' domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: 'var(--pastel-mist)' }}
              dataKey='value'
              fill='var(--chart-1)'
              cornerRadius={20}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className='pointer-events-none absolute inset-0 grid place-items-center'>
          <span className='font-heading text-4xl font-light tracking-tight text-ink tabular-nums'>
            {score}%
          </span>
        </div>
      </div>
      <p className='mx-auto mt-4 max-w-[220px] text-center font-mono text-[11px] text-muted-foreground'>
        {t.scoreCaption}
      </p>
    </div>
  )
}

function RecentChallenges({
  items,
  onNew,
  creating,
}: {
  items: SessionRow[]
  onNew: () => void
  creating: boolean
}) {
  const t = useT(copy)
  const { locale } = useLocale()
  const PAGE_SIZE = 6
  const [page, setPage] = React.useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const start = page * PAGE_SIZE
  const pageItems = items.slice(start, start + PAGE_SIZE)

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
      className='border-t border-border pt-8'
    >
      <div className='flex items-end justify-between gap-4'>
        <div>
          <p className='eyebrow'>{t.historyEyebrow}</p>
          <h2 className='type-h3 mt-2'>{t.historyTitle}</h2>
        </div>
        {items.length > PAGE_SIZE && (
          <div className='flex items-center gap-2 font-mono text-[11px] text-muted-foreground'>
            <span className='sm:hidden'>
              {page + 1}/{totalPages}
            </span>
            <span className='hidden sm:inline'>
              {start + 1}–{Math.min(start + PAGE_SIZE, items.length)} {t.of}{' '}
              {items.length}
            </span>
            <Button
              variant='outline'
              size='icon-sm'
              className='size-8 sm:size-8'
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className='size-4' />
            </Button>
            <Button
              variant='outline'
              size='icon-sm'
              className='size-8 sm:size-8'
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className='mt-8 flex flex-col items-start gap-5 border-t border-border pt-8'>
          <p className='text-sm text-muted-foreground'>{t.historyEmpty}</p>
          <Button variant='ink' onClick={onNew} loading={creating}>
            <Sparkles strokeWidth={1.5} />
            {t.newChallenge}
          </Button>
        </div>
      ) : (
        <div className='mt-8'>
          {pageItems.map((c) => {
            const isDesign = c.challenges?.kind === 'design'
            const href = `${isDesign ? '/design' : '/challenge'}?id=${c.challenge_id}`
            const stackLabel = isDesign
              ? 'System Design'
              : (stackById(c.challenges?.stack ?? '')?.label ??
                c.challenges?.stack ??
                '')
            return (
              <Link
                key={c.id}
                href={href}
                className='group flex flex-col gap-2 border-t border-border py-5 sm:flex-row sm:items-center sm:gap-6'
              >
                <div className='min-w-0 flex-1'>
                  <div className='truncate font-heading text-lg font-light tracking-tight text-ink transition-colors duration-200 group-hover:text-primary'>
                    {c.challenges?.title ?? t.challengeFallback}
                  </div>
                  <div className='mt-1.5 font-mono text-[11px] tracking-wide text-muted-foreground'>
                    {new Date(c.started_at).toLocaleDateString(
                      locale === 'pt' ? 'pt-BR' : 'en-US',
                    )}{' '}
                    · {stackLabel}
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-4'>
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase ${
                      c.status === 'completed'
                        ? 'bg-lime text-ink dark:text-background'
                        : 'border border-border text-muted-foreground'
                    }`}
                  >
                    {(t.status as Record<string, string>)[c.status] ?? c.status}
                  </span>
                  <span className='inline-flex items-center gap-1 font-mono text-[11px] text-primary opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100'>
                    {c.status === 'completed' ? t.open : t.resume}
                    <ArrowRight className='size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </motion.section>
  )
}
