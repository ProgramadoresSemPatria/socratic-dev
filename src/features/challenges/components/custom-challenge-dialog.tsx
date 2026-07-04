'use client'

import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  Code2,
  Lightbulb,
  Loader2,
  Network,
  PenLine,
  Sparkles,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { generateChallenge, getTrainingRecommendation } from '../actions'
import { getAccessToken } from '@/lib/api/client'

type Kind = 'code' | 'design'
type Level = 'beginner' | 'intermediate' | 'advanced'

const LEVEL_IDS: Level[] = ['beginner', 'intermediate', 'advanced']

const STACKS = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
]

const MAX_PROMPT = 500

const copy = {
  en: {
    levels: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
    genericError: "Couldn't generate right now. Try again.",
    close: 'Close',
    buildingTitle: 'Building your challenge',
    buildingBody:
      'Interpreting what you asked for and generating the briefing, starter code, and hidden tests.',
    badge: 'Custom challenge',
    heading: 'Describe what you want to train.',
    subheading:
      'The AI builds a tailored challenge with a fictional briefing, tests, and a Socratic tutor. No cheating.',
    track: 'Track',
    code: 'Code',
    systemDesign: 'System Design',
    language: 'Language',
    level: 'Level',
    promptLabel: 'What do you want to train?',
    placeholderDesign:
      'E.g. architecture for a delivery app that needs to serve millions of orders/s, with real-time tracking.',
    placeholderCode:
      'E.g. I want to practice stream aggregation with time windows in JS, handling out-of-order events.',
    promptHelp:
      'At least 10 characters. The more specific, the more targeted the challenge.',
    recommendation: 'Recommendation',
    recommendationOptional: 'optional',
    useRecommendation: 'Use this suggestion',
    cancel: 'Cancel',
    generate: 'Generate my challenge',
  },
  pt: {
    levels: {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
    },
    genericError: 'Não consegui gerar agora. Tente de novo.',
    close: 'Fechar',
    buildingTitle: 'Montando o seu desafio',
    buildingBody:
      'Estou interpretando o que você pediu e gerando briefing, código inicial e testes escondidos.',
    badge: 'Desafio sob medida',
    heading: 'Descreve o que você quer treinar.',
    subheading:
      'A IA monta um desafio sob medida com briefing fictício, testes e tutor socrático. Sem cola.',
    track: 'Trilha',
    code: 'Código',
    systemDesign: 'System Design',
    language: 'Linguagem',
    level: 'Nível',
    promptLabel: 'O que você quer treinar?',
    placeholderDesign:
      'Ex.: arquitetura de um app de delivery que precisa servir milhões de pedidos/s, com tracking em tempo real.',
    placeholderCode:
      'Ex.: quero praticar agregação de stream com janelas de tempo em JS, lidando com eventos fora de ordem.',
    promptHelp:
      'Mínimo 10 caracteres. Quanto mais específico, mais direcionado o desafio.',
    recommendation: 'Recomendação',
    recommendationOptional: 'opcional',
    useRecommendation: 'Usar esta sugestão',
    cancel: 'Cancelar',
    generate: 'Gerar meu desafio',
  },
}

export function CustomChallengeDialog({
  open,
  onClose,
  defaultLevel = 'intermediate',
}: {
  open: boolean
  onClose: () => void
  defaultLevel?: Level
}) {
  const router = useRouter()
  const t = useT(copy)
  const [kind, setKind] = React.useState<Kind>('code')
  const [stack, setStack] = React.useState<string>('typescript')
  const [level, setLevel] = React.useState<Level>(defaultLevel)
  const [prompt, setPrompt] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [recommendation, setRecommendation] = React.useState<string | null>(
    null,
  )
  const [recommendationLoading, setRecommendationLoading] =
    React.useState(false)

  // Fetches once per dialog open, with the selections at open time. It's a
  // nudge, not a requirement — on failure it just stays hidden.
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setRecommendation(null)
    setRecommendationLoading(true)
    ;(async () => {
      try {
        const token = await getAccessToken()
        const result = await getTrainingRecommendation({
          token,
          kind,
          stack: kind === 'design' ? undefined : stack,
          level,
        })
        if (!cancelled && 'text' in result) setRecommendation(result.text)
      } catch {
        // silent — the tip is optional
      } finally {
        if (!cancelled) setRecommendationLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only on open, not on every chip change
  }, [open])

  async function submit() {
    if (submitting || prompt.trim().length < 10) return
    setSubmitting(true)
    setError(null)
    try {
      const token = await getAccessToken()
      const result = await generateChallenge({
        token,
        kind,
        stack: kind === 'design' ? undefined : stack,
        level,
        userPrompt: prompt.trim(),
      })
      if ('error' in result) {
        setError(result.error)
        setSubmitting(false)
        return
      }
      router.push(
        kind === 'design'
          ? `/design?id=${result.id}`
          : `/challenge?id=${result.id}`,
      )
    } catch {
      setError(t.genericError)
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm'
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className='shadow-soft-lg relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type='button'
              onClick={onClose}
              className='absolute top-4 right-4 z-10 grid size-8 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted'
              aria-label={t.close}
            >
              <X className='size-4' />
            </button>

            {submitting ? (
              <div className='flex flex-col items-center gap-4 px-10 py-16'>
                <div className='grid size-12 place-items-center rounded-xl bg-pastel-lavender/55 text-ink'>
                  <Sparkles className='size-6' strokeWidth={1.5} />
                </div>
                <h3 className='font-heading text-2xl font-light tracking-tight text-ink'>
                  {t.buildingTitle}
                </h3>
                <p className='max-w-[36ch] text-center text-sm text-muted-foreground'>
                  {t.buildingBody}
                </p>
                <Loader2 className='size-5 animate-spin text-primary' />
              </div>
            ) : (
              <div className='px-8 pt-9 pb-7'>
                <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary'>
                  <PenLine className='size-3' />
                  {t.badge}
                </div>
                <h2 className='type-h3 mb-2'>
                  {t.heading}
                </h2>
                <p className='mb-6 text-sm text-muted-foreground'>
                  {t.subheading}
                </p>

                <div className='space-y-5'>
                  <div>
                    <div className='mb-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase'>
                      {t.track}
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <ChoiceTile
                        selected={kind === 'code'}
                        onClick={() => setKind('code')}
                        icon={<Code2 className='size-4' />}
                        label={t.code}
                      />
                      <ChoiceTile
                        selected={kind === 'design'}
                        onClick={() => setKind('design')}
                        icon={<Network className='size-4' />}
                        label={t.systemDesign}
                      />
                    </div>
                  </div>

                  {kind === 'code' && (
                    <div>
                      <div className='mb-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase'>
                        {t.language}
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {STACKS.map((s) => (
                          <Chip
                            key={s.id}
                            selected={stack === s.id}
                            onClick={() => setStack(s.id)}
                          >
                            {s.label}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className='mb-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase'>
                      {t.level}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {LEVEL_IDS.map((id) => (
                        <Chip
                          key={id}
                          selected={level === id}
                          onClick={() => setLevel(id)}
                        >
                          {t.levels[id]}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className='mb-2 flex items-center justify-between font-mono text-[10px] tracking-wider text-muted-foreground uppercase'>
                      <span>{t.promptLabel}</span>
                      <span>
                        {prompt.length}/{MAX_PROMPT}
                      </span>
                    </div>
                    <textarea
                      autoFocus
                      value={prompt}
                      onChange={(e) =>
                        setPrompt(e.target.value.slice(0, MAX_PROMPT))
                      }
                      rows={3}
                      placeholder={
                        kind === 'design'
                          ? t.placeholderDesign
                          : t.placeholderCode
                      }
                      className='w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-[14px] text-ink outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
                    />
                    <p className='mt-1.5 text-[12px] text-muted-foreground'>
                      {t.promptHelp}
                    </p>

                    {(recommendationLoading || recommendation) && (
                      <div className='mt-3 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3'>
                        <div className='mb-1.5 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-primary uppercase'>
                          <Lightbulb className='size-3' />
                          <span>{t.recommendation}</span>
                          <span className='text-muted-foreground'>
                            · {t.recommendationOptional}
                          </span>
                        </div>
                        {recommendationLoading ? (
                          <div className='space-y-1.5'>
                            <div className='h-3.5 w-full animate-pulse rounded bg-muted' />
                            <div className='h-3.5 w-3/5 animate-pulse rounded bg-muted' />
                          </div>
                        ) : (
                          <>
                            <p className='text-[13px] leading-relaxed text-ink'>
                              {recommendation}
                            </p>
                            <button
                              type='button'
                              onClick={() =>
                                setPrompt(
                                  (recommendation ?? '').slice(0, MAX_PROMPT),
                                )
                              }
                              className='mt-2 cursor-pointer text-[12px] font-medium text-primary hover:underline'
                            >
                              {t.useRecommendation}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className='border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm'>
                      {error}
                    </div>
                  )}
                </div>

                <div className='mt-7 flex gap-2'>
                  <button
                    type='button'
                    onClick={onClose}
                    className='border-border text-muted-foreground hover:bg-muted hover:text-ink flex-1 cursor-pointer rounded-full border px-5 py-2.5 text-sm font-medium transition-colors'
                  >
                    {t.cancel}
                  </button>
                  <button
                    type='button'
                    onClick={submit}
                    disabled={prompt.trim().length < 10}
                    className='group bg-ink hover:bg-primary inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-tight text-background transition-colors disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <PenLine className='size-4' />
                    {t.generate}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ChoiceTile({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-xl border bg-card px-4 py-3 text-sm font-medium text-ink transition-colors',
        selected
          ? 'border-primary/50 bg-primary/[0.04] ring-2 ring-primary/25'
          : 'border-border hover:border-ink/20',
      )}
    >
      <span className='grid size-7 place-items-center rounded-lg bg-pastel-lavender/55 text-ink'>
        {icon}
      </span>
      {label}
    </button>
  )
}

function Chip({
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
        'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}
