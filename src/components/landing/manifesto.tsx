'use client'

import { motion } from 'motion/react'
import { Eyebrow } from './section'

const points = [
  'A IA mais poderosa do mundo te ensina a não pensar.',
  'Você decora soluções. Não internaliza padrões.',
  'Trava num bug? Cola no ChatGPT. Aprendeu? Nada.',
]

export function Manifesto() {
  return (
    <section id='manifesto' className='relative py-24 sm:py-32'>
      <div className='mx-auto max-w-3xl px-4 text-center sm:px-6'>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <Eyebrow>Manifesto</Eyebrow>
        </motion.div>

        <div className='mt-7 space-y-2 sm:space-y-3'>
          {points.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className='font-heading text-2xl font-semibold tracking-[-0.025em] text-foreground/35 sm:text-4xl'
            >
              {p}
            </motion.p>
          ))}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className='pt-2 font-heading text-2xl font-semibold tracking-[-0.025em] text-primary sm:text-4xl'
          >
            A gente acredita no contrário.
          </motion.p>
        </div>

        {/* Testimonial-style quote card */}
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className='mx-auto mt-16 max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10'
        >
          <blockquote className='text-xl leading-relaxed text-balance text-foreground sm:text-2xl'>
            “Eu sei que nada sei. E é exatamente isso que vai te tornar um dev de
            verdade.”
          </blockquote>
          <figcaption className='mt-6 flex items-center justify-center gap-3'>
            <span className='grid size-10 place-items-center rounded-full bg-gradient-to-br from-iris to-violet font-heading text-sm font-bold text-primary-foreground'>
              Σ
            </span>
            <span className='text-left'>
              <span className='block text-sm font-semibold text-foreground'>
                Sócrates
              </span>
              <span className='block text-xs text-muted-foreground'>
                470 a.C. (mais ou menos)
              </span>
            </span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  )
}
