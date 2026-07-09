'use client'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { levelById, levelByUiId } from '@/domain/levels'
import { stackById, stackByUiId } from '@/domain/stacks'
import { getNextChallenge } from '@/features/challenges/actions'
import {
  Halftone,
  glyph,
  paintArchitecture,
} from '@/features/landing/components/halftone'
import { getAccessToken } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

const paintCode = glyph('>_', 1.5)
const paintBraces = glyph('{ }', 2)

const copy = {
  en: {
    stacks: [
      {
        id: 'js',
        name: 'JavaScript',
        desc: 'Web, Node, full-stack',
        icon: 'JS',
        chip: 'bg-pastel-sand',
      },
      {
        id: 'ts',
        name: 'TypeScript',
        desc: 'Type safety, modern tooling',
        icon: 'TS',
        chip: 'bg-pastel-mist',
      },
      {
        id: 'py',
        name: 'Python',
        desc: 'Backend, data, scripts',
        icon: 'PY',
        chip: 'bg-pastel-sage',
      },
      {
        id: 'react',
        name: 'React',
        desc: 'Components, hooks, state',
        icon: 'RX',
        chip: 'bg-pastel-lavender',
      },
    ],
    levels: [
      {
        id: 'starter',
        name: 'Beginner',
        tag: 'Just starting out',
        desc: 'Variables, conditionals, loops, arrays. No pressure.',
        intensity: 1,
        fill: 'bg-pastel-sage',
      },
      {
        id: 'junior',
        name: 'Junior',
        tag: 'Built a few projects',
        desc: 'Functions, objects, fetch, async/await. Comfortable reading docs.',
        intensity: 2,
        fill: 'bg-pastel-mist',
      },
      {
        id: 'mid',
        name: 'Intermediate',
        tag: 'Ready to level up',
        desc: 'Patterns, architecture, performance. Tougher code reviews.',
        intensity: 3,
        fill: 'bg-pastel-sand',
      },
      {
        id: 'advanced',
        name: 'Advanced',
        tag: 'Big tech ambitions',
        desc: 'Algorithms, optimal complexity, edge cases. FAANG interview energy.',
        intensity: 4,
        fill: 'bg-pastel-lavender',
      },
    ],
    tracks: [
      {
        id: 'code',
        name: 'Code',
        desc: 'Solve a real problem in the editor, with tests.',
        fill: 'bg-pastel-greige',
      },
      {
        id: 'design',
        name: 'System Design',
        desc: 'Architect systems on a canvas; the AI reviews it.',
        fill: 'bg-pastel-mist',
      },
    ],
    stepMeta: [
      {
        title: 'How do you want to train today?',
        subtitle: 'Code or system design (architecture). Pick your track.',
      },
      {
        title: 'Radical honesty: where are you?',
        subtitle:
          'The more honest you are, the better the AI calibrates the challenge.',
      },
      {
        title: 'Time to think.',
        subtitle:
          "I'll generate a real challenge, with a fictional client. No copy-paste.",
      },
    ],
    stepLabels: ['Track', 'Level', 'Ready'],
    setup: 'Setup',
    backToSite: 'Back to site',
    language: 'Language',
    designNotePre: "System design has no language, so you'll ",
    designNoteBold: 'sketch the system architecture',
    designNotePost: ' (services, data, flow) on a canvas and the AI reviews it.',
    trackLabel: 'Track',
    levelLabel: 'Level',
    designValue: 'System Design',
    codeValue: 'Code',
    genError: "The AI couldn't generate a challenge right now. Try again.",
    connError: "Couldn't reach the AI. Check your connection and try again.",
    back: 'Back',
    next: 'Continue',
    retry: 'Try again',
    generate: 'Generate my challenge',
  },
  pt: {
    stacks: [
      {
        id: 'js',
        name: 'JavaScript',
        desc: 'Web, Node, full-stack',
        icon: 'JS',
        chip: 'bg-pastel-sand',
      },
      {
        id: 'ts',
        name: 'TypeScript',
        desc: 'Type safety, tooling moderno',
        icon: 'TS',
        chip: 'bg-pastel-mist',
      },
      {
        id: 'py',
        name: 'Python',
        desc: 'Backend, dados, scripts',
        icon: 'PY',
        chip: 'bg-pastel-sage',
      },
      {
        id: 'react',
        name: 'React',
        desc: 'Componentes, hooks, estado',
        icon: 'RX',
        chip: 'bg-pastel-lavender',
      },
    ],
    levels: [
      {
        id: 'starter',
        name: 'Iniciante',
        tag: 'Comecei agora',
        desc: 'Variáveis, condicionais, loops, arrays. Sem traumas.',
        intensity: 1,
        fill: 'bg-pastel-sage',
      },
      {
        id: 'junior',
        name: 'Júnior',
        tag: 'Já fiz alguns projetos',
        desc: 'Funções, objetos, fetch, async/await. Confortável com docs.',
        intensity: 2,
        fill: 'bg-pastel-mist',
      },
      {
        id: 'mid',
        name: 'Intermediário',
        tag: 'Quero crescer',
        desc: 'Padrões, arquitetura, performance. Code review mais duro.',
        intensity: 3,
        fill: 'bg-pastel-sand',
      },
      {
        id: 'advanced',
        name: 'Avançado',
        tag: 'Quero nível big tech',
        desc: 'Algoritmos, complexidade ótima, edge cases. Pegada de entrevista FAANG.',
        intensity: 4,
        fill: 'bg-pastel-lavender',
      },
    ],
    tracks: [
      {
        id: 'code',
        name: 'Código',
        desc: 'Resolva um problema real no editor, com testes.',
        fill: 'bg-pastel-greige',
      },
      {
        id: 'design',
        name: 'System Design',
        desc: 'Arquitete sistemas num canvas; a IA analisa.',
        fill: 'bg-pastel-mist',
      },
    ],
    stepMeta: [
      {
        title: 'Como você quer treinar hoje?',
        subtitle: 'Código ou system design (arquitetura). Escolha a trilha.',
      },
      {
        title: 'Honestidade radical: onde você está?',
        subtitle: 'Quanto mais real você for, melhor a IA calibra o desafio.',
      },
      {
        title: 'Hora de pensar.',
        subtitle: 'Vou gerar um desafio real, com cliente fictício. Sem cópia.',
      },
    ],
    stepLabels: ['Trilha', 'Nível', 'Pronto'],
    setup: 'Setup',
    backToSite: 'Voltar ao site',
    language: 'Linguagem',
    designNotePre: 'System design não tem linguagem, então você vai ',
    designNoteBold: 'desenhar a arquitetura do sistema',
    designNotePost: ' (serviços, dados, fluxo) num canvas e a IA analisa.',
    trackLabel: 'Trilha',
    levelLabel: 'Nível',
    designValue: 'System Design',
    codeValue: 'Código',
    genError: 'A IA não conseguiu gerar o desafio agora. Tente de novo.',
    connError: 'Falha ao falar com a IA. Verifique a conexão e tente de novo.',
    back: 'Voltar',
    next: 'Continuar',
    retry: 'Tentar de novo',
    generate: 'Gerar meu desafio',
  },
}

type Step = 0 | 1 | 2

export function OnboardingFlow({ user }: { user: User }) {
  const router = useRouter()
  const t = useT(copy)
  const [step, setStep] = React.useState<Step>(0)
  const [track, setTrack] = React.useState<string | null>(null)
  const [stack, setStack] = React.useState<string | null>(null)
  const [level, setLevel] = React.useState<string | null>(null)
  const [starting, setStarting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const meta = user.user_metadata as
      | {
          preferred_track?: string
          preferred_stack?: string
          preferred_level?: string
        }
      | undefined

    const onboarded =
      !!meta?.preferred_level &&
      (meta?.preferred_track === 'design' || !!meta?.preferred_stack)
    if (onboarded) {
      router.replace('/dashboard')
      return
    }

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
      const token = await getAccessToken()
      const result = await getNextChallenge(
        trk === 'design'
          ? {
              kind: 'design',
              level: dbLevel as 'beginner' | 'intermediate' | 'advanced',
              token,
            }
          : {
              kind: 'code',
              stack: dbStack,
              level: dbLevel as 'beginner' | 'intermediate' | 'advanced',
              token,
            },
      )
      if ('error' in result || !result?.id) {
        setError(('error' in result && result.error) || t.genError)
        setStarting(false)
        return
      }
      router.push(
        trk === 'design'
          ? `/design?id=${result.id}`
          : `/challenge?id=${result.id}`,
      )
    } catch {
      setError(t.connError)
      setStarting(false)
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

  const meta = t.stepMeta[step]

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-background'>
      <div className='h-[2px] w-full shrink-0 bg-border'>
        <div
          className='h-full bg-primary transition-all duration-700 ease-out'
          style={{ width: starting ? '100%' : `${((step + 1) / 3) * 100}%` }}
        />
      </div>

      <header className='container-main flex h-16 w-full max-w-6xl shrink-0 items-center justify-between'>
        <Logo />
        <Link
          href='/'
          className='text-sm text-muted-foreground transition-colors hover:text-ink'
        >
          {t.backToSite}
        </Link>
      </header>

      {starting ? (
        <GeneratingChallenge design={track === 'design'} />
      ) : (
        <>
          <main className='flex flex-1 items-start py-8 md:py-14'>
            <div className='container-main grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20'>
              <div className='lg:sticky lg:top-14 lg:self-start'>
                <div className='flex items-baseline gap-4'>
                  <p className='eyebrow'>{t.setup}</p>
                  <span className='font-mono text-[11px] tracking-[0.14em] text-muted-foreground tabular-nums'>
                    {String(step + 1).padStart(2, '0')} / 03
                  </span>
                </div>
                <h1 className='type-h2 mt-5 max-w-[16ch]'>{meta.title}</h1>
                <p className='type-body mt-4 max-w-[38ch]'>{meta.subtitle}</p>

                <div className='mt-10 hidden space-y-3 border-t border-border pt-6 lg:block'>
                  {t.stepLabels.map((label, idx) => (
                    <div
                      key={label}
                      className={cn(
                        'flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors duration-300',
                        idx === step
                          ? 'text-ink'
                          : 'text-muted-foreground/50',
                      )}
                    >
                      <span className='tabular-nums'>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{label}</span>
                      {idx < step && <Check className='size-3 text-primary' />}
                    </div>
                  ))}
                </div>
              </div>

              <div className='pb-4'>
                <div>
                    {step === 0 && (
                      <div className='space-y-8'>
                        <div className='grid gap-4 sm:grid-cols-2'>
                          {t.tracks.map((tk) => (
                            <Tile
                              key={tk.id}
                              selected={track === tk.id}
                              onClick={() => setTrack(tk.id)}
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
                                  draw={
                                    tk.id === 'code'
                                      ? paintCode
                                      : paintArchitecture
                                  }
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
                                  onClick={() => setStack(s.id)}
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
                                  <span className='text-sm font-medium'>
                                    {s.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {track === 'design' && (
                          <div className='rounded-lg bg-pastel-sage p-5 text-sm text-muted-foreground'>
                            {t.designNotePre}
                            <span className='font-medium text-ink'>
                              {t.designNoteBold}
                            </span>
                            {t.designNotePost}
                          </div>
                        )}
                      </div>
                    )}

                    {step === 1 && (
                      <div className='space-y-4'>
                        {t.levels.map((l) => (
                          <Tile
                            key={l.id}
                            selected={level === l.id}
                            onClick={() => setLevel(l.id)}
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
                                    idx < l.intensity
                                      ? 'bg-primary/75'
                                      : 'bg-ink/10',
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
                    )}

                    {step === 2 && (
                      <div className='grid grid-cols-2 gap-6 pt-2 sm:gap-10'>
                        <SummaryItem
                          label={t.trackLabel}
                          value={
                            track === 'design'
                              ? t.designValue
                              : (t.stacks.find((s) => s.id === stack)?.name ??
                                t.codeValue)
                          }
                        />
                        <SummaryItem
                          label={t.levelLabel}
                          value={
                            t.levels.find((l) => l.id === level)?.name ?? '—'
                          }
                        />
                      </div>
                    )}
                </div>

                {error && (
                  <div className='mt-6 rounded-lg bg-destructive/5 px-4 py-3 text-sm text-destructive'>
                    {error}
                  </div>
                )}
              </div>
            </div>
          </main>

          <div className='sticky bottom-0 z-10 border-t border-border bg-background/90 backdrop-blur'>
            <div className='container-main flex h-16 w-full max-w-6xl items-center justify-between'>
              <Button
                variant='ghost'
                onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
                className={cn(step === 0 && 'invisible')}
              >
                <ArrowLeft className='size-4' /> {t.back}
              </Button>

              {step < 2 ? (
                <Button
                  variant='ink'
                  size='lg'
                  disabled={!canNext}
                  onClick={() => setStep((s) => Math.min(2, s + 1) as Step)}
                  className='group'
                >
                  {t.next}
                  <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
                </Button>
              ) : (
                <Button
                  variant='ink'
                  size='lg'
                  onClick={start}
                  className='group'
                >
                  <Sparkles className='size-4' />
                  {error ? t.retry : t.generate}
                  <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const genCopy = {
  en: {
    eyebrow: 'Generating',
    title: 'Building your challenge.',
    messages: [
      'parsing your request…',
      'inventing a fictional client…',
      'writing the briefing…',
      'hiding the tests…',
      'calibrating difficulty to your level…',
    ],
    notePre:
      'Generating with the stack and level saved to your profile. Want to change them?',
    noteLink: 'Update your profile',
  },
  pt: {
    eyebrow: 'Gerando',
    title: 'Montando seu desafio.',
    messages: [
      'interpretando pedido…',
      'inventando cliente fictício…',
      'gerando briefing…',
      'escondendo testes…',
      'calibrando dificuldade pro seu nível…',
    ],
    notePre: 'Gerando com a stack e o nível salvos no seu perfil. Quer mudar?',
    noteLink: 'Ajuste no perfil',
  },
}

function GeneratingChallenge({ design }: { design: boolean }) {
  const t = useT(genCopy)
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(
      () => setI((v) => Math.min(v + 1, t.messages.length - 1)),
      1700,
    )
    return () => clearInterval(timer)
  }, [t.messages.length])

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className='relative flex flex-1 items-center overflow-hidden'
    >
      <div className='pointer-events-none absolute inset-x-0 top-1/2 h-[420px] -translate-y-1/2 opacity-25 mix-blend-multiply dark:mix-blend-screen'>
        <Halftone
          draw={design ? paintArchitecture : paintBraces}
          ambient
          spacing={9}
        />
      </div>

      <div className='container-main relative w-full max-w-6xl pb-16'>
        <div className='max-w-md'>
          <div className='flex items-center gap-3'>
            <p className='eyebrow'>{t.eyebrow}</p>
            <Loader2 className='size-3.5 animate-spin text-muted-foreground' />
          </div>
          <h1 className='type-h2 mt-5'>{t.title}</h1>

          <div className='mt-10 space-y-3 font-mono text-[13px]'>
            {t.messages.slice(0, i + 1).map((m, idx) => (
              <motion.div
                key={m}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex items-center gap-3',
                  idx < i ? 'text-muted-foreground' : 'text-ink',
                )}
              >
                <span className='grid w-4 shrink-0 place-items-center'>
                  {idx < i ? (
                    <Check className='size-3.5 text-mint' />
                  ) : (
                    <Loader2 className='size-3.5 animate-spin text-primary' />
                  )}
                </span>
                <span>{m}</span>
              </motion.div>
            ))}
          </div>

          <div className='mt-14 border-t border-border pt-5 text-[12px] text-muted-foreground'>
            {t.notePre}{' '}
            <Link
              href='/profile'
              className='link-underline font-medium text-ink'
            >
              {t.noteLink}
            </Link>
            .
          </div>
        </div>
      </div>
    </motion.main>
  )
}

function Tile({
  selected,
  onClick,
  className,
  children,
}: {
  selected: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-lg text-left transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft-lg',
        selected && 'ring-2 ring-primary',
        className,
      )}
    >
      {children}
      <span
        className={cn(
          'absolute top-3 right-3 grid size-6 place-items-center rounded-full transition-all duration-300',
          selected
            ? 'scale-100 bg-lime text-ink opacity-100 dark:text-background'
            : 'scale-75 opacity-0',
        )}
      >
        <Check className='size-3.5' />
      </span>
    </button>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='border-l border-border pl-5 sm:pl-6'>
      <div className='font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase'>
        {label}
      </div>
      <div className='mt-3 font-heading text-3xl font-light tracking-tight text-ink sm:text-4xl'>
        {value}
      </div>
    </div>
  )
}
