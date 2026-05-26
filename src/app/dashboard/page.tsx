'use client'

import { Backdrop } from '@/components/backdrop'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
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

const independenceData = [
  { day: 'Seg', value: 62 },
  { day: 'Ter', value: 68 },
  { day: 'Qua', value: 71 },
  { day: 'Qui', value: 79 },
  { day: 'Sex', value: 84 },
  { day: 'Sab', value: 88 },
  { day: 'Dom', value: 92 },
]

const conceptsToReinforce = [
  { name: 'Async/await', mastery: 35, lastSeen: '2 dias' },
  { name: 'Date manipulation', mastery: 52, lastSeen: 'hoje' },
  { name: 'Error handling', mastery: 41, lastSeen: '4 dias' },
  { name: 'SQL básico', mastery: 28, lastSeen: '5 dias' },
]

const completedChallenges = [
  {
    title: 'API de controle de estoque',
    client: 'Padaria do Zé',
    stack: 'TypeScript',
    score: 92,
    hints: 2,
    time: '23min',
    date: 'Hoje',
  },
  {
    title: 'Auth com JWT do zero',
    client: 'Clínica Vitalis',
    stack: 'Node.js',
    score: 78,
    hints: 5,
    time: '47min',
    date: 'Ontem',
  },
  {
    title: 'Carrinho de e-commerce',
    client: 'Moda Aurora',
    stack: 'React',
    score: 65,
    hints: 9,
    time: '1h 12min',
    date: '3 dias',
  },
]

export default function DashboardPage() {
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
                  92% independente
                </span>
                .
              </h1>
              <p className='mt-2 text-lg text-muted-foreground'>
                Hoje você resolveu sem cola. Sócrates aprovaria.
              </p>
            </div>
            <Button
              size='lg'
              className='glow-iris group h-11 self-start rounded-full border-transparent bg-foreground pr-3 pl-4 text-[14px] text-background hover:bg-foreground/90 md:self-auto'
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
              value='7'
              hint='dias seguidos'
              accent='ember'
            />
            <StatCard
              i={1}
              icon={Target}
              label='Desafios'
              value='14'
              hint='concluídos'
              accent='iris'
            />
            <StatCard
              i={2}
              icon={Lightbulb}
              label='Hints/desafio'
              value='3.2'
              hint='-58% vs início'
              accent='mint'
            />
            <StatCard
              i={3}
              icon={Brain}
              label='Conceitos'
              value='22'
              hint='dominados'
              accent='iris'
            />
          </div>

          {/* Charts row */}
          <div className='mb-8 grid gap-3 lg:grid-cols-[1.6fr_1fr]'>
            <IndependenceChart />
            <IndependenceRing />
          </div>

          {/* Concepts + recent challenges */}
          <div className='grid gap-3 lg:grid-cols-2'>
            <ConceptsToReinforce />
            <RecentChallenges />
          </div>

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

function IndependenceChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className='glass rounded-2xl p-6'
    >
      <div className='mb-1 flex items-center justify-between'>
        <div>
          <div className='font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
            Sua jornada
          </div>
          <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight'>
            Independência ao longo da semana
          </h3>
        </div>
        <div className='flex items-center gap-1.5 text-[12px] font-medium text-mint'>
          <TrendingUp className='size-3.5' />
          +30 pts
        </div>
      </div>
      <div className='mt-4 h-64'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart
            data={independenceData}
            margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id='indep' x1='0' y1='0' x2='0' y2='1'>
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
              tick={{ fontSize: 11, fill: 'oklch(0.65 0.02 280)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'oklch(0.65 0.02 280)' }}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ stroke: 'oklch(1 0 0 / 0.1)', strokeDasharray: '4 4' }}
              contentStyle={{
                background: 'oklch(0.12 0.012 280 / 0.9)',
                border: '1px solid oklch(1 0 0 / 0.08)',
                borderRadius: 12,
                fontSize: 12,
                backdropFilter: 'blur(12px)',
              }}
              labelStyle={{ color: 'oklch(0.65 0.02 280)' }}
            />
            <Area
              type='monotone'
              dataKey='value'
              stroke='oklch(0.68 0.22 285)'
              strokeWidth={2.5}
              fill='url(#indep)'
              activeDot={{ r: 5, fill: 'oklch(0.78 0.17 165)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

function IndependenceRing() {
  const data = [{ name: 'indep', value: 92, fill: 'oklch(0.68 0.22 285)' }]
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
              background={{ fill: 'oklch(1 0 0 / 0.04)' }}
              dataKey='value'
              cornerRadius={20}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className='pointer-events-none absolute inset-0 grid place-items-center'>
          <div className='text-center'>
            <div className='text-gradient-iris font-heading text-5xl font-semibold tabular-nums'>
              92%
            </div>
            <div className='mt-1 font-mono text-[11px] text-muted-foreground/70'>
              top 8% dos devs
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ConceptsToReinforce() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className='glass rounded-2xl p-6'
    >
      <div className='mb-5 flex items-center justify-between'>
        <div>
          <div className='font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
            Conceitos a reforçar
          </div>
          <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight'>
            Onde você ainda tropeça
          </h3>
        </div>
      </div>
      <div className='space-y-3'>
        {conceptsToReinforce.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className='group cursor-pointer rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]'
          >
            <div className='mb-2 flex items-center justify-between'>
              <div className='text-[14px] font-medium'>{c.name}</div>
              <div className='font-mono text-[11px] text-muted-foreground/70'>
                visto {c.lastSeen}
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]'>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${c.mastery}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.06 }}
                  className={cn(
                    'h-full rounded-full',
                    c.mastery < 40
                      ? 'bg-gradient-to-r from-ember to-destructive'
                      : c.mastery < 70
                        ? 'bg-gradient-to-r from-warning to-ember'
                        : 'bg-gradient-to-r from-iris to-mint',
                  )}
                />
              </div>
              <div className='w-8 text-right font-mono text-[11px] text-muted-foreground/80 tabular-nums'>
                {c.mastery}%
              </div>
              <ChevronRight className='size-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground' />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function RecentChallenges() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className='glass rounded-2xl p-6'
    >
      <div className='mb-5 flex items-center justify-between'>
        <div>
          <div className='font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
            Histórico
          </div>
          <h3 className='mt-1 font-heading text-xl font-semibold tracking-tight'>
            Desafios recentes
          </h3>
        </div>
        <Link
          href='#'
          className='text-[12px] text-muted-foreground transition-colors hover:text-foreground'
        >
          ver tudo →
        </Link>
      </div>
      <div className='space-y-2'>
        {completedChallenges.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className='group cursor-pointer rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 transition-colors hover:bg-white/[0.04]'
          >
            <div className='flex items-start gap-3'>
              <div className='grid size-9 shrink-0 place-items-center rounded-lg border border-iris/15 bg-gradient-to-br from-iris/15 to-mint/10'>
                <CheckCircle2 className='size-4 text-mint' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='truncate text-[14px] font-medium'>
                    {c.title}
                  </div>
                  <div className='shrink-0 font-mono text-[11px] text-muted-foreground/70'>
                    {c.date}
                  </div>
                </div>
                <div className='mt-0.5 text-[12px] text-muted-foreground'>
                  {c.client}
                </div>
                <div className='mt-2 flex items-center gap-3 font-mono text-[11px]'>
                  <span className='rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5'>
                    {c.stack}
                  </span>
                  <span className='text-muted-foreground/70'>{c.time}</span>
                  <span className='text-muted-foreground/70'>
                    · {c.hints} hints
                  </span>
                  <span
                    className={cn(
                      'ml-auto font-semibold',
                      c.score >= 85
                        ? 'text-mint'
                        : c.score >= 70
                          ? 'text-warning-foreground'
                          : 'text-ember',
                    )}
                  >
                    {c.score}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
