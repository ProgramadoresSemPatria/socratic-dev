'use client'

import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Code2, Lightbulb, Network } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { copy } from './copy'
import { LangToggle } from './lang-toggle'
import type { Hints } from './status-cluster'

function MobileLink({
  href,
  label,
  onClick,
}: {
  href: string
  label: string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className='text-ink hover:bg-secondary rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-200'
    >
      {label}
    </Link>
  )
}

export function MobileMenu({
  loggedIn,
  hints,
  onClose,
}: {
  loggedIn: boolean
  hints: Hints
  onClose: () => void
}) {
  const t = useT(copy)
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className='border-border overflow-hidden border-t md:hidden'
    >
      <nav className='flex flex-col gap-1 p-4'>
        <div className='mb-2 grid grid-cols-2 gap-2'>
          {(
            [
              {
                href: loggedIn ? '/challenge' : '/onboarding',
                icon: Code2,
                title: t.trackCode,
                question: t.trackCodeQ,
              },
              {
                href: loggedIn ? '/design' : '/onboarding',
                icon: Network,
                title: t.trackDesign,
                question: t.trackDesignQ,
              },
            ] as const
          ).map((track) => (
            <Link
              key={track.title}
              href={track.href}
              onClick={onClose}
              className='border-border hover:bg-secondary flex flex-col gap-1.5 rounded-xl border p-3 transition-colors duration-200'
            >
              <span className='text-ink flex items-center gap-2 text-sm font-medium'>
                <track.icon className='text-primary size-4' strokeWidth={1.5} />
                {track.title}
              </span>
              <span className='text-primary font-serif text-[12px] italic'>
                {track.question}
              </span>
            </Link>
          ))}
        </div>
        <MobileLink href='/challenges' label={t.library} onClick={onClose} />
        <MobileLink href='/#metodo' label={t.how} onClick={onClose} />
        {loggedIn && (
          <>
            <MobileLink href='/ranking' label={t.ranking} onClick={onClose} />
            <MobileLink
              href='/solutions'
              label={t.solutionsTitle}
              onClick={onClose}
            />
          </>
        )}
        {loggedIn ? (
          <MobileLink href='/dashboard' label={t.dashboard} onClick={onClose} />
        ) : (
          <MobileLink href='/login' label={t.signIn} onClick={onClose} />
        )}
        <div className='border-border mt-3 flex items-center justify-between gap-3 border-t pt-4'>
          <LangToggle />
          {loggedIn && hints.remaining !== null && (
            <div className='flex items-center gap-3'>
              <span
                title={t.hintsAvailable}
                className='flex items-center gap-1.5'
              >
                <Lightbulb className='text-primary size-4' strokeWidth={1.5} />
                <span
                  className={cn(
                    'font-mono text-[12px]',
                    hints.remaining <= 0
                      ? 'text-destructive'
                      : 'text-muted-foreground',
                  )}
                >
                  {hints.remaining}
                </span>
              </span>
              <button
                type='button'
                onClick={hints.buy}
                disabled={hints.buying}
                className='border-border text-primary hover:bg-primary/10 grid h-10 cursor-pointer place-items-center rounded-full border px-4 font-mono text-[11px] uppercase transition-colors duration-200 disabled:opacity-50'
              >
                {t.buyHints}
              </button>
            </div>
          )}
        </div>
      </nav>
    </motion.div>
  )
}
