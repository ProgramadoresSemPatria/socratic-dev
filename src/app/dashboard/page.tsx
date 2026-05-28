'use client'

import { Backdrop } from '@/components/backdrop'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/auth/use-user'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
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

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [sessions, setSessions] = React.useState<SessionRow[]>([])

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
    })()
    return () => {
      active = false
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className='grid min-h-screen flex-1 place-items-center text-sm text-muted-foreground'>
        <span className='flex items-center gap-2'>
          <Loader2 className='size-4 animate-spin' /> Carregando…
        </span>
      </div>
    )
  }

  const score = stats?.independence_score ?? 100
  const week = stats?.week_progress ?? []

  return (
    <div className='relative flex flex-1 flex-col'>
      <Navbar />
      <Backdrop variant='subtle' />

      <main className='flex-1 pt-28 pb-20'>
        <div className='mx-auto max-w-6xl px-4'>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between'
          >
            <div>
              <div className='mb-2 font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
                Bem-vindo de volta
              </div>
              <h1 className='font-heading text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-5xl'>
                Você está{' '}
                <span className='text-gradient font-serif font-normal italic'>
                  {score}% independente
                </span>
                .
              </h1>
              <p className='mt-2 text-lg text-muted-foreground'>
                {stats && stats.total_completed > 0
                  ? 'Cada desafio sem cola conta. Sócrates aprovaria.'
                  : 'Comece um desafio para construir seu progresso.'}
              </p>
            </div>
            <Button
              size='lg'
              className='glow-iris group h-11 self-start rounded-full border-transparent bg-primary pr-3 pl-4 text-[14px] text-primary-foreground hover:bg-primary/90 md:self-auto'
              render={<Link href='/onboarding' />}
            >
              <Sparkles className='size-4' />
              Novo desafio
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
            </Button>
          </motion.div>

          {/* Top stats */}
          <div className='mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4'>
            <StatCard
              i={0}
              icon={Trophy}
              label='Streak'
              value={String(stats?.streak_days ?? 0)}
              hint='dias seguidos'
              accent='ember'
            />
            <StatCard
              i={1}
              icon={Target}
              label='Desafios'
              value={String(stats?.total_completed ?? 0)}
              hint='concluídos'
              accent='iris'
            />
            <StatCard
              i={2}
              icon={Lightbulb}
              label='Hints/desafio'
              value={String(stats?.avg_hints_per_session ?? 0)}
              hint='média'
              accent='mint'
            />
            <StatCard
              i={3}
              icon={Brain}
              label='Hints totais'
              value={String(stats?.total_hints ?? 0)}
              hint='usados'
              accent='iris'
            />
          </div>

          {/* Charts row */}
          <div className='mb-8 grid gap-3 lg:grid-cols-[1.6fr_1fr]'>
            <ActivityChart data={week} />
            <IndependenceRing score={score} />
          </div>

          {/* Recent challenges */}
          <RecentChallenges items={sessions} />

          {/* Manifesto reminder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className='border-gradient noise relative mt-12 overflow-hidden rounded-3xl px-8 py-10 text-center'
          >
            <div
              className='absolute -top-32 left-1/2 -z-10 size-[400px] -translate-x-1/2 rounded-full opacity-40 blur-3xl'
              style={{
                background:
                  'radial-gradient(circle, oklch(0.68 0.22 285 / 0.5), transparent 60%)',
              }}
            />
            <div className='mx-auto max-w-xl font-serif text-2xl leading-relaxed text-foreground/90 italic sm:text-3xl'>
              &ldquo;O que sai da sua cabeça vale mil vezes mais que o que sai
              da minha.&rdquo;
            </div>
            <div className='mt-3 font-mono text-xs text-muted-foreground/60'>
              — Tutor Socrático, agora há pouco
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  i,
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  i: number
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
  accent?: 'iris' | 'mint' | 'ember'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.5 }}
      className='glass group relative overflow-hidden rounded-2xl p-5'
    >
      <div className='mb-4 flex items-center justify-between'>
        <div
          className={cn(
            'grid size-9 place-items-center rounded-xl border',
            accent === 'iris' && 'border-iris/20 bg-iris/10',
            accent === 'mint' && 'border-mint/20 bg-mint/10',
            accent === 'ember' && 'border-ember/20 bg-ember/10',
          )}
        >
          <Icon
            className={cn(
              'size-4',
              accent === 'iris' && 'text-iris',
              accent === 'mint' && 'text-mint',
              accent === 'ember' && 'text-ember',
            )}
          />
        </div>
        <div className='font-mono text-[10px] tracking-wider text-muted-foreground/60 uppercase'>
          {label}
        </div>
      </div>
      <div className='font-heading text-3xl font-semibold tracking-tight tabular-nums'>
        {value}
      </div>
      <div className='mt-1 text-[12px] text-muted-foreground'>{hint}</div>
    </motion.div>
  )
}

function ActivityChart({ data }: { data: { day: string; value: number }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className='glass rounded-2xl p-6'
    >
      <div className='mb-1'>
        <div className='font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
          Sua jornada
        </div>
        <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight'>
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
                <stop
                  offset='0%'
                  stopColor='oklch(0.68 0.22 285)'
                  stopOpacity={0.5}
                />
                <stop
                  offset='100%'
                  stopColor='oklch(0.68 0.22 285)'
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey='day'
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'oklch(0.55 0.02 285)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'oklch(0.55 0.02 285)' }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: 'oklch(0 0 0 / 0.1)', strokeDasharray: '4 4' }}
              contentStyle={{
                background: 'oklch(1 0 0 / 0.95)',
                border: '1px solid oklch(0 0 0 / 0.08)',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area
              type='monotone'
              dataKey='value'
              stroke='oklch(0.68 0.22 285)'
              strokeWidth={2.5}
              fill='url(#activity)'
              activeDot={{ r: 5, fill: 'oklch(0.7 0.14 165)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

function IndependenceRing({ score }: { score: number }) {
  const data = [{ name: 'indep', value: score, fill: 'oklch(0.55 0.24 285)' }]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className='glass flex flex-col rounded-2xl p-6'
    >
      <div className='font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
        Score atual
      </div>
      <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight'>
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
            <div className='mt-1 font-mono text-[11px] text-muted-foreground/70'>
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
      className='glass rounded-2xl p-6'
    >
      <div className='mb-5'>
        <div className='font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
          Histórico
        </div>
        <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight'>
          Desafios recentes
        </h3>
      </div>

      {items.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
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
              className='group rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 transition-colors hover:bg-white/[0.04]'
            >
              <div className='flex items-start gap-3'>
                <div className='grid size-9 shrink-0 place-items-center rounded-lg border border-iris/15 bg-gradient-to-br from-iris/15 to-mint/10'>
                  <CheckCircle2 className='size-4 text-mint' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='truncate text-[14px] font-medium'>
                      {c.challenges?.title ?? 'Desafio'}
                    </div>
                    <div className='shrink-0 font-mono text-[11px] text-muted-foreground/70'>
                      {new Date(c.started_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className='mt-2 flex items-center gap-3 font-mono text-[11px]'>
                    <span className='rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5'>
                      {c.challenges?.stack === 'javascript'
                        ? 'JavaScript'
                        : 'TypeScript'}
                    </span>
                    <span className='text-muted-foreground/70'>
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
