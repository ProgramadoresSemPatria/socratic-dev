'use client'

import { Button } from '@/components/ui/button'
import { Halftone, glyph } from '@/features/landing/components/halftone'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  GitPullRequestArrow,
  Link2,
  Loader2,
  X,
  XCircle,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import { FormattedText } from './formatted-text'

const copy = {
  en: {
    copyLink: 'Copy the link:',
    close: 'Close',
    badgePass: 'Socratic code review',
    badgeFail: 'Not passing yet',
    headPassPre: "You submitted. Now let's ",
    headPassWord: 'defend',
    headPassPost: ' it.',
    headFailPre: 'Almost there. Go back and ',
    headFailWord: 'rework',
    headFailPost: ' it.',
    subPass: 'The tutor reviewed your work. Read it, answer in your head, and improve.',
    subFail:
      "The challenge isn't solved yet. Use the feedback below to close the gap.",
    generating: 'Generating review…',
    independence: 'Independence',
    independenceHint:
      'Starts at 100. Every hint costs. It measures how much you thought on your own.',
    hintsUsed: 'Hints used',
    time: 'Time',
    reviewTitle: 'The review',
    reviewAgain: 'Keep working',
    linkCopied: 'Link copied',
    share: 'Share',
    finish: 'Finish',
    markFailed: 'Mark as failed',
    celebrationFail: "Not this time. But you thought. Come back.",
    celebrationHigh: 'You are free. Socrates would approve.',
    celebrationMid: 'Good work. You did the thinking.',
    celebrationLow: 'Done. Independence is practice. Keep going.',
    noTests: 'No automated tests in this challenge. The review below is the evaluation.',
    testsSolved: (passed: number, total: number) =>
      `Passed every test (${passed}/${total}). Challenge solved.`,
    testsNotSolved: (passed: number, total: number) =>
      `Passed ${passed}/${total} tests. Not solved yet. Use the review to close the gap.`,
  },
  pt: {
    copyLink: 'Copie o link:',
    close: 'Fechar',
    badgePass: 'Code Review Socrático',
    badgeFail: 'Ainda não passou',
    headPassPre: 'Você submeteu. Agora vamos ',
    headPassWord: 'defender',
    headPassPost: '.',
    headFailPre: 'Quase lá. Volta e ',
    headFailWord: 'refaz',
    headFailPost: '.',
    subPass: 'O tutor revisou seu trabalho. Leia, responda mentalmente e melhore.',
    subFail:
      'O desafio ainda não foi resolvido. Use o feedback abaixo pra fechar o que falta.',
    generating: 'Gerando review…',
    independence: 'Independência',
    independenceHint:
      'Começa em 100. Cada hint custa. É o quanto você pensou sozinho.',
    hintsUsed: 'Hints usados',
    time: 'Tempo',
    reviewTitle: 'O review',
    reviewAgain: 'Revisar de novo',
    linkCopied: 'Link copiado',
    share: 'Compartilhar',
    finish: 'Concluir',
    markFailed: 'Marcar como reprovado',
    celebrationFail: 'Não passou desta vez. Mas você pensou. Volta.',
    celebrationHigh: 'Você é livre. Sócrates aprovaria.',
    celebrationMid: 'Bom trabalho. Você pensou.',
    celebrationLow: 'Concluído. Independência é prática. Continue.',
    noTests: 'Sem testes automáticos neste desafio. O review abaixo é a avaliação.',
    testsSolved: (passed: number, total: number) =>
      `Passou em todos os testes (${passed}/${total}). Desafio resolvido.`,
    testsNotSolved: (passed: number, total: number) =>
      `Passou ${passed}/${total} testes. Ainda não resolvido. Use o review pra fechar o que falta.`,
  },
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export type ReviewOutcome = 'pass' | 'fail'

export function ReviewModal({
  review,
  reviewing,
  independence,
  hintsUsed,
  elapsed,
  tests,
  outcome = 'pass',
  sessionId,
  onClose,
  onComplete,
}: {
  review: string | null
  reviewing: boolean
  independence: number
  hintsUsed: number
  elapsed: number
  tests: { passed: number; total: number } | null
  outcome?: ReviewOutcome
  sessionId?: string | null
  onClose: () => void
  onComplete?: () => void
}) {
  const t = useT(copy)
  const [celebrating, setCelebrating] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  function handleComplete() {
    if (celebrating) return
    setCelebrating(true)
    setTimeout(() => onComplete?.(), 1600)
  }

  async function copyShareLink() {
    if (!sessionId || typeof window === 'undefined') return
    const url = `${window.location.origin}/replay/${sessionId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(t.copyLink, url)
    }
  }

  const passed = outcome === 'pass'
  const canShare = passed && !!sessionId

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className='shadow-soft-lg border-border bg-card relative flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className='border-border bg-card text-muted-foreground hover:bg-muted hover:text-ink absolute top-4 right-4 z-10 grid size-8 cursor-pointer place-items-center rounded-full border transition-colors duration-200'
          aria-label={t.close}
        >
          <X className='size-4' />
        </button>

        <div className='grid min-h-0 flex-1 max-lg:overflow-y-auto lg:grid-cols-[300px_1fr]'>
          <aside className='border-border flex shrink-0 flex-col gap-7 border-b p-5 sm:p-7 lg:border-r lg:border-b-0'>
            <div>
              <div
                className={cn(
                  'mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px]',
                  passed
                    ? 'bg-lime text-ink dark:text-background'
                    : 'bg-warning/10 text-warning-foreground',
                )}
              >
                <GitPullRequestArrow className='size-3' strokeWidth={1.5} />
                {passed ? t.badgePass : t.badgeFail}
              </div>
              <h2 className='type-h4 text-balance'>
                {passed ? (
                  <>
                    {t.headPassPre}
                    <span className='text-primary font-serif italic'>
                      {t.headPassWord}
                    </span>
                    {t.headPassPost}
                  </>
                ) : (
                  <>
                    {t.headFailPre}
                    <span className='text-primary font-serif italic'>
                      {t.headFailWord}
                    </span>
                    {t.headFailPost}
                  </>
                )}
              </h2>
              <p className='text-muted-foreground mt-2.5 text-[13px] leading-relaxed'>
                {passed ? t.subPass : t.subFail}
              </p>
            </div>

            <div title={t.independenceHint}>
              <div className='flex items-baseline'>
                <span className='font-heading text-ink text-[56px] leading-[0.85] font-light tracking-[-0.04em] tabular-nums sm:text-[72px]'>
                  {independence}
                </span>
                <span className='text-muted-foreground ml-1.5 font-mono text-sm'>
                  /100
                </span>
              </div>
              <div className='text-muted-foreground mt-2 font-mono text-[11px] tracking-wider uppercase'>
                {t.independence}
              </div>
            </div>

            <div className='border-border mt-auto flex border-t pt-5'>
              <div className='pr-8'>
                <div className='font-heading text-ink text-[24px] leading-none font-light tabular-nums'>
                  {hintsUsed}
                </div>
                <div className='text-muted-foreground mt-2 font-mono text-[11px] tracking-wider uppercase'>
                  {t.hintsUsed}
                </div>
              </div>
              <div className='border-border border-l pl-8'>
                <div className='font-heading text-ink text-[24px] leading-none font-light tabular-nums'>
                  {formatTime(elapsed)}
                </div>
                <div className='text-muted-foreground mt-2 font-mono text-[11px] tracking-wider uppercase'>
                  {t.time}
                </div>
              </div>
            </div>
          </aside>

          <div className='min-h-0 overflow-y-auto p-7'>
            {tests && <TestBanner passed={tests.passed} total={tests.total} />}
            <h3 className='type-h4 mb-3'>{t.reviewTitle}</h3>
            {reviewing || !review ? (
              <div className='bg-muted relative overflow-hidden rounded-lg px-6 py-14'>
                <div className='pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply dark:mix-blend-screen'>
                  <Halftone
                    draw={glyph('{ }', 2)}
                    ambient
                    spacing={9}
                    className='absolute inset-0'
                  />
                </div>
                <div className='text-muted-foreground relative flex items-center gap-2 text-sm'>
                  <Loader2 className='size-4 animate-spin' /> {t.generating}
                </div>
              </div>
            ) : (
              <div className='type-body'>
                <FormattedText text={review} />
              </div>
            )}
          </div>
        </div>

        <div className='border-border shrink-0 border-t px-7 py-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
            <Button
              size='lg'
              variant='ghost'
              onClick={onClose}
              className='text-muted-foreground hover:text-ink'
            >
              {t.reviewAgain}
            </Button>
            {canShare && (
              <Button size='lg' variant='ink' onClick={copyShareLink}>
                {copied ? (
                  <>
                    <CheckCircle2 className='size-4' />
                    {t.linkCopied}
                  </>
                ) : (
                  <>
                    <Link2 className='size-4' />
                    {t.share}
                  </>
                )}
              </Button>
            )}
            <Button
              size='lg'
              variant={passed ? 'ink' : 'default'}
              onClick={handleComplete}
              className={cn(
                !passed &&
                  'border-warning-foreground bg-warning-foreground text-background hover:bg-warning-foreground/90',
              )}
            >
              {passed ? (
                <>
                  <CheckCircle2 className='size-4' />
                  {t.finish}
                </>
              ) : (
                <>
                  <XCircle className='size-4' />
                  {t.markFailed}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {celebrating && (
          <Celebration passed={passed} independence={independence} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function celebrationLine(
  t: (typeof copy)['en' | 'pt'],
  passed: boolean,
  independence: number,
): string {
  if (!passed) return t.celebrationFail
  if (independence >= 85) return t.celebrationHigh
  if (independence >= 60) return t.celebrationMid
  return t.celebrationLow
}

function Celebration({
  passed,
  independence,
}: {
  passed: boolean
  independence: number
}) {
  const t = useT(copy)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-[60] grid place-items-center bg-background/95 backdrop-blur-sm'
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className='relative flex flex-col items-center'
      >
        <motion.div
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 6, opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className={cn(
            'absolute inset-0 -z-10 size-24 rounded-full',
            passed ? 'bg-primary/20' : 'bg-warning/20',
          )}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
          className={cn(
            'mb-6 grid size-24 place-items-center rounded-full',
            passed
              ? 'bg-ink text-background'
              : 'bg-warning-foreground text-background',
          )}
        >
          {passed ? (
            <CheckCircle2 className='size-12' strokeWidth={1.5} />
          ) : (
            <XCircle className='size-12' strokeWidth={1.5} />
          )}
        </motion.div>
        {passed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className='mb-4 text-center'
          >
            <span className='font-heading text-ink text-[88px] leading-none font-light tracking-[-0.04em] tabular-nums'>
              {independence}
            </span>
            <span className='text-muted-foreground ml-1.5 font-mono text-base'>
              /100
            </span>
          </motion.div>
        )}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className='font-heading text-ink max-w-[20ch] text-center text-3xl font-light tracking-tight sm:text-4xl'
        >
          <span className='font-serif italic'>
            {celebrationLine(t, passed, independence)}
          </span>
        </motion.h2>
      </motion.div>
    </motion.div>
  )
}

function TestBanner({ passed, total }: { passed: number; total: number }) {
  const t = useT(copy)
  if (total === 0) {
    return (
      <div className='mb-6 rounded-lg bg-muted px-4 py-3 text-[13px] text-muted-foreground'>
        {t.noTests}
      </div>
    )
  }
  const solved = passed === total
  return (
    <div
      className={cn(
        'mb-6 flex items-center gap-2.5 rounded-lg px-4 py-3 text-[13px] font-medium',
        solved
          ? 'bg-lime text-ink dark:text-background'
          : 'bg-warning/10 text-warning-foreground',
      )}
    >
      {solved ? (
        <CheckCircle2 className='size-4 shrink-0' strokeWidth={1.5} />
      ) : (
        <XCircle className='size-4 shrink-0' strokeWidth={1.5} />
      )}
      {solved
        ? t.testsSolved(passed, total)
        : t.testsNotSolved(passed, total)}
    </div>
  )
}
