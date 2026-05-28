'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronRight, GitPullRequestArrow, Loader2, X } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { FormattedText } from './formatted-text'

export function ReviewModal({
  review,
  reviewing,
  independence,
  hintsUsed,
  onClose,
}: {
  review: string | null
  reviewing: boolean
  independence: number
  hintsUsed: number
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-xl'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className='border-gradient noise relative my-8 w-full max-w-2xl overflow-hidden rounded-3xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='absolute top-4 right-4 z-10'>
          <button
            onClick={onClose}
            className='grid size-8 place-items-center rounded-full border border-white/[0.08] bg-white/[0.05] transition-colors hover:bg-white/[0.1]'
          >
            <X className='size-4' />
          </button>
        </div>

        <div className='px-8 pt-10 pb-6'>
          <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-iris/20 bg-iris/10 px-3 py-1 font-mono text-[11px] text-iris'>
            <GitPullRequestArrow className='size-3' />
            Code Review Socrático
          </div>
          <h2 className='mb-2 font-heading text-3xl leading-tight font-semibold tracking-[-0.02em]'>
            Você submeteu. Agora vamos{' '}
            <span className='text-gradient font-serif font-normal italic'>
              defender
            </span>
            .
          </h2>
          <p className='text-muted-foreground'>
            O tutor revisou seu código. Leia, responda mentalmente e melhore.
          </p>
        </div>

        <div className='px-8 pb-6'>
          {reviewing || !review ? (
            <div className='flex items-center gap-2 py-8 text-sm text-muted-foreground'>
              <Loader2 className='size-4 animate-spin' /> Gerando review…
            </div>
          ) : (
            <div className='glass rounded-2xl p-5 text-[14px] leading-relaxed text-foreground/95'>
              <FormattedText text={review} />
            </div>
          )}
        </div>

        <div className='border-t border-white/[0.06] bg-white/[0.015] px-8 py-6'>
          <div className='mb-5 grid grid-cols-2 gap-3'>
            <Metric
              label='Independência'
              value={`${independence}%`}
              accent='mint'
            />
            <Metric label='Hints usados' value={String(hintsUsed)} />
          </div>
          <div className='flex gap-2'>
            <Button
              size='lg'
              variant='ghost'
              onClick={onClose}
              className='flex-1 rounded-xl'
            >
              Revisar de novo
            </Button>
            <Button
              size='lg'
              className='flex-1 rounded-xl border-transparent bg-primary text-primary-foreground hover:bg-primary/90'
              render={<Link href='/dashboard' />}
            >
              Ver progresso <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'mint' | 'iris'
}) {
  return (
    <div className='rounded-xl border border-white/[0.05] bg-white/[0.025] p-3'>
      <div className='mb-1 font-mono text-[10px] tracking-wider text-muted-foreground/60 uppercase'>
        {label}
      </div>
      <div
        className={cn(
          'font-heading text-lg font-semibold tabular-nums',
          accent === 'mint' && 'text-mint',
          accent === 'iris' && 'text-iris',
        )}
      >
        {value}
      </div>
    </div>
  )
}
