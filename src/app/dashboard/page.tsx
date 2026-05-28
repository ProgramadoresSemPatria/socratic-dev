'use client'

import { Navbar } from '@/components/navbar'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/lib/auth/use-user'
import {
  ArrowRight,
  Code2,
  Layers,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import {
  Area,
  AreaChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  status: string
  started_at: string
  challenges: { title: string; stack: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  completed: 'Concluído',
  in_progress: 'Em andamento',
  abandoned: 'Abandonado',
}

const IRIS = 'oklch(0.55 0.24 285)'
const MINT = 'oklch(0.7 0.14 165)'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [sessions, setSessions] = React.useState<SessionRow[]>([])
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/dashboard')
  }, [loading, user, router])

  React.useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const [s, sess] = await Promise.all([
        fetch(`/api/stats?user_id=${user.id}`).then((r) => r.json()),
        fetch(`/api/sessions?user_id=${user.id}`).then((r) => r.json()),
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
  const week = stats?.week_progress ?? []

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
            <Link
              href='/onboarding'
              className='group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 py-3 text-[15px] font-medium tracking-tight text-primary-foreground transition-colors hover:bg-primary/90 md:self-auto'
            >
              <Sparkles className='size-4' />
              Novo desafio
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
            </Link>
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
                <ActivityChart data={week} />
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

function ActivityChart({ data }: { data: { day: string; value: number }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className='rounded-2xl border border-[#DFE5E9] bg-white p-6'
    >
      <div className='mb-1'>
        <div className='font-mono text-[11px] tracking-wider text-[#6b6478] uppercase'>
          Sua jornada
        </div>
        <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight text-[#1b1916]'>
          Atividade na semana
        </h3>
      </div>
      <div className='mt-4 h-64'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id='activity' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor={IRIS} stopOpacity={0.4} />
                <stop offset='100%' stopColor={IRIS} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey='day'
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 285)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 285)' }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: 'oklch(0 0 0 / 0.1)', strokeDasharray: '4 4' }}
              contentStyle={{
                background: 'oklch(1 0 0 / 0.97)',
                border: '1px solid #DFE5E9',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area
              type='monotone'
              dataKey='value'
              stroke={IRIS}
              strokeWidth={2.5}
              fill='url(#activity)'
              activeDot={{ r: 5, fill: MINT }}
            />
          </AreaChart>
        </ResponsiveContainer>
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className='rounded-2xl border border-[#DFE5E9] bg-white p-6'
    >
      <div className='mb-5'>
        <div className='font-mono text-[11px] tracking-wider text-[#6b6478] uppercase'>
          Histórico
        </div>
        <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight text-[#1b1916]'>
          Desafios recentes
        </h3>
      </div>

      {items.length === 0 ? (
        <p className='text-sm text-[#6b6478]'>
          Nenhum desafio ainda. Comece um para aparecer aqui.
        </p>
      ) : (
        <div className='space-y-2'>
          {items.slice(0, 8).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className='group rounded-xl border border-[#DFE5E9] bg-[#F7F9FA] p-3.5 transition-colors hover:bg-[#F1F4F6]'
            >
              <div className='flex items-start gap-3'>
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
                      {c.challenges?.stack === 'javascript'
                        ? 'JavaScript'
                        : 'TypeScript'}
                    </span>
                    <span className='text-[#6b6478]'>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
