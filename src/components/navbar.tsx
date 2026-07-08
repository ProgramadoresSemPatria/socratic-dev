'use client'

import { useUser } from '@/features/auth/hooks/use-user'
import {
  getDailyChallenge,
  type DailyChallenge,
} from '@/features/challenges/actions'
import { getStreak } from '@/features/dashboard/actions'
import { getHintBalance } from '@/features/hints/actions'
import { HINT_PACK } from '@/features/hints/constants'
import { getMyRank } from '@/features/ranking/actions'
import { useLocale, useT } from '@/lib/i18n'
import { apiFetch, getAccessToken } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  Code2,
  Flame,
  Lightbulb,
  Menu,
  Network,
  Plus,
  Trophy,
  X,
} from 'lucide-react'
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
    buyHints: `Buy +${HINT_PACK.hints} hints`,
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    hints: 'Hints',
    ranking: 'Ranking',
    yourRank: 'Your position in the ranking',
    train: 'Practice',
    trackCode: 'Code',
    trackCodeDesc: 'A real editor, hidden tests',
    trackCodeQ: 'Can you make the tests pass?',
    trackDesign: 'System Design',
    trackDesignDesc: 'Architecture on canvas, reviewed by vision',
    trackDesignQ: 'Will it survive a million users?',
    resume: 'Pick up where you left off',
    explore: 'Browse the library',
    daily: 'Daily challenge',
    streakTitle: 'day streak — every 7th day pays bonus hints',
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
    buyHints: `Comprar +${HINT_PACK.hints} hints`,
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    hints: 'Hints',
    ranking: 'Ranking',
    yourRank: 'Sua posição no ranking',
    train: 'Treinar',
    trackCode: 'Código',
    trackCodeDesc: 'Editor de verdade, testes escondidos',
    trackCodeQ: 'Consegue fazer os testes passarem?',
    trackDesign: 'System Design',
    trackDesignDesc: 'Arquitetura em canvas, avaliada por visão',
    trackDesignQ: 'Aguenta um milhão de usuários?',
    resume: 'Continue de onde parou',
    explore: 'Explore a biblioteca',
    daily: 'Desafio do dia',
    streakTitle: 'dias seguidos — a cada 7 dias você ganha hints bônus',
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
      const res = await apiFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string }
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      refresh()
    } finally {
      setBuying(false)
    }
  }, [buying, refresh])

  return { remaining, buying, buy }
}

type Hints = ReturnType<typeof useHints>

function useRank(enabled: boolean) {
  const [position, setPosition] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getAccessToken()
      .then((tk) => getMyRank(tk))
      .then((r) => {
        if (!cancelled && r) setPosition(r.position)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled])

  return position
}

function useStreak(enabled: boolean) {
  const [streak, setStreak] = React.useState<number>(0)

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false
    getAccessToken()
      .then((tk) => getStreak(tk))
      .then((s) => {
        if (!cancelled) setStreak(s)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled])

  return streak
}

function StatusCluster({
  position,
  hints,
  streak,
}: {
  position: number | null
  hints: Hints
  streak: number
}) {
  const t = useT(copy)
  if (position === null && hints.remaining === null && streak <= 0) return null
  return (
    <div className='border-border bg-background hidden h-9 items-stretch overflow-hidden rounded-full border sm:inline-flex'>
      {streak > 0 && (
        <span
          title={`${streak} ${t.streakTitle}`}
          className='text-muted-foreground flex items-center gap-1 pr-2.5 pl-3'
        >
          <Flame className='size-3.5 text-orange-500' strokeWidth={1.5} />
          <span className='font-mono text-[12px] tabular-nums'>{streak}</span>
        </span>
      )}
      {streak > 0 && (position !== null || hints.remaining !== null) && (
        <span aria-hidden className='bg-border my-2 w-px' />
      )}
      {position !== null && (
        <Link
          href='/ranking'
          title={t.yourRank}
          className='text-muted-foreground hover:text-ink hover:bg-secondary flex items-center gap-1.5 pr-2.5 pl-3 transition-colors duration-200'
        >
          <Trophy className='text-primary size-3.5' strokeWidth={1.5} />
          <span className='font-mono text-[12px] tabular-nums'>
            #{position}
          </span>
        </Link>
      )}
      {position !== null && hints.remaining !== null && (
        <span aria-hidden className='bg-border my-2 w-px' />
      )}
      {hints.remaining !== null && (
        <div className='flex items-center gap-1.5 pr-1 pl-2.5'>
          <Lightbulb className='text-primary size-3.5' strokeWidth={1.5} />
          <span
            title={t.hintsAvailable}
            className={cn(
              'font-mono text-[12px] tabular-nums',
              hints.remaining <= 0
                ? 'text-destructive'
                : 'text-muted-foreground',
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
            className='text-primary hover:bg-primary/10 relative grid size-6 cursor-pointer place-items-center rounded-full transition-colors duration-200 before:absolute before:-inset-2 before:content-[""] disabled:opacity-50'
          >
            <Plus className='size-3.5' strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  )
}

function TrainMenu({ loggedIn }: { loggedIn: boolean }) {
  const t = useT(copy)
  const [open, setOpen] = React.useState(false)
  const [daily, setDaily] = React.useState<DailyChallenge | null>(null)
  const dailyFetched = React.useRef(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const closeTimer = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!open || dailyFetched.current) return
    dailyFetched.current = true
    getDailyChallenge()
      .then((d) => setDaily(d))
      .catch(() => {})
  }, [open])

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])
  const hoverOpen = React.useCallback(() => {
    cancelClose()
    setOpen(true)
  }, [cancelClose])
  const hoverClose = React.useCallback(() => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setOpen(false), 140)
  }, [cancelClose])

  React.useEffect(() => cancelClose, [cancelClose])

  React.useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const tracks = [
    {
      href: loggedIn ? '/challenge' : '/onboarding',
      icon: Code2,
      title: t.trackCode,
      desc: t.trackCodeDesc,
      question: t.trackCodeQ,
    },
    {
      href: loggedIn ? '/design' : '/onboarding',
      icon: Network,
      title: t.trackDesign,
      desc: t.trackDesignDesc,
      question: t.trackDesignQ,
    },
  ]

  return (
    <div
      ref={ref}
      className='relative hidden md:block'
      onMouseEnter={hoverOpen}
      onMouseLeave={hoverClose}
    >
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'flex cursor-pointer items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200',
          open ? 'text-ink' : 'text-muted-foreground hover:text-ink',
        )}
      >
        {t.train}
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
          strokeWidth={1.5}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className='border-border bg-background absolute top-full left-0 mt-2 w-[340px] overflow-hidden rounded-2xl border shadow-xl'
          >
            <div className='p-2'>
              {tracks.map((track) => (
                <Link
                  key={track.title}
                  href={track.href}
                  onClick={() => setOpen(false)}
                  className='group/track hover:bg-secondary flex gap-3 rounded-xl p-3 transition-colors duration-200'
                >
                  <span className='border-border bg-background text-ink group-hover/track:border-primary/40 group-hover/track:text-primary mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border transition-colors duration-200'>
                    <track.icon className='size-4' strokeWidth={1.5} />
                  </span>
                  <span className='flex flex-col gap-0.5'>
                    <span className='text-ink text-sm font-medium'>
                      {track.title}
                    </span>
                    <span className='text-muted-foreground text-[13px]'>
                      {track.desc}
                    </span>
                    <span className='text-primary font-serif text-[13px] italic'>
                      {track.question}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            {daily && (
              <Link
                href={
                  loggedIn
                    ? `${daily.kind === 'design' ? '/design' : '/challenge'}?id=${daily.id}`
                    : '/onboarding'
                }
                onClick={() => setOpen(false)}
                className='border-border hover:bg-secondary flex items-center gap-2 border-t px-5 py-3 transition-colors duration-200'
              >
                <Flame className='size-3.5 shrink-0 text-orange-500' strokeWidth={1.5} />
                <span className='text-primary font-mono text-[11px] uppercase'>
                  {t.daily}
                </span>
                <span className='text-ink truncate text-[13px] font-medium'>
                  {daily.title}
                </span>
              </Link>
            )}
            <Link
              href={loggedIn ? '/dashboard' : '/challenges'}
              onClick={() => setOpen(false)}
              className='border-border text-muted-foreground hover:text-ink hover:bg-secondary block border-t px-5 py-3 text-[13px] font-medium transition-colors duration-200'
            >
              {loggedIn ? t.resume : t.explore} →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
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
          <MobileLink href='/ranking' label={t.ranking} onClick={onClose} />
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

export function Navbar() {
  const t = useT(copy)
  const [scrolled, setScrolled] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const headerRef = React.useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  const { user, loading } = useUser()
  const hints = useHints(!loading && !!user)
  const rank = useRank(!loading && !!user)
  const streak = useStreak(!loading && !!user)

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
      className='fixed inset-x-0 top-0 z-50'
    >
      <div
        className={cn(
          'container-main transition-[padding] duration-300',
          (scrolled || menuOpen) && 'pt-3',
        )}
      >
        <div
          className={cn(
            'rounded-2xl border transition-all duration-300',
            scrolled || menuOpen
              ? 'border-border bg-background/90 shadow-[0_8px_30px_rgba(27,25,22,0.08)] backdrop-blur'
              : 'border-transparent bg-transparent',
          )}
        >
          <div
            className={cn(
              'flex items-center justify-between transition-[height,padding] duration-300',
              scrolled || menuOpen ? 'h-[60px] px-4' : 'h-[72px] px-0',
            )}
          >
        <div className='flex items-center gap-5'>
          <Logo size='lg' />
          <span
            aria-hidden
            className='bg-border hidden h-5 w-px md:block'
          />
          <nav className='hidden items-center gap-1 md:flex'>
            <TrainMenu loggedIn={!loading && !!user} />
            <NavLink href='/challenges' label={t.library} />
            {!loading && user ? (
              <NavLink href='/ranking' label={t.ranking} />
            ) : (
              <NavLink href='/#metodo' label={t.how} />
            )}
          </nav>
        </div>

        <div className='flex items-center gap-2'>
          <LangToggle className='hidden sm:flex' />
          {!loading && user ? (
            <>
              <NavLink href='/dashboard' label={t.dashboard} />
              <StatusCluster position={rank} hints={hints} streak={streak} />
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
        </div>
      </div>
    </motion.header>
  )
}
