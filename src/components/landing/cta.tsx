'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

export function CTA() {
  return (
    <section className='relative py-24 sm:py-32'>
      <div className='mx-auto max-w-5xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className='noise relative overflow-hidden rounded-[2rem] border border-white/[0.08]'
        >
          {/* gradient bg */}
          <div className='absolute inset-0 -z-10'>
            <div
              className='absolute inset-0'
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.18 0.05 285) 0%, oklch(0.12 0.012 280) 60%, oklch(0.15 0.05 165) 100%)',
              }}
            />
            <div className='grid-pattern absolute inset-0 opacity-50' />
            <div
              className='absolute -top-32 left-1/4 size-[400px] rounded-full opacity-50 blur-3xl'
              style={{
                background:
                  'radial-gradient(circle, oklch(0.68 0.22 285 / 0.7), transparent 60%)',
              }}
            />
            <div
              className='absolute right-1/4 -bottom-32 size-[400px] rounded-full opacity-40 blur-3xl'
              style={{
                background:
                  'radial-gradient(circle, oklch(0.78 0.17 165 / 0.6), transparent 60%)',
              }}
            />
          </div>

          <div className='px-6 py-16 text-center sm:px-16 sm:py-24'>
            <h2 className='font-heading text-4xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl'>
              Programe como se{' '}
              <span className='text-gradient font-serif font-normal italic'>
                a IA não existisse
              </span>
              .
              <br />
              Aprenda como se ela{' '}
              <span className='text-gradient font-serif font-normal italic'>
                fosse seu mentor
              </span>
              .
            </h2>
            <p className='mx-auto mt-6 max-w-xl text-lg text-muted-foreground'>
              Comece um desafio em 30 segundos. Sem cartão, sem onboarding
              chato.
            </p>

            <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Button
                size='xl'
                className='glow-iris group h-12 rounded-full border-transparent bg-foreground pr-4 pl-5 text-[15px] text-background hover:bg-foreground/90'
                render={<Link href='/onboarding' />}
              >
                <Sparkles className='size-4' />
                Quero ser desafiado
                <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
              </Button>
              <Button
                size='xl'
                variant='ghost'
                className='h-12 rounded-full px-5 text-[15px]'
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
