import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { computeIndependence } from '@/domain/scoring'
import { FormattedText } from '@/features/challenges/components/formatted-text'
import { getLocale } from '@/lib/i18n/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Code2,
  GitPullRequestArrow,
  Lightbulb,
  Network,
  Sparkles,
  XCircle,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const PERSONA_RE = /^Cliente:\s*([^()]+?)\s*\(([^)]+)\)\s*—\s*(.+)$/

const copy = {
  en: {
    levels: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
    eyebrow: 'Session replay',
    trainToo: 'Start training',
    publicSession: 'Public session · socratic.dev',
    completed: 'Completed',
    failed: 'Failed',
    dateLocale: 'en-US',
    independence: 'Independence',
    independenceHint:
      '100 minus the hint penalty. Shows how much you thought on your own.',
    hintsUsed: 'Hints used',
    time: 'Time',
    clientRequest: 'Client request',
    howHints: 'How hints were used',
    hintLevel: (n: number) => `Level ${n}`,
    finalCode: 'Final submitted code',
    socraticReview: 'Socratic review',
    proofTitle: 'Proof without shortcuts',
    proofBodyPre:
      'This session was AI-generated, with hidden tests running in the browser. The tutor never hands over the answer. It only asks questions. Every hint costs independence. ',
    proofBodyStrong: 'Want to try?',
    startMyOwn: 'Start my own',
    sessionId: 'Session ID:',
  },
  pt: {
    levels: {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
    },
    eyebrow: 'Replay da sessão',
    trainToo: 'Treinar também',
    publicSession: 'Sessão pública · socratic.dev',
    completed: 'Concluído',
    failed: 'Reprovado',
    dateLocale: 'pt-BR',
    independence: 'Independência',
    independenceHint:
      '100 menos a penalidade de hints. Mostra o quanto pensou sozinho.',
    hintsUsed: 'Hints usados',
    time: 'Tempo',
    clientRequest: 'Pedido do cliente',
    howHints: 'Como pediu hints',
    hintLevel: (n: number) => `Nível ${n}`,
    finalCode: 'Código final submetido',
    socraticReview: 'Review socrático',
    proofTitle: 'Prova sem cola',
    proofBodyPre:
      'Essa sessão foi gerada por IA, com testes escondidos rodando no browser. O tutor nunca entrega a resposta. Só pergunta. Cada hint custa independência. ',
    proofBodyStrong: 'Quer tentar?',
    startMyOwn: 'Começar meu próprio',
    sessionId: 'ID da sessão:',
  },
} as const

type Copy = (typeof copy)['en' | 'pt']

function parsePersona(brief: string) {
  const [first, ...rest] = brief.split('\n')
  const m = first?.match(PERSONA_RE)
  if (!m) return { persona: null as null, body: brief }
  return {
    persona: { name: m[1].trim(), role: m[2].trim(), company: m[3].trim() },
    body: rest.join('\n').trim(),
  }
}

function levelLabel(level: string, t: Copy): string {
  return level === 'beginner'
    ? t.levels.beginner
    : level === 'intermediate'
      ? t.levels.intermediate
      : level === 'advanced'
        ? t.levels.advanced
        : level
}

function stackLabel(stack: string | null, kind: string | null): string {
  if (kind === 'design') return 'System Design'
  if (stack === 'javascript') return 'JavaScript'
  if (stack === 'typescript') return 'TypeScript'
  if (stack === 'react') return 'React'
  if (stack === 'python') return 'Python'
  return stack ?? ''
}

function formatTime(s: number | null): string {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${sec.toString().padStart(2, '0')}s`
}

async function fetchReplay(id: string) {
  const session = await supabaseAdmin
    .from('sessions')
    .select(
      'id, status, started_at, completed_at, duration_seconds, independence, challenge_id, user_id, challenges(*)',
    )
    .eq('id', id)
    .maybeSingle()
  if (!session.data) return null

  const submission = await supabaseAdmin
    .from('code_submissions')
    .select('code, review_response, submitted_at')
    .eq('session_id', id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hints = await supabaseAdmin
    .from('hints_used')
    .select('hint_level, used_at, is_solve')
    .eq('session_id', id)

  return {
    session: session.data as Awaited<
      ReturnType<typeof supabaseAdmin.from>
    > extends { data: infer T }
      ? T
      : unknown,
    submission: submission.data,
    hints: (hints.data ?? []) as {
      hint_level: number
      used_at: string
      is_solve: boolean
    }[],
  }
}

function replayIndependence(
  stored: number | null | undefined,
  hints: { hint_level: number; is_solve: boolean }[],
): number {
  return stored ?? computeIndependence(hints)
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await props.params
  const data = await fetchReplay(id)
  if (!data) return { title: 'Replay not found · socratic.dev' }
  const session = data.session as {
    challenges: { title?: string } | null
    status: string
    independence: number | null
  }
  const title = session.challenges?.title ?? 'Challenge'
  const score = replayIndependence(session.independence, data.hints)
  return {
    title: `${title} · ${score}% independent · socratic.dev`,
    description: `Public session: ${title} solved with ${score}% independence. No cheating, no AI spitting out the answer.`,
    openGraph: {
      title: `${title}: ${score}% independent`,
      description: 'Verifiable social proof. Solved on socratic.dev.',
      type: 'article',
    },
  }
}

export default async function ReplayPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const locale = await getLocale()
  const t = copy[locale]
  const data = await fetchReplay(id)
  if (!data) notFound()

  const session = data.session as {
    id: string
    status: string
    started_at: string
    completed_at: string | null
    duration_seconds: number | null
    independence: number | null
    challenges: {
      title: string
      description: string
      stack: string
      level: string
      kind: string | null
      client_briefing: string
      initial_code?: string
    } | null
  }
  const c = session.challenges
  if (!c) notFound()

  const { persona, body } = parsePersona(c.client_briefing)
  const realHints = data.hints.filter((h) => !h.is_solve)
  const independence = replayIndependence(session.independence, data.hints)
  const passed = session.status === 'completed'
  const isDesign = c.kind === 'design'
  const date = new Date(session.completed_at ?? session.started_at)

  return (
    <div className='relative flex min-h-screen flex-col bg-background'>
      <header className='sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur'>
        <div className='container-main flex h-16 items-center justify-between'>
          <Logo />
          <Button render={<Link href='/onboarding' />} variant='ink' size='sm'>
            {t.trainToo}
          </Button>
        </div>
      </header>

      <main className='flex-1 pt-14 pb-24'>
        <div className='container-main max-w-3xl'>
          <p className='eyebrow'>{t.eyebrow}</p>

          <h1 className='type-h2 mt-4 text-balance'>{c.title}</h1>

          <div className='mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase'>
            <span className='inline-flex items-center gap-1.5'>
              {isDesign ? (
                <Network className='size-3' strokeWidth={1.5} />
              ) : (
                <Code2 className='size-3' strokeWidth={1.5} />
              )}
              {stackLabel(c.stack, c.kind)}
            </span>
            <span>{levelLabel(c.level, t)}</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5',
                passed ? 'text-mint' : 'text-warning-foreground',
              )}
            >
              {passed ? (
                <CheckCircle2 className='size-3' strokeWidth={1.5} />
              ) : (
                <XCircle className='size-3' strokeWidth={1.5} />
              )}
              {passed ? t.completed : t.failed}
            </span>
            <span className='inline-flex items-center gap-1.5'>
              <Calendar className='size-3' strokeWidth={1.5} />
              {date.toLocaleDateString(t.dateLocale, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className='mt-10 grid grid-cols-3 border-y border-border py-8'>
            <Metric
              label={t.independence}
              value={String(independence)}
              suffix='/100'
              accent='mint'
              hint={t.independenceHint}
            />
            <Metric label={t.hintsUsed} value={String(realHints.length)} />
            <Metric
              label={t.time}
              value={formatTime(session.duration_seconds)}
              accent='primary'
            />
          </div>

          <Section
            title={t.clientRequest}
            icon={<Sparkles className='size-3.5' strokeWidth={1.5} />}
          >
            {persona && (
              <div className='mb-5 flex items-center gap-3'>
                <div className='grid size-11 shrink-0 place-items-center rounded-full bg-pastel-lavender font-heading text-sm font-medium text-ink'>
                  {persona.name
                    .split(/\s+/)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className='min-w-0'>
                  <div className='truncate font-heading text-[15px] font-medium text-ink'>
                    {persona.name}
                  </div>
                  <div className='truncate text-[12px] text-muted-foreground'>
                    {persona.role} · {persona.company}
                  </div>
                </div>
              </div>
            )}
            <p className='type-body whitespace-pre-line'>
              {persona ? body : c.client_briefing}
            </p>
          </Section>

          {realHints.length > 0 && (
            <Section
              title={t.howHints}
              icon={<Lightbulb className='size-3.5' strokeWidth={1.5} />}
            >
              <div className='grid grid-cols-3'>
                {([1, 2, 3] as const).map((lvl) => {
                  const n = realHints.filter((h) => h.hint_level === lvl).length
                  return (
                    <div
                      key={lvl}
                      className='border-l border-border px-5 first:border-l-0 first:pl-0 sm:px-8'
                    >
                      <div className='font-heading text-[32px] leading-none font-light text-ink tabular-nums sm:text-[40px]'>
                        {n}
                      </div>
                      <div className='mt-3 font-mono text-[11px] tracking-wider text-muted-foreground uppercase'>
                        {t.hintLevel(lvl)}
                      </div>
                      <div className='mt-1 font-mono text-[11px] text-muted-foreground'>
                        −{n * lvl * 4} indep.
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {!isDesign && data.submission?.code && (
            <Section
              title={t.finalCode}
              icon={<Code2 className='size-3.5' strokeWidth={1.5} />}
            >
              <pre className='overflow-x-auto rounded-lg bg-terminal p-5 font-mono text-[12.5px] leading-relaxed text-white/80'>
                <code>{data.submission.code}</code>
              </pre>
            </Section>
          )}

          {data.submission?.review_response && (
            <Section
              title={t.socraticReview}
              icon={
                <GitPullRequestArrow className='size-3.5' strokeWidth={1.5} />
              }
            >
              <div className='type-body'>
                <FormattedText text={data.submission.review_response} />
              </div>
            </Section>
          )}

          <div className='mt-16 overflow-hidden rounded-lg bg-gradient-to-b from-pastel-greige/50 via-pastel-mist/40 to-pastel-lavender/60 px-6 py-14 text-center sm:px-10 sm:py-16'>
            <p className='eyebrow'>{t.proofTitle}</p>
            <h2 className='type-h3 mt-4'>
              <span className='font-serif italic'>{t.proofBodyStrong}</span>
            </h2>
            <p className='type-body mx-auto mt-4 max-w-[520px]'>
              {t.proofBodyPre}
            </p>
            <Button
              render={<Link href='/onboarding' />}
              variant='ink'
              size='lg'
              className='group mt-8'
            >
              {t.startMyOwn}
              <ArrowRight className='transition-transform duration-200 group-hover:translate-x-0.5' />
            </Button>
          </div>

          <div className='mt-10 text-center font-mono text-[10px] tracking-wider text-muted-foreground uppercase'>
            {t.publicSession}
          </div>
          <div className='mt-2 text-center font-mono text-[10px] text-muted-foreground'>
            {t.sessionId} <span className='text-ink'>{session.id}</span>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className='mt-14 border-t border-border pt-8'>
      <div className='eyebrow mb-5 flex items-center gap-2'>
        {icon}
        {title}
      </div>
      {children}
    </section>
  )
}

function Metric({
  label,
  value,
  suffix,
  accent,
  hint,
}: {
  label: string
  value: string
  suffix?: string
  accent?: 'mint' | 'primary'
  hint?: string
}) {
  return (
    <div
      title={hint}
      className='border-l border-border px-5 first:border-l-0 first:pl-0 sm:px-8'
    >
      <div className='flex items-baseline'>
        <span
          className={cn(
            'font-heading text-[32px] leading-none font-light tracking-[-0.03em] text-ink tabular-nums sm:text-[52px]',
            accent === 'mint' && 'text-mint',
            accent === 'primary' && 'text-primary',
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className='ml-1 font-mono text-xs text-muted-foreground'>
            {suffix}
          </span>
        )}
      </div>
      <div className='mt-3 font-mono text-[11px] tracking-wider text-muted-foreground uppercase'>
        {label}
      </div>
    </div>
  )
}
