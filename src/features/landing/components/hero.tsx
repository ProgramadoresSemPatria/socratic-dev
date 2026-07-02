'use client'

import { useT } from '@/lib/i18n'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Halftone } from './halftone'

const copy = {
  en: {
    eyebrow: 'Code + system design',
    title: 'The AI that never hands you the answer — it makes you find it.',
    sub: 'Solve code challenges in a real editor or sketch architectures on a canvas. The AI acts like a demanding tech lead: it asks questions, gives gradual hints, and makes you actually reason.',
    primary: 'Start a challenge',
    secondary: 'Browse the library',
  },
  pt: {
    eyebrow: 'Código + system design',
    title: 'A IA que nunca te dá a resposta — ela te faz chegar lá.',
    sub: 'Resolva desafios de código no editor ou desenhe arquiteturas de system design no canvas. A IA age como um tech lead exigente: faz perguntas, dá hints graduais e te força a raciocinar de verdade.',
    primary: 'Comece um desafio',
    secondary: 'Explorar a biblioteca',
  },
} as const

function paintAmbient(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const blob = (
    x: number,
    y: number,
    r: number,
    a: number,
  ) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(0,0,0,${a})`)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  blob(w * 0.9, h * 0.85, w * 0.42, 0.95)
  blob(w * 0.06, h * 0.9, w * 0.32, 0.7)
  blob(w * 0.95, h * 0.08, w * 0.22, 0.5)
  blob(w * 0.03, h * 0.12, w * 0.16, 0.35)
}

export function Hero() {
  const t = useT(copy)

  return (
    <section className='p-3 md:p-6'>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className='from-pastel-greige via-pastel-mist/70 to-pastel-lavender/60 relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br lg:min-h-[460px]'
      >
        <div className='pointer-events-none absolute inset-0 opacity-45 mix-blend-multiply'>
          <Halftone
            draw={paintAmbient}
            active
            interactive
            spacing={10}
            flow={18}
            className='absolute inset-0'
          />
        </div>

        <div className='relative z-10 mx-auto max-w-[1000px] px-6 py-12 text-center sm:px-10 lg:px-16 lg:py-16'>
          <p className='eyebrow mb-5'>{t.eyebrow}</p>
          <h1 className='font-heading text-ink mx-auto mb-5 max-w-[860px] text-[38px] leading-[1.04] font-light tracking-[-0.04em] sm:text-[56px] lg:mb-7 lg:text-[72px] lg:leading-[1.02]'>
            {t.title}
          </h1>
          <p className='type-body mx-auto mb-8 max-w-[644px] lg:mb-10'>
            {t.sub}
          </p>
          <div className='flex flex-col justify-center gap-3 sm:flex-row'>
            <Link
              href='/onboarding'
              className='bg-ink hover:bg-primary group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-medium tracking-tight text-white transition-colors duration-300'
            >
              {t.primary}
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
            </Link>
            <Link
              href='/challenges'
              className='bg-lime text-ink hover:bg-lime-dark inline-flex items-center justify-center rounded-full px-5 py-2.5 text-base font-medium tracking-tight transition-colors duration-300 hover:text-white'
            >
              {t.secondary}
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
