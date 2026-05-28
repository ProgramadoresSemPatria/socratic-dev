'use client'

import { Navbar } from '@/components/navbar'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from '@/lib/api/client'
import { useUser } from '@/lib/auth/use-user'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Code2,
  Layers,
  Lightbulb,
  Loader2,
  Network,
  Sparkles,
  TrendingUp,
  Trophy,
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

type Stats = {
  total_completed: number
  total_hints: number
  avg_hints_per_session: number
  independence_score: number
  streak_days: number
  week_progress: { day: string; value: number }[]
}

type SessionRow = {
  id: string
  challenge_id: string
  status: string
  started_at: string
  challenges: { title: string; stack: string; kind?: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  completed: 'Concluído',
  in_progress: 'Em andamento',
  abandoned: 'Abandonado',
}

const IRIS = 'oklch(0.55 0.24 285)'

const CELL = ['bg-[#EDF0F2]', 'bg-iris/25', 'bg-iris/45', 'bg-iris/70', 'bg-iris']

function activityLevel(value: number, max: number): number {
  if (value <= 0) return 0
  const r = value / max
  if (r > 0.75) return 4
  if (r > 0.5) return 3
  if (r > 0.25) return 2
  return 1
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [sessions, setSessions] = React.useState<SessionRow[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [genDesign, setGenDesign] = React.useState(false)

  async function startDesign() {
    if (genDesign || !user) return
    setGenDesign(true)
    try {
      const level =
        (user?.user_metadata?.preferred_level as string | undefined) ??
        'intermediate'
      const res = await apiFetch('/api/next-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'design', level }),
      })
      const data = await res.json()
      if (res.ok && data?.id) router.push(`/design?id=${data.id}`)
      else setGenDesign(false)
    } catch {
      setGenDesign(false)
    }
  }

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/dashboard')
  }, [loading, user, router])

  React.useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const [s, sess] = await Promise.all([
        apiFetch('/api/stats').then((r) => r.json()),
        apiFetch('/api/sessions').then((r) => r.json()),
      ])
      if (!active) return
      if (s && !s.error) setStats(s)
      if (Array.isArray(sess)) setSessions(sess)
      setLoaded(true)
    })()
    return () => {
      active = false
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className='grid min-h-screen flex-1 place-items-center text-sm text-[#6b6478]'>
        Carregando…
      </div>
    )
  }

  const score = stats?.independence_score ?? 100

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-white'>
      <Navbar />

      <main className='flex-1 pt-[88px] pb-20 md:pt-24'>
        <div className='container-main max-w-6xl'>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between'
          >
            <div className='min-w-0'>
              <div className='mb-2 font-mono text-[11px] tracking-[0.08em] text-[#6b6478] uppercase'>
                Bem-vindo de volta
              </div>
              {loaded ? (
                <>
                  <h1 className='type-h2'>
                    Você está{' '}
                    <span className='text-gradient font-serif font-normal italic'>
                      {score}% independente
                    </span>
                    .
                  </h1>
                  <p className='type-body mt-3'>
                    {stats && stats.total_completed > 0
                      ? 'Cada desafio sem cola conta. Sócrates aprovaria.'
                      : 'Comece um desafio para construir seu progresso.'}
                  </p>
                </>
              ) : (
                <>
                  <Skeleton className='h-11 w-[22rem] max-w-full lg:h-14' />
                  <Skeleton className='mt-4 h-5 w-64 max-w-full' />
                </>
              )}
            </div>
            <div className='flex shrink-0 flex-col gap-2 self-start sm:flex-row md:self-auto'>
              <button
                type='button'
                onClick={startDesign}
                disabled={genDesign}
                className='inline-flex items-center justify-center gap-2 rounded-xl border border-[#1b1916]/20 px-5 py-3 text-[15px] font-medium tracking-tight text-[#1b1916] transition-colors hover:bg-[#1b1916]/5 disabled:opacity-60'
              >
                {genDesign ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Network className='size-4' />
                )}
                {genDesign ? 'Gerando…' : 'System Design'}
              </button>
              <Link
                href='/onboarding'
                className='group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[15px] font-medium tracking-tight text-primary-foreground transition-colors hover:bg-primary/90'
              >
                <Sparkles className='size-4' />
                Novo desafio
                <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
            </div>
          </motion.div>

          {!loaded ? (
            <DashboardSkeleton />
          ) : (
            <>
              <div className='mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4'>
                <StatCard
                  i={0}
                  icon={TrendingUp}
                  label='Streak'
                  value={String(stats?.streak_days ?? 0)}
                  hint='dias seguidos'
                />
                <StatCard
                  i={1}
                  icon={Trophy}
                  label='Desafios'
                  value={String(stats?.total_completed ?? 0)}
                  hint='concluídos'
                />
                <StatCard
                  i={2}
                  icon={Lightbulb}
                  label='Hints/desafio'
                  value={String(stats?.avg_hints_per_session ?? 0)}
                  hint='média'
                />
                <StatCard
                  i={3}
                  icon={Layers}
                  label='Hints totais'
                  value={String(stats?.total_hints ?? 0)}
                  hint='usados'
                />
              </div>

              <div className='mb-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]'>
                <ActivityHeatmap sessions={sessions} />
                <IndependenceRing score={score} />
              </div>

              <RecentChallenges items={sessions} />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className='relative mt-3 overflow-hidden rounded-2xl border border-[#DFE5E9] px-8 py-12 text-center'
                style={{
                  background:
                    'linear-gradient(146.18deg, rgba(252, 243, 235, 0.6) 12.07%, rgba(223, 229, 233, 0.6) 45.37%, rgba(220, 215, 253, 0.6) 97.58%), white',
                }}
              >
                <div className='grid-pattern absolute inset-0 opacity-30' />
                <div className='relative z-10 mx-auto max-w-xl font-serif text-2xl leading-relaxed text-[#1b1916] italic sm:text-3xl'>
                  &ldquo;O que sai da sua cabeça vale mil vezes mais que o que
                  sai da minha.&rdquo;
                </div>
                <div className='relative z-10 mt-3 font-mono text-xs text-[#6b6478]'>
                  — Tutor Socrático, agora há pouco
                </div>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className='mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className='rounded-2xl border border-[#DFE5E9] bg-white p-5'
          >
            <Skeleton className='mb-4 size-11 rounded-xl' />
            <Skeleton className='h-8 w-14' />
            <Skeleton className='mt-2 h-3 w-16' />
          </div>
        ))}
      </div>

      <div className='mb-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]'>
        <div className='rounded-2xl border border-[#DFE5E9] bg-white p-6'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='mt-2 h-5 w-40' />
          <Skeleton className='mt-4 h-64 w-full rounded-xl' />
        </div>
        <div className='rounded-2xl border border-[#DFE5E9] bg-white p-6'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='mt-2 h-5 w-36' />
          <div className='mt-6 grid place-items-center'>
            <Skeleton className='size-44 rounded-full' />
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-[#DFE5E9] bg-white p-6'>
        <Skeleton className='h-3 w-20' />
        <Skeleton className='mt-2 h-5 w-44' />
        <div className='mt-5 space-y-2'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-16 w-full rounded-xl' />
          ))}
        </div>
      </div>
    </>
  )
}

function StatCard({
  i,
  icon: Icon,
  label,
  value,
  hint,
}: {
  i: number
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
  hint: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.5 }}
      className='rounded-2xl border border-[#DFE5E9] bg-white p-5'
    >
      <div className='mb-4 flex items-center justify-between'>
        <div className='grid size-11 place-items-center rounded-xl bg-[#dad8ea]/55 text-[#1b1916]'>
          <Icon className='size-5' strokeWidth={1.5} />
        </div>
        <div className='font-mono text-[10px] tracking-wider text-[#6b6478] uppercase'>
          {label}
        </div>
      </div>
      <div className='font-heading text-3xl font-semibold tracking-tight tabular-nums text-[#1b1916]'>
        {value}
      </div>
      <div className='mt-1 text-[12px] text-[#6b6478]'>{hint}</div>
    </motion.div>
  )
}

const WEEKS = 18
const DOW_LABELS = ['', 'Seg', '', 'Qua', '', 'Sex', '']

function localDateKey(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ActivityHeatmap({ sessions }: { sessions: SessionRow[] }) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className='flex flex-col rounded-2xl border border-[#DFE5E9] bg-white p-6'
    >
      <div className='mb-1'>
        <div className='font-mono text-[11px] tracking-wider text-[#6b6478] uppercase'>
          Sua jornada
        </div>
        <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight text-[#1b1916]'>
          Atividade dos últimos meses
        </h3>
      </div>

      <div className='mt-6 flex gap-2 overflow-x-auto'>
        <div className='grid grid-rows-7 gap-1 pr-1'>
          {DOW_LABELS.map((l, i) => (
            <span
              key={i}
              className='flex h-3 items-center font-mono text-[9px] text-[#6b6478]'
            >
              {l}
            </span>
          ))}
        </div>
        <div className='grid grid-flow-col grid-rows-7 gap-1'>
          {days.map((d) => (
            <div
              key={d.key}
              title={`${d.key}: ${d.count} ${d.count === 1 ? 'desafio' : 'desafios'}`}
              className={
                d.future
                  ? 'size-3 opacity-0'
                  : `size-3 rounded-[2px] border border-[#DFE5E9] ${CELL[activityLevel(d.count, max)]}`
              }
            />
          ))}
        </div>
      </div>

      <div className='mt-6 flex items-center justify-end gap-1.5 font-mono text-[10px] text-[#6b6478]'>
        <span>Menos</span>
        {CELL.map((c, l) => (
          <span
            key={l}
            className={`size-3 rounded-[3px] border border-[#DFE5E9] ${c}`}
          />
        ))}
        <span>Mais</span>
      </div>
    </motion.div>
  )
}

function IndependenceRing({ score }: { score: number }) {
  const data = [{ name: 'indep', value: score, fill: IRIS }]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className='flex flex-col rounded-2xl border border-[#DFE5E9] bg-white p-6'
    >
      <div className='font-mono text-[11px] tracking-wider text-[#6b6478] uppercase'>
        Score atual
      </div>
      <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight text-[#1b1916]'>
        Independência total
      </h3>
      <div className='relative grid min-h-[200px] flex-1 place-items-center'>
        <ResponsiveContainer width='100%' height='100%'>
          <RadialBarChart
            innerRadius='70%'
            outerRadius='100%'
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type='number' domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: 'oklch(0 0 0 / 0.05)' }}
              dataKey='value'
              fill={IRIS}
              cornerRadius={20}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className='pointer-events-none absolute inset-0 grid place-items-center'>
          <div className='text-center'>
            <div className='text-gradient-iris font-heading text-5xl font-semibold tabular-nums'>
              {score}%
            </div>
            <div className='mt-1 font-mono text-[11px] text-[#6b6478]'>
              quanto você resolve sozinho
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function RecentChallenges({ items }: { items: SessionRow[] }) {
  const PAGE_SIZE = 6
  const [page, setPage] = React.useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const start = page * PAGE_SIZE
  const pageItems = items.slice(start, start + PAGE_SIZE)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className='rounded-2xl border border-[#DFE5E9] bg-white p-6'
    >
      <div className='mb-5 flex items-end justify-between gap-4'>
        <div>
          <div className='font-mono text-[11px] tracking-wider text-[#6b6478] uppercase'>
            Histórico
          </div>
          <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight text-[#1b1916]'>
            Desafios recentes
          </h3>
        </div>
        {items.length > PAGE_SIZE && (
          <div className='flex items-center gap-2 font-mono text-[11px] text-[#6b6478]'>
            <span className='hidden sm:inline'>
              {start + 1}–{Math.min(start + PAGE_SIZE, items.length)} de{' '}
              {items.length}
            </span>
            <button
              type='button'
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className='grid size-7 place-items-center rounded-lg border border-[#DFE5E9] transition-colors hover:bg-[#F7F9FA] disabled:opacity-40'
            >
              <ChevronLeft className='size-4' />
            </button>
            <button
              type='button'
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className='grid size-7 place-items-center rounded-lg border border-[#DFE5E9] transition-colors hover:bg-[#F7F9FA] disabled:opacity-40'
            >
              <ChevronRight className='size-4' />
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className='text-sm text-[#6b6478]'>
          Nenhum desafio ainda. Comece um para aparecer aqui.
        </p>
      ) : (
        <div className='space-y-2'>
          {pageItems.map((c) => {
            const isDesign = c.challenges?.kind === 'design'
            const href = `${isDesign ? '/design' : '/challenge'}?id=${c.challenge_id}`
            return (
              <Link
                key={c.id}
                href={href}
                className='group flex items-start gap-3 rounded-xl border border-[#DFE5E9] bg-[#F7F9FA] p-3.5 transition-colors hover:bg-[#F1F4F6]'
              >
                <div className='grid size-9 shrink-0 place-items-center rounded-lg bg-[#dad8ea]/55 text-[#1b1916]'>
                  <Code2 className='size-4' strokeWidth={1.5} />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='truncate text-[14px] font-medium text-[#1b1916]'>
                      {c.challenges?.title ?? 'Desafio'}
                    </div>
                    <div className='shrink-0 font-mono text-[11px] text-[#6b6478]'>
                      {new Date(c.started_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className='mt-2 flex items-center gap-3 font-mono text-[11px]'>
                    <span className='rounded-full border border-[#DFE5E9] bg-white px-2 py-0.5 text-[#6b6478]'>
                      {isDesign
                        ? 'System Design'
                        : c.challenges?.stack === 'javascript'
                          ? 'JavaScript'
                          : 'TypeScript'}
                    </span>
                    <span className='text-[#6b6478]'>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                    <span className='ml-auto inline-flex items-center gap-1 text-iris opacity-0 transition-opacity group-hover:opacity-100'>
                      {c.status === 'completed' ? 'Abrir' : 'Retomar'}
                      <ArrowRight className='size-3' />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
