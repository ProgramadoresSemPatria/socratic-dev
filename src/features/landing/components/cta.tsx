'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

export function CTA() {
  return (
    <section className='py-20 sm:py-28'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className='relative overflow-hidden rounded-[2rem] bg-[oklch(0.16_0.03_285)] px-6 py-16 text-center shadow-2xl shadow-primary/15 sm:px-16 sm:py-24'
        >
          {/* glow accents */}
          <div className='grid-pattern absolute inset-0 opacity-[0.12] mix-blend-overlay' />
          <div
            className='absolute -top-28 left-1/4 size-[420px] rounded-full opacity-50 blur-3xl'
            style={{
              background:
                'radial-gradient(circle, oklch(0.55 0.24 285 / 0.7), transparent 60%)',
            }}
          />
          <div
            className='absolute right-1/4 -bottom-28 size-[420px] rounded-full opacity-40 blur-3xl'
            style={{
              background:
                'radial-gradient(circle, oklch(0.7 0.14 165 / 0.5), transparent 60%)',
            }}
          />

          <div className='relative'>
            <h2 className='mx-auto max-w-2xl font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-white sm:text-5xl'>
              Programe como se a IA não existisse. Aprenda como se ela fosse seu
              mentor.
            </h2>
            <p className='mx-auto mt-6 max-w-xl text-lg text-white/70'>
              Comece um desafio em 30 segundos. Sem cartão, sem onboarding chato.
            </p>

            <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Button
                size='xl'
                className='group h-12 rounded-full border-transparent bg-white pr-5 pl-6 text-[15px] font-medium text-black hover:bg-white/90'
                render={<Link href='/onboarding' />}
              >
                Quero ser desafiado
                <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
              </Button>
              <Button
                size='xl'
                variant='ghost'
                className='h-12 rounded-full border border-white/20 px-5 text-[15px] font-medium text-white hover:bg-white/10'
                render={<Link href='/dashboard' />}
              >
                Ver dashboard de demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
