'use client'

import { useUser } from '@/lib/auth/use-user'
import { cn } from '@/lib/utils'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import Link from 'next/link'
import * as React from 'react'
import { Logo } from './logo'

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
                href='/dashboard'
                className='hidden rounded-md px-3 py-2 text-sm font-medium text-[#6b6478] transition-colors hover:text-[#1b1916] sm:inline-flex'
              >
                Dashboard
              </Link>
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
