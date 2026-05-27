'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from './reveal'

export function FinalCta() {
  return (
    <section className='p-3 md:p-6'>
      <Reveal>
        <div
          className='relative flex min-h-[400px] items-center justify-center overflow-hidden rounded-xl px-6 py-16 text-center sm:px-10 lg:min-h-[587px] lg:py-24'
          style={{
            background:
              'linear-gradient(192.6deg, rgba(254, 247, 240, 0.6) 0%, rgba(223, 229, 233, 0.6) 50%, rgba(110, 86, 207, 0.6) 100%), white',
          }}
        >
          <div className='grid-pattern absolute inset-0 opacity-30' />
          <div className='relative z-10 mx-auto max-w-[720px]'>
            <h2 className='type-h2 mx-auto max-w-[640px] text-balance'>
              Programe como se a IA não existisse. Aprenda como se ela fosse seu
              mentor.
            </h2>
            <p className='mx-auto mt-6 max-w-[480px] text-base text-[#2c2330] lg:text-[20px]'>
              Comece um desafio em 30 segundos. Sem cartão, sem onboarding
              chato.
            </p>
            <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Link
                href='/onboarding'
                className='group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-medium tracking-tight text-primary-foreground transition-colors duration-300 hover:bg-primary/90'
              >
                Quero ser desafiado
                <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
              <Link
                href='/dashboard'
                className='inline-flex items-center justify-center rounded-xl border border-[#1b1916]/20 px-6 py-3.5 text-base font-medium tracking-tight text-[#1b1916] transition-colors duration-300 hover:bg-[#1b1916]/5'
              >
                Ver dashboard de demo
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
