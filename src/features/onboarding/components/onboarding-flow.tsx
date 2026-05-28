'use client'

import { Logo } from '@/components/logo'
import { Skeleton } from '@/components/ui/skeleton'
import { levelById, levelByUiId } from '@/domain/levels'
import { stackById, stackByUiId } from '@/domain/stacks'
import { getNextChallenge } from '@/features/challenges/actions'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Info,
  Loader2,
  Network,
  Sparkles,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

const stacks = [
  {
    id: 'js',
    name: 'JavaScript',
    desc: 'Web, Node, full-stack',
    icon: 'JS',
    gradient: 'from-amber-400/30 to-orange-500/20',
  },
  {
    id: 'ts',
    name: 'TypeScript',
    desc: 'Type safety, tooling moderno',
    icon: 'TS',
    gradient: 'from-blue-500/30 to-iris/20',
  },
  {
    id: 'py',
    name: 'Python',
    desc: 'Backend, dados, scripts',
    icon: 'PY',
    gradient: 'from-mint/30 to-blue-400/20',
  },
  {
    id: 'react',
    name: 'React',
    desc: 'Componentes, hooks, estado',
    icon: 'RX',
    gradient: 'from-cyan-400/30 to-iris/20',
  },
]

const levels = [
  {
    id: 'starter',
    name: 'Iniciante',
    tag: 'Comecei agora',
    desc: 'Variáveis, condicionais, loops, arrays. Sem traumas.',
    intensity: 1,
  },
  {
    id: 'junior',
    name: 'Júnior',
    tag: 'Já fiz alguns projetos',
    desc: 'Funções, objetos, fetch, async/await. Confortável com docs.',
    intensity: 2,
  },
  {
    id: 'mid',
    name: 'Intermediário',
    tag: 'Quero crescer',
    desc: 'Padrões, arquitetura, performance. Code review mais duro.',
    intensity: 3,
  },
  {
    id: 'advanced',
    name: 'Avançado',
    tag: 'Quero nível big tech',
    desc: 'Algoritmos, complexidade ótima, edge cases. Pegada de entrevista FAANG.',
    intensity: 4,
  },
]

const tracks = [
  {
    id: 'code',
    name: 'Código',
    desc: 'Resolva um problema real no editor, com testes.',
    Icon: Code2,
  },
  {
    id: 'design',
    name: 'System Design',
    desc: 'Arquitete sistemas num canvas; a IA analisa.',
    Icon: Network,
  },
]

const stepMeta = [
  {
    eyebrow: '01 · Trilha',
    title: 'Como você quer treinar hoje?',
    subtitle: 'Código ou system design (arquitetura) — escolha a trilha.',
  },
  {
    eyebrow: '02 · Nível',
    title: 'Honestidade radical: onde você está?',
    subtitle: 'Quanto mais real você for, melhor a IA calibra o desafio.',
  },
  {
    eyebrow: '03 · Pronto',
    title: 'Hora de pensar.',
    subtitle: 'Vou gerar um desafio real, com cliente fictício. Sem cópia.',
  },
]

type Step = 0 | 1 | 2

export function OnboardingFlow({ user }: { user: User }) {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>(0)
  const [track, setTrack] = React.useState<string | null>(null)
  const [stack, setStack] = React.useState<string | null>(null)
  const [level, setLevel] = React.useState<string | null>(null)
  const [starting, setStarting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const started = React.useRef(false)

  React.useEffect(() => {
    if (started.current) return
    const meta = user.user_metadata as
      | {
          preferred_track?: string
          preferred_stack?: string
          preferred_level?: string
        }
      | undefined

    // Already onboarded → go straight to dashboard. No surprise challenge
    // generation on every visit (this was annoying users on each login).
    const onboarded =
      !!meta?.preferred_level &&
      (meta?.preferred_track === 'design' || !!meta?.preferred_stack)
    if (onboarded) {
      started.current = true
      router.replace('/dashboard')
      return
    }

    // Restore saved preferences using the registries (no translation tables).
    if (meta?.preferred_track) setTrack(meta.preferred_track)
    const restoredStack = meta?.preferred_stack
      ? stackById(meta.preferred_stack)?.uiId
      : undefined
    if (restoredStack) setStack(restoredStack)
    const restoredLevel = meta?.preferred_level
      ? levelById(meta.preferred_level)?.uiId
      : undefined
    if (restoredLevel) setLevel(restoredLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const canNext =
    (step === 0 && track && (track === 'design' || stack)) ||
    (step === 1 && level) ||
    step === 2

  async function generate(dbStack: string, dbLevel: string, trk: string) {
    setError(null)
    setStarting(true)
    await supabase.auth.updateUser({
      data: {
        preferred_track: trk,
        preferred_stack: dbStack,
        preferred_level: dbLevel,
      },
    })
    try {
      const result = await getNextChallenge(
        trk === 'design'
          ? {
              kind: 'design',
              level: dbLevel as 'beginner' | 'intermediate' | 'advanced',
              userId: user.id,
            }
          : {
              kind: 'code',
              stack: dbStack,
              level: dbLevel as 'beginner' | 'intermediate' | 'advanced',
              userId: user.id,
            },
      )
      if ('error' in result || !result?.id) {
        setError(
          ('error' in result && result.error) ||
            'A IA não conseguiu gerar o desafio agora. Tente de novo.',
        )
        setStarting(false)
        started.current = false
        return
      }
      router.push(
        trk === 'design'
          ? `/design?id=${result.id}`
          : `/challenge?id=${result.id}`,
      )
    } catch {
      setError('Falha ao falar com a IA. Verifique a conexão e tente de novo.')
      setStarting(false)
      started.current = false
    }
  }

  function start() {
    if (starting) return
    // Registry lookups replace LEVEL_TO_DB / STACK_TO_DB
    const dbLevel = levelByUiId(level ?? 'starter')?.id ?? 'beginner'
    if (track === 'design') {
      generate('design', dbLevel, 'design')
      return
    }
    const dbStack = stackByUiId(stack ?? 'js')?.id ?? 'javascript'
    generate(dbStack, dbLevel, 'code')
  }

  const meta = stepMeta[step]

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-white'>
      <header className='container-main flex h-16 w-full max-w-3xl shrink-0 items-center justify-between'>
        <Logo />
        <Link
          href='/'
          className='text-sm text-[#6b6478] transition-colors hover:text-[#1b1916]'
        >
          Voltar ao site
        </Link>
      </header>

      <main className='flex flex-1 items-start py-6 md:items-center md:py-10'>
        <div className='container-main w-full max-w-3xl'>
          <div className='shadow-soft-lg overflow-hidden rounded-xl border border-[#DFE5E9] bg-white'>
            <div className='relative overflow-hidden border-b border-[#DFE5E9] px-6 py-8 sm:px-10 sm:py-10'>
              <div
                className='absolute inset-0'
                style={{
                  background:
                    'linear-gradient(146.18deg, rgba(252, 243, 235, 0.6) 12.07%, rgba(223, 229, 233, 0.6) 45.37%, rgba(220, 215, 253, 0.6) 97.58%), white',
                }}
              />
              <div className='grid-pattern absolute inset-0 opacity-30' />
              <div className='relative z-10'>
                {starting ? (
                  <div>
                    <div className='mb-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#6b6478] uppercase'>
                      Gerando
                    </div>
                    <h1 className='type-h2'>Quase lá.</h1>
                    <p className='type-body mt-3 max-w-[44ch]'>
                      Montando um desafio com base nas suas escolhas.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className='mb-6 flex items-center gap-2'>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className='flex-1'>
                          <div
                            className={cn(
                              'h-1 rounded-full transition-all duration-500',
                              step >= i ? 'bg-iris' : 'bg-[#1b1916]/10',
                            )}
                          />
                          <div className='mt-2 font-mono text-[10px] tracking-wider text-[#6b6478] uppercase'>
                            {['Trilha', 'Nível', 'Pronto'][i]}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='mb-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#6b6478] uppercase'>
                      {meta.eyebrow}
                    </div>
                    <h1 className='type-h2'>{meta.title}</h1>
                    <p className='type-body mt-3 max-w-[44ch]'>
                      {meta.subtitle}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className='px-6 py-7 sm:px-10 sm:py-8'>
              {starting ? (
                <GeneratingChallenge />
              ) : (
                <>
                  {step === 0 && (
                    <div className='space-y-4'>
                      <div className='grid gap-3 sm:grid-cols-2'>
                        {tracks.map((t) => (
                          <Tile
                            key={t.id}
                            selected={track === t.id}
                            onClick={() => setTrack(t.id)}
                          >
                            <div className='grid size-12 place-items-center rounded-2xl bg-[#dad8ea]/55 text-[#1b1916]'>
                              <t.Icon className='size-6' strokeWidth={1.5} />
                            </div>
                            <div className='flex-1'>
                              <div className='font-heading text-lg font-medium tracking-tight text-[#1b1916]'>
                                {t.name}
                              </div>
                              <div className='text-sm text-[#6b6478]'>
                                {t.desc}
                              </div>
                            </div>
                          </Tile>
                        ))}
                      </div>

                      {track === 'code' && (
                        <div>
                          <div className='mb-2 font-mono text-[11px] tracking-wider text-[#6b6478] uppercase'>
                            Linguagem
                          </div>
                          <div className='grid gap-3 sm:grid-cols-2'>
                            {stacks.map((s) => (
                              <Tile
                                key={s.id}
                                selected={stack === s.id}
                                onClick={() => setStack(s.id)}
                              >
                                <div
                                  className={cn(
                                    'grid size-12 place-items-center rounded-2xl border border-black/5 bg-linear-to-br font-mono text-sm font-bold text-[#1b1916]',
                                    s.gradient,
                                  )}
                                >
                                  {s.icon}
                                </div>
                                <div className='flex-1'>
                                  <div className='font-heading text-lg font-medium tracking-tight text-[#1b1916]'>
                                    {s.name}
                                  </div>
                                  <div className='text-sm text-[#6b6478]'>
                                    {s.desc}
                                  </div>
                                </div>
                              </Tile>
                            ))}
                          </div>
                        </div>
                      )}

                      {track === 'design' && (
                        <div className='rounded-2xl border border-[#DFE5E9] bg-[#F7F9FA] p-4 text-sm text-[#6b6478]'>
                          System design não tem linguagem — você vai{' '}
                          <span className='font-medium text-[#1b1916]'>
                            desenhar a arquitetura do sistema
                          </span>{' '}
                          (serviços, dados, fluxo) num canvas e a IA analisa.
                        </div>
                      )}
                    </div>
                  )}

                  {step === 1 && (
                    <div className='space-y-3'>
                      {levels.map((l) => (
                        <Tile
                          key={l.id}
                          selected={level === l.id}
                          onClick={() => setLevel(l.id)}
                        >
                          <div className='flex items-center gap-1'>
                            {Array.from({ length: 4 }).map((_, idx) => (
                              <span
                                key={idx}
                                className={cn(
                                  'h-2 w-5 rounded-full',
                                  idx < l.intensity
                                    ? 'bg-iris'
                                    : 'bg-[#DFE5E9]',
                                )}
                              />
                            ))}
                          </div>
                          <div className='flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <div className='font-heading text-lg font-medium tracking-tight text-[#1b1916]'>
                                {l.name}
                              </div>
                              <span className='rounded-full border border-[#DFE5E9] bg-[#F7F9FA] px-2 py-0.5 font-mono text-[10px] tracking-wider text-[#6b6478] uppercase'>
                                {l.tag}
                              </span>
                            </div>
                            <div className='mt-0.5 text-sm text-[#6b6478]'>
                              {l.desc}
                            </div>
                          </div>
                        </Tile>
                      ))}
                    </div>
                  )}

                  {step === 2 && (
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <SummaryItem
                        label='Trilha'
                        value={
                          track === 'design'
                            ? 'Design System'
                            : (stacks.find((s) => s.id === stack)?.name ??
                              'Código')
                        }
                      />
                      <SummaryItem
                        label='Nível'
                        value={levels.find((l) => l.id === level)?.name ?? '—'}
                      />
                    </div>
                  )}

                  {error && (
                    <div className='mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600'>
                      {error}
                    </div>
                  )}

                  <div className='mt-7 flex items-center justify-between'>
                    <button
                      type='button'
                      onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[#6b6478] transition-colors hover:bg-[#1b1916]/5 hover:text-[#1b1916]',
                        step === 0 && 'invisible',
                      )}
                    >
                      <ArrowLeft className='size-4' /> Voltar
                    </button>

                    {step < 2 ? (
                      <button
                        type='button'
                        disabled={!canNext}
                        onClick={() =>
                          setStep((s) => Math.min(2, s + 1) as Step)
                        }
                        className='group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[15px] font-medium tracking-tight text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40'
                      >
                        Continuar
                        <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
                      </button>
                    ) : (
                      <button
                        type='button'
                        onClick={start}
                        className='group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[15px] font-medium tracking-tight text-primary-foreground transition-colors hover:bg-primary/90'
                      >
                        <Sparkles className='size-4' />
                        {error ? 'Tentar de novo' : 'Gerar meu desafio'}
                        <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const GEN_MESSAGES = [
  'Inventando um cliente fictício…',
  'Definindo o formato dos dados de entrada…',
  'Escrevendo os testes escondidos…',
  'Calibrando a dificuldade pro seu nível…',
  'Preparando a primeira pergunta do tutor…',
]

function GeneratingChallenge() {
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(
      () => setI((v) => (v + 1) % GEN_MESSAGES.length),
      1900,
    )
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className='py-2'
    >
      <div className='flex items-center gap-3'>
        <div className='grid size-11 shrink-0 place-items-center rounded-xl bg-[#dad8ea]/55 text-[#1b1916]'>
          <Sparkles className='size-5' strokeWidth={1.5} />
        </div>
        <div className='min-w-0'>
          <div className='font-heading text-lg font-medium tracking-tight text-[#1b1916]'>
            A IA está criando seu desafio
          </div>
          <div className='flex items-center gap-1.5 text-sm text-[#6b6478]'>
            <Loader2 className='size-3.5 shrink-0 animate-spin' />
            <AnimatePresence mode='wait'>
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {GEN_MESSAGES[i]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className='mt-7 space-y-3'>
        <Skeleton className='h-4 w-3/4 rounded' />
        <Skeleton className='h-4 w-full rounded' />
        <Skeleton className='h-4 w-5/6 rounded' />
        <Skeleton className='mt-5 h-28 w-full rounded-xl' />
      </div>

      <div className='mt-6 flex items-start gap-2 rounded-xl border border-[#DFE5E9] bg-[#F7F9FA] px-3.5 py-2.5 text-[12px] text-[#6b6478]'>
        <Info className='mt-0.5 size-3.5 shrink-0' />
        <span>
          Gerando com a stack e o nível salvos no seu perfil. Quer mudar?{' '}
          <Link
            href='/profile'
            className='font-medium text-iris hover:underline'
          >
            Ajuste no perfil
          </Link>
          .
        </span>
      </div>
    </motion.div>
  )
}

function Tile({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'shadow-soft flex w-full cursor-pointer items-center gap-4 rounded-2xl border bg-white p-5 text-left transition-colors',
        selected
          ? 'border-primary/50 bg-primary/[0.04] ring-2 ring-primary/25'
          : 'border-[#DFE5E9] hover:border-[#1b1916]/20',
      )}
    >
      {children}
      <div
        className={cn(
          'grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
          selected ? 'border-primary bg-primary' : 'border-[#DFE5E9] bg-white',
        )}
      >
        {selected && <Check className='size-3.5 text-white' />}
      </div>
    </button>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border border-[#DFE5E9] bg-white p-4'>
      <div className='mb-1 font-mono text-[10px] tracking-wider text-[#6b6478] uppercase'>
        {label}
      </div>
      <div className='font-heading text-base font-medium tracking-tight text-[#1b1916]'>
        {value}
      </div>
    </div>
  )
}
