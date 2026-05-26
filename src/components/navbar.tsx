'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import Link from 'next/link'
import * as React from 'react'
import { Logo } from './logo'

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (v) => {
    setScrolled(v > 24)
  })

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled ? 'py-2' : 'py-4',
      )}
    >
      <div className='mx-auto max-w-6xl px-4'>
        <div
          className={cn(
            'flex items-center justify-between rounded-2xl px-4 transition-all duration-500 sm:px-5',
            scrolled
              ? 'glass-strong h-12 shadow-lg shadow-black/20'
              : 'h-14 bg-transparent',
          )}
        >
          <Logo />

          <nav className='hidden items-center gap-1 text-sm text-muted-foreground md:flex'>
            <Link
              href='#problema'
              className='rounded-md px-3 py-1.5 transition-colors hover:text-foreground'
            >
              Problema
            </Link>
            <Link
              href='#metodo'
              className='rounded-md px-3 py-1.5 transition-colors hover:text-foreground'
            >
              Método
            </Link>
            <Link
              href='#exemplo'
              className='rounded-md px-3 py-1.5 transition-colors hover:text-foreground'
            >
              Demo
            </Link>
            <Link
              href='#precos'
              className='rounded-md px-3 py-1.5 transition-colors hover:text-foreground'
            >
              Manifesto
            </Link>
          </nav>

          <div className='flex items-center gap-2'>
            <Link
              href='/dashboard'
              className='hidden px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex'
            >
              Entrar
            </Link>
            <Button
              size='sm'
              className='h-8 gap-1.5 rounded-full border-transparent bg-foreground pr-2.5 pl-3 text-[13px] text-background hover:bg-foreground/90 sm:h-9'
              render={<Link href='/onboarding' />}
            >
              <Sparkles className='size-3.5' />
              Começar
              <ArrowRight className='size-3.5 transition-transform group-hover:translate-x-0.5' />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
