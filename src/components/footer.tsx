'use client'

import { useLocale, useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const copy = {
  en: {
    statementPre: 'The AI that makes you ',
    statementWord: 'think',
    statementPost: '.',
    sub: 'Challenges with a tutor that never hands you the answer.',
    cta: 'Start a challenge',
    product: 'Product',
    learn: 'Learn',
    productLinks: [
      { href: '/onboarding', label: 'Start a challenge' },
      { href: '/challenges', label: 'Library' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
    learnLinks: [
      { href: '/#metodo', label: 'How it works' },
      { href: '/#problema', label: 'The problem' },
      { href: '/#manifesto', label: 'The manifesto' },
    ],
  },
  pt: {
    statementPre: 'A IA que te faz ',
    statementWord: 'pensar',
    statementPost: '.',
    sub: 'Desafios com um tutor que nunca entrega a resposta.',
    cta: 'Comece um desafio',
    product: 'Produto',
    learn: 'Aprenda',
    productLinks: [
      { href: '/onboarding', label: 'Comece um desafio' },
      { href: '/challenges', label: 'Biblioteca' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
    learnLinks: [
      { href: '/#metodo', label: 'Como funciona' },
      { href: '/#problema', label: 'O problema' },
      { href: '/#manifesto', label: 'O manifesto' },
    ],
  },
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className='text-background/60 dark:text-foreground/60 hover:text-lime text-sm transition-colors duration-200'
    >
      <span className='link-underline'>{label}</span>
    </Link>
  )
}

export function Footer() {
  const t = useT(copy)
  const { locale, setLocale } = useLocale()

  return (
    <footer className='bg-ink dark:bg-card dark:border-border mt-16 overflow-hidden dark:border-t'>
      <div className='container-main grid gap-12 pt-16 pb-10 lg:grid-cols-[1fr_auto] lg:gap-24'>
        <div className='max-w-md'>
          <p className='font-heading text-xl tracking-tight'>
            <span className='text-background dark:text-foreground'>
              socratic
            </span>
            <span className='text-lime font-serif italic'>.dev</span>
          </p>
          <p className='font-heading text-background dark:text-foreground mt-6 text-[26px] leading-[1.15] font-light tracking-[-0.6px] sm:text-[30px]'>
            {t.statementPre}
            <span className='text-lime font-serif italic'>
              {t.statementWord}
            </span>
            {t.statementPost}
          </p>
          <p className='text-background/50 dark:text-foreground/50 mt-3 text-sm'>
            {t.sub}
          </p>
          <Link
            href='/onboarding'
            className='bg-lime text-ink dark:text-background hover:bg-lime-light group mt-7 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300'
          >
            {t.cta}
            <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
          </Link>
        </div>

        <nav className='grid grid-cols-2 gap-12 sm:gap-20'>
          <div className='space-y-4'>
            <p className='text-background/40 dark:text-foreground/40 font-mono text-[11px] font-medium tracking-[0.14em] uppercase'>
              {t.product}
            </p>
            <ul className='space-y-3'>
              {t.productLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href} label={l.label} />
                </li>
              ))}
            </ul>
          </div>
          <div className='space-y-4'>
            <p className='text-background/40 dark:text-foreground/40 font-mono text-[11px] font-medium tracking-[0.14em] uppercase'>
              {t.learn}
            </p>
            <ul className='space-y-3'>
              {t.learnLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href} label={l.label} />
                </li>
              ))}
              <li>
                <a
                  href='https://github.com/ProgramadoresSemPatria/HB01-2026_socratic-dev'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-background/60 dark:text-foreground/60 hover:text-lime inline-flex items-center gap-1 text-sm transition-colors duration-200'
                >
                  <span className='link-underline'>GitHub</span>
                  <ArrowUpRight className='size-3.5' strokeWidth={1.5} />
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div
        aria-hidden
        className='container-main pointer-events-none -mb-[0.16em] select-none'
      >
        <p className='text-center text-[13.5vw] leading-[0.85] whitespace-nowrap'>
          <span className='font-heading font-light tracking-[-0.05em] text-white/[0.07]'>
            socratic
          </span>
          <span className='text-lime/20 font-serif italic'>.dev</span>
        </p>
      </div>

      <div className='border-t border-white/10'>
        <div className='container-main flex flex-col items-center gap-3 py-5 sm:flex-row sm:justify-between'>
          <span className='text-background/40 dark:text-foreground/40 text-[13px]'>
            © 2026 Socratic.dev
          </span>
          <div className='flex items-center gap-5'>
            <div className='flex gap-1'>
              {(['en', 'pt'] as const).map((l) => (
                <button
                  key={l}
                  type='button'
                  onClick={() => setLocale(l)}
                  aria-pressed={locale === l}
                  className={cn(
                    'cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10px] uppercase transition-colors duration-200',
                    locale === l
                      ? 'bg-lime text-ink dark:text-background'
                      : 'text-background/40 dark:text-foreground/40 hover:text-lime',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <span className='text-background/40 dark:text-foreground/40 font-mono text-[11px] tracking-[0.1em] uppercase'>
              A product from Borderless Coding Labs
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
