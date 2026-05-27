'use client'

import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { HeroScene } from './hero-scene'

export function Hero() {
  return (
    <section className='p-3 md:p-6'>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className='relative flex min-h-[400px] items-center overflow-hidden rounded-xl lg:min-h-[587px]'
      >
        <div
          className='absolute inset-0'
          style={{
            background:
              'linear-gradient(146.18deg, rgba(252, 243, 235, 0.6) 12.07%, rgba(223, 229, 233, 0.6) 45.37%, rgba(220, 215, 253, 0.6) 97.58%), white',
          }}
        />
        <HeroScene className='absolute inset-0 mix-blend-multiply' />
        <div className='grid-pattern absolute inset-0 opacity-30' />

        <div className='relative z-10 px-6 py-10 sm:px-10 lg:px-16 lg:py-16'>
          <h1 className='type-display mb-6 max-w-[900px] lg:mb-8'>
            A IA que nunca te dá a resposta — ela te faz chegar lá.
          </h1>
          <p className='mb-8 max-w-[644px] text-base text-[#2c2330] lg:mb-10 lg:text-[20px]'>
            Um ambiente de código onde a IA age como um tech lead exigente: faz
            perguntas, dá hints graduais e força você a raciocinar de verdade.
          </p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Link
              href='/onboarding'
              className='group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-medium tracking-tight text-primary-foreground transition-colors duration-300 hover:bg-primary/90'
            >
              Comece um desafio
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
            </Link>
            <Link
              href='#exemplo'
              className='inline-flex items-center justify-center rounded-xl border border-[#1b1916]/20 px-6 py-3.5 text-base font-medium tracking-tight text-[#1b1916] transition-colors duration-300 hover:bg-[#1b1916]/5'
            >
              Falar com o tutor
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
