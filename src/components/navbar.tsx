'use client'

import { useUser } from '@/features/auth/hooks/use-user'
import { buyHints, getHintBalance } from '@/features/hints/actions'
import { useLocale, useT } from '@/lib/i18n'
import { getAccessToken } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Lightbulb, Menu, Plus, X } from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { Logo } from './logo'
import { Button } from './ui/button'

const copy = {
  en: {
    library: 'Library',
    how: 'How it works',
    dashboard: 'Dashboard',
    signIn: 'Sign in',
    cta: 'Start a challenge',
    profile: 'Your profile',
    avatar: 'Your avatar',
    hintsAvailable: 'Available hints: 35 free per week, resets Sunday 23:59',
    buyHints: 'Buy +10 hints',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    hints: 'Hints',
  },
  pt: {
    library: 'Biblioteca',
    how: 'Como funciona',
    dashboard: 'Dashboard',
    signIn: 'Entrar',
    cta: 'Comece um desafio',
    profile: 'Seu perfil',
    avatar: 'Seu avatar',
    hintsAvailable: 'Hints disponíveis: 35 grátis por semana, reseta domingo 23:59',
    buyHints: 'Comprar +10 hints',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    hints: 'Hints',
  },
} as const

function useHints(enabled: boolean) {
  const [remaining, setRemaining] = React.useState<number | null>(null)
  const [buying, setBuying] = React.useState(false)

  const refresh = React.useCallback(() => {
    if (!enabled) return
    getAccessToken()
      .then((tk) => getHintBalance(tk))
      .then((b) => setRemaining(b.remaining))
      .catch(() => {})
  }, [enabled])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const buy = React.useCallback(async () => {
    if (buying) return
    setBuying(true)
    try {
      await buyHints(await getAccessToken())
      refresh()
    } finally {
      setBuying(false)
    }
  }, [buying, refresh])

  return { remaining, buying, buy }
}

type Hints = ReturnType<typeof useHints>

function HintsChip({ hints }: { hints: Hints }) {
  const t = useT(copy)
  if (hints.remaining === null) return null
  return (
    <div className='border-border bg-background hidden h-9 items-center gap-1.5 rounded-full border py-0 pr-1 pl-3 sm:inline-flex'>
      <Lightbulb className='text-primary size-3.5' strokeWidth={1.5} />
      <span
        title={t.hintsAvailable}
        className={cn(
          'font-mono text-[12px]',
          hints.remaining <= 0 ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {hints.remaining}
      </span>
      <button
        type='button'
        onClick={hints.buy}
        disabled={hints.buying}
        title={t.buyHints}
        aria-label={t.buyHints}
        className='text-primary hover:bg-primary/10 relative ml-0.5 grid size-6 cursor-pointer place-items-center rounded-full transition-colors duration-200 before:absolute before:-inset-2 before:content-[""] disabled:opacity-50'
      >
        <Plus className='size-3.5' strokeWidth={1.5} />
      </button>
    </div>
  )
}

function LangToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  return (
    <div
      className={cn(
        'border-border bg-background flex h-9 items-center rounded-full border p-1 font-mono text-[11px]',
        className,
      )}
    >
      {(['en', 'pt'] as const).map((l) => (
        <button
          key={l}
          type='button'
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            'cursor-pointer rounded-full px-2.5 py-1 uppercase transition-colors duration-200',
            locale === l
              ? 'bg-ink text-background'
              : 'text-muted-foreground hover:text-ink',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className='text-muted-foreground hover:text-ink hidden px-3 py-2 text-sm font-medium transition-colors duration-200 md:inline-flex'
    >
      <span className='link-underline'>{label}</span>
    </Link>
  )
}

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

function MobileMenu({
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
      className='border-border bg-background absolute inset-x-0 top-full border-b md:hidden'
    >
      <nav className='container-main flex flex-col gap-1 py-4'>
        <MobileLink href='/challenges' label={t.library} onClick={onClose} />
        <MobileLink href='/#metodo' label={t.how} onClick={onClose} />
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

export function Navbar() {
  const t = useT(copy)
  const [scrolled, setScrolled] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const headerRef = React.useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  const { user, loading } = useUser()
  const hints = useHints(!loading && !!user)

  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 12)
  })

  React.useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  const closeMenu = React.useCallback(() => setMenuOpen(false), [])

  return (
    <motion.header
      ref={headerRef}
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
        scrolled || menuOpen
          ? 'border-border bg-background/90 backdrop-blur'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className='container-main flex h-[72px] items-center justify-between'>
        <div className='flex items-center gap-6'>
          <Logo size='lg' />
          <nav className='hidden items-center gap-1 md:flex'>
            <NavLink href='/challenges' label={t.library} />
            <NavLink href='/#metodo' label={t.how} />
          </nav>
        </div>

        <div className='flex items-center gap-2'>
          <LangToggle className='hidden sm:flex' />
          {!loading && user ? (
            <>
              <NavLink href='/dashboard' label={t.dashboard} />
              <HintsChip hints={hints} />
              <Link
                href='/profile'
                aria-label={t.profile}
                title={user.email ?? t.profile}
                className='border-border grid size-9 shrink-0 overflow-hidden rounded-full border transition-transform duration-200 hover:scale-105'
              >
                {(user.user_metadata as { avatar_url?: string } | undefined)
                  ?.avatar_url ? (
                  <Image
                    src={
                      (
                        user.user_metadata as { avatar_url?: string }
                      ).avatar_url!
                    }
                    alt={t.avatar}
                    width={36}
                    height={36}
                    className='size-full object-cover'
                  />
                ) : (
                  <span className='bg-primary text-primary-foreground grid size-full place-items-center font-mono text-[13px] font-semibold uppercase'>
                    {(user.email?.[0] ?? 'u').toUpperCase()}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link
                href='/login'
                className='text-muted-foreground hover:text-ink hidden px-3 py-2 text-sm font-medium transition-colors duration-200 sm:inline-flex'
              >
                <span className='link-underline'>{t.signIn}</span>
              </Link>
              <Button variant='ink' render={<Link href='/onboarding' />}>
                {t.cta}
              </Button>
            </>
          )}
          <button
            type='button'
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t.closeMenu : t.openMenu}
            className='text-ink hover:bg-secondary grid size-10 shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-200 md:hidden'
          >
            {menuOpen ? (
              <X className='size-5' strokeWidth={1.5} />
            ) : (
              <Menu className='size-5' strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <MobileMenu
            loggedIn={!loading && !!user}
            hints={hints}
            onClose={closeMenu}
          />
        )}
      </AnimatePresence>
    </motion.header>
  )
}
