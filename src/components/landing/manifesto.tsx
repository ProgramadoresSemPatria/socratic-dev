'use client'

import { motion } from 'motion/react'

const points = [
  'A IA mais poderosa do mundo te ensina a não pensar.',
  'Você decora soluções. Não internaliza padrões.',
  'Trava num bug? Cola no ChatGPT. Aprendeu? Nada.',
  'A gente acredita no contrário.',
]

export function Manifesto() {
  return (
    <section id='precos' className='relative overflow-hidden py-32 sm:py-40'>
      {/* Glow */}
      <div
        className='absolute top-1/2 left-1/2 -z-10 size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl'
        style={{
          background:
            'radial-gradient(circle, oklch(0.68 0.22 285 / 0.5), transparent 65%)',
        }}
      />

      <div className='mx-auto max-w-4xl px-4 text-center'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className='glass mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] text-muted-foreground'
        >
          <span className='size-1 animate-pulse rounded-full bg-iris' />
          Manifesto
        </motion.div>

        <div className='space-y-3 sm:space-y-5'>
          {points.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              className={
                i === points.length - 1
                  ? 'text-gradient pt-4 font-heading text-3xl leading-tight font-semibold tracking-[-0.03em] sm:text-5xl'
                  : 'font-heading text-3xl leading-tight font-semibold tracking-[-0.03em] text-muted-foreground/60 sm:text-5xl'
              }
            >
              {p}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className='mx-auto mt-16 max-w-2xl font-serif text-xl leading-relaxed text-muted-foreground/80 italic sm:text-2xl'
        >
          &ldquo;Eu sei que nada sei. E é exatamente isso que vai te tornar um
          dev de verdade.&rdquo;
          <div className='mt-4 font-mono text-xs text-muted-foreground/60 not-italic'>
            — Sócrates, 470 a.C. (mais ou menos)
          </div>
        </motion.div>
      </div>
    </section>
  )
}
