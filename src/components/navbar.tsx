'use client'

import { useUser } from '@/features/auth/hooks/use-user'
import { buyHints, getHintBalance } from '@/features/hints/actions'
import { cn } from '@/lib/utils'
import { Lightbulb, Plus } from 'lucide-react'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import Link from 'next/link'
import * as React from 'react'
import { Logo } from './logo'

function HintsChip({ userId }: { userId: string }) {
  const [remaining, setRemaining] = React.useState<number | null>(null)
  const [buying, setBuying] = React.useState(false)

  const refresh = React.useCallback(() => {
    getHintBalance(userId)
      .then((b) => setRemaining(b.remaining))
      .catch(() => {})
  }, [userId])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  async function buy() {
    if (buying) return
    setBuying(true)
    try {
      await buyHints(userId)
      refresh()
    } finally {
      setBuying(false)
    }
  }

  if (remaining === null) return null
  return (
    <div className='hidden h-9 items-center gap-1.5 rounded-full border border-[#DFE5E9] bg-white py-0 pr-1 pl-3 sm:inline-flex'>
      <Lightbulb className='size-3.5 text-iris' />
      <span
        title='Hints disponíveis'
        className={cn(
          'font-mono text-[12px]',
          remaining <= 0 ? 'text-red-500' : 'text-[#6b6478]',
        )}
      >
        {remaining}
      </span>
      <button
        type='button'
        onClick={buy}
        disabled={buying}
        title='Comprar +10 hints'
        className='ml-0.5 grid size-6 cursor-pointer place-items-center rounded-full text-iris transition-colors hover:bg-iris/10 disabled:opacity-50'
      >
        <Plus className='size-3.5' />
      </button>
    </div>
  )
}

const links = [
  { href: '#problema', label: 'Problema' },
  { href: '#metodo', label: 'Método' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#manifesto', label: 'Manifesto' },
]

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const { scrollY } = useScroll()
  const { user, loading } = useUser()

  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 12)
  })

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled ? 'bg-white/95 backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <div className='container-main flex h-[72px] items-center justify-between'>
        <Logo size='lg' />

        <nav className='hidden items-center gap-1 md:flex'>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className='rounded-md px-3 py-2 text-sm font-medium text-[#6b6478] transition-colors hover:text-[#1b1916]'
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className='flex items-center gap-2'>
          {!loading && user ? (
            <>
              <Link
                href='/challenges'
                className='hidden rounded-md px-3 py-2 text-sm font-medium text-[#6b6478] transition-colors hover:text-[#1b1916] sm:inline-flex'
              >
                Biblioteca
              </Link>
              <Link
                href='/dashboard'
                className='hidden rounded-md px-3 py-2 text-sm font-medium text-[#6b6478] transition-colors hover:text-[#1b1916] sm:inline-flex'
              >
                Dashboard
              </Link>
              <HintsChip userId={user.id} />
              <Link
                href='/profile'
                aria-label='Seu perfil'
                title={user.email ?? 'Seu perfil'}
                className='grid size-9 place-items-center rounded-full bg-primary font-mono text-[13px] font-semibold text-primary-foreground uppercase ring-1 ring-primary/20 transition-transform hover:scale-105'
              >
                {(user.email?.[0] ?? 'u').toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link
                href='/login'
                className='hidden rounded-md px-3 py-2 text-sm font-medium text-[#6b6478] transition-colors hover:text-[#1b1916] sm:inline-flex'
              >
                Entrar
              </Link>
              <Link
                href='/onboarding'
                className='inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium tracking-tight text-primary-foreground transition-colors hover:bg-primary/90'
              >
                Começar agora
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
