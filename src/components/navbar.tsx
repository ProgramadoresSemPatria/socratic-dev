'use client'

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
        scrolled
          ? 'border-b border-[#DFE5E9] bg-white/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className='container-main flex h-16 items-center justify-between'>
        <Logo />

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

        <div className='flex items-center gap-1.5'>
          <Link
            href='/dashboard'
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
        </div>
      </div>
    </motion.header>
  )
}
