'use client'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/auth/use-user'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react'
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
]

type Step = 0 | 1 | 2

export default function OnboardingPage() {
  const [step, setStep] = React.useState<Step>(0)
  const [stack, setStack] = React.useState<string | null>(null)
  const [level, setLevel] = React.useState<string | null>(null)

  const canNext = (step === 0 && stack) || (step === 1 && level) || step === 2

  const router = useRouter()
  const { user } = useUser()
  const [starting, setStarting] = React.useState(false)

  async function start() {
    if (starting) return
    if (!user) {
      router.push('/login?next=/onboarding')
      return
    }
    setStarting(true)
    const dbStack = stack === 'js' ? 'javascript' : 'typescript'
    const dbLevel = level === 'mid' ? 'intermediate' : 'beginner'

    const byBoth = await supabase
      .from('challenges')
      .select('id')
      .eq('stack', dbStack)
      .eq('level', dbLevel)
      .limit(1)
    let id = byBoth.data?.[0]?.id as string | undefined

    if (!id) {
      const byStack = await supabase
        .from('challenges')
        .select('id')
        .eq('stack', dbStack)
        .limit(1)
      id = byStack.data?.[0]?.id as string | undefined
    }
    if (!id) {
      const any = await supabase.from('challenges').select('id').limit(1)
      id = any.data?.[0]?.id as string | undefined
    }
    router.push(id ? `/challenge?id=${id}` : '/challenge')
  }

  return (
    <div className='relative flex min-h-screen flex-1 flex-col bg-white'>
      <header className='flex h-16 shrink-0 items-center justify-between px-6 sm:px-10'>
        <Logo />
        <Link
          href='/'
          className='text-sm text-[#6b6478] transition-colors hover:text-[#1b1916]'
        >
          Voltar ao site
        </Link>
      </header>

      <main className='flex flex-1 flex-col pt-6 pb-16'>
        <div className='mx-auto flex w-full max-w-3xl flex-1 flex-col px-4'>
          {/* Stepper */}
          <div className='mb-12 flex items-center gap-2'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='flex-1'>
                <div
                  className={cn(
                    'h-1 rounded-full transition-all duration-500',
                    step >= i
                      ? 'bg-linear-to-r from-iris to-mint'
                      : 'bg-[#DFE5E9]',
                  )}
                />
                <div className='mt-2 font-mono text-[10px] tracking-wider text-[#6b6478] uppercase'>
                  {['Stack', 'Nível', 'Pronto'][i]}
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence mode='wait'>
            {step === 0 && (
              <StepShell
                key='stack'
                eyebrow='01 · Stack'
                title='Em qual linguagem você quer apanhar hoje?'
                subtitle='A IA gera desafios realistas no idioma da sua escolha.'
              >
                <div className='grid gap-3 sm:grid-cols-2'>
                  {stacks.map((s, i) => (
                    <Tile
                      key={s.id}
                      i={i}
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
                        <div className='text-sm text-[#6b6478]'>{s.desc}</div>
                      </div>
                    </Tile>
                  ))}
                </div>
              </StepShell>
            )}

            {step === 1 && (
              <StepShell
                key='level'
                eyebrow='02 · Nível'
                title='Honestidade radical: onde você está?'
                subtitle='Não tem premiação por mentir. Quanto mais real, melhor o desafio.'
              >
                <div className='space-y-3'>
                  {levels.map((l, i) => (
                    <Tile
                      key={l.id}
                      i={i}
                      selected={level === l.id}
                      onClick={() => setLevel(l.id)}
                    >
                      <div className='flex flex-col gap-1.5'>
                        <div className='flex items-center gap-1'>
                          {Array.from({ length: 3 }).map((_, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                'h-2 w-6 rounded-full',
                                idx < l.intensity
                                  ? 'bg-linear-to-r from-iris to-mint'
                                  : 'bg-[#DFE5E9]',
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
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
              </StepShell>
            )}

            {step === 2 && (
              <motion.div
                key='ready'
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5 }}
                className='text-center'
              >
                <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-[#DFE5E9] bg-white px-3 py-1 font-mono text-[11px] text-[#6b6478]'>
                  <span className='size-1 animate-pulse rounded-full bg-mint' />
                  Tudo pronto
                </div>
                <h1 className='mb-6 font-heading text-4xl leading-tight font-light tracking-[-0.035em] text-[#1b1916] sm:text-5xl'>
                  Hora de{' '}
                  <span className='text-gradient font-serif font-normal italic'>
                    pensar
                  </span>
                  .
                </h1>
                <p className='mx-auto mb-10 max-w-md text-lg text-[#2c2330]'>
                  Vou gerar um desafio real, com cliente fictício e tudo. Sem
                  resposta pronta. Sem cópia.
                </p>
                <div className='mx-auto mb-10 grid max-w-sm gap-3 sm:grid-cols-2'>
                  <SummaryItem
                    label='Stack'
                    value={stacks.find((s) => s.id === stack)?.name ?? '-'}
                  />
                  <SummaryItem
                    label='Nível'
                    value={levels.find((l) => l.id === level)?.name ?? '-'}
                  />
                </div>
                <div className='relative flex w-full items-center justify-between'>
                  <Button
                    variant='ghost'
                    size='lg'
                    onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
                    className='rounded-full text-[#6b6478] hover:text-[#1b1916]'
                  >
                    <ArrowLeft className='size-4' /> Voltar
                  </Button>
                  <Button
                    size='xl'
                    onClick={start}
                    disabled={starting}
                    className='glow-iris group absolute left-1/2 h-12 -translate-x-1/2 rounded-full border-transparent bg-primary pr-4 pl-5 text-[15px] text-primary-foreground hover:bg-primary/90 disabled:opacity-60'
                  >
                    {starting ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Sparkles className='size-4' />
                    )}
                    Gerar meu desafio
                    <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
                  </Button>
                  <div />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className='mt-12 flex items-center justify-between'
            >
              <Button
                variant='ghost'
                size='lg'
                onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
                disabled={step === 0}
                className={cn(
                  'rounded-full text-[#6b6478] hover:text-[#1b1916]',
                  step === 0 && 'invisible',
                )}
              >
                <ArrowLeft className='size-4' /> Voltar
              </Button>
              <Button
                size='lg'
                disabled={!canNext}
                onClick={() => setStep((s) => Math.min(2, s + 1) as Step)}
                className='rounded-full border-transparent bg-primary pr-3 pl-4 text-primary-foreground hover:bg-primary/90 disabled:opacity-40'
              >
                Continuar <ArrowRight className='size-4' />
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className='mb-8'>
        <div className='mb-3 font-mono text-[11px] font-semibold tracking-[0.08em] text-[#6b6478] uppercase'>
          {eyebrow}
        </div>
        <h2 className='type-h3'>{title}</h2>
        <p className='type-body mt-3'>{subtitle}</p>
      </div>
      {children}
    </motion.div>
  )
}

function Tile({
  i,
  selected,
  onClick,
  children,
}: {
  i: number
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.button
      type='button'
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06, duration: 0.4 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'shadow-soft flex w-full items-center gap-4 rounded-2xl border bg-white p-5 text-left transition-all',
        selected
          ? 'border-primary/50 bg-primary/[0.04] ring-2 ring-primary/25'
          : 'border-[#DFE5E9] hover:border-[#1b1916]/20',
      )}
    >
      {children}
      <div
        className={cn(
          'grid size-6 place-items-center rounded-full border transition-all',
          selected ? 'border-primary bg-primary' : 'border-[#DFE5E9] bg-white',
        )}
      >
        {selected && <Check className='size-3.5 text-white' />}
      </div>
    </motion.button>
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
