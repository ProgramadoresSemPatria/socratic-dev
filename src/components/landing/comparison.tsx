'use client'

import { Check, X } from 'lucide-react'
import { motion } from 'motion/react'

const rows = [
  {
    feature: 'Te dá o código pronto',
    others: true,
    us: false,
  },
  {
    feature: 'Te força a raciocinar',
    others: false,
    us: true,
  },
  {
    feature: 'Mede sua independência',
    others: false,
    us: true,
  },
  {
    feature: 'Hints escaláveis (3 níveis)',
    others: false,
    us: true,
  },
  {
    feature: 'Code review com perguntas',
    others: false,
    us: true,
  },
  {
    feature: 'Desafios com briefing de cliente',
    others: false,
    us: true,
  },
]

export function Comparison() {
  return (
    <section id='exemplo' className='relative overflow-hidden py-28 sm:py-36'>
      <div className='mx-auto max-w-5xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className='mx-auto mb-16 max-w-3xl text-center'
        >
          <div className='glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] text-muted-foreground'>
            <span className='size-1 rounded-full bg-mint' />
            Não somos mais um wrapper de GPT
          </div>
          <h2 className='font-heading text-4xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-5xl'>
            O oposto de tudo que{' '}
            <span className='text-gradient-iris font-serif font-normal italic'>
              já existe
            </span>
            .
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className='border-gradient noise overflow-hidden rounded-3xl'
        >
          <div className='grid grid-cols-3 border-b border-white/[0.06] bg-white/[0.02]'>
            <div className='px-6 py-5 font-mono text-[13px] text-muted-foreground/70'>
              critério
            </div>
            <div className='px-6 py-5 text-center text-[13px] font-medium text-muted-foreground'>
              Copilot · ChatGPT · Cursor
            </div>
            <div className='px-6 py-5 text-center text-[13px] font-medium'>
              <span className='text-gradient-iris'>Socratic.dev</span>
            </div>
          </div>

          {rows.map((r, i) => (
            <motion.div
              key={r.feature}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className='grid grid-cols-3 border-b border-white/[0.04] transition-colors last:border-b-0 hover:bg-white/[0.015]'
            >
              <div className='px-6 py-4 text-[14px] font-medium text-foreground/90'>
                {r.feature}
              </div>
              <div className='grid place-items-center px-6 py-4'>
                {r.others ? (
                  <div className='grid size-7 place-items-center rounded-full border border-red-500/20 bg-red-500/10'>
                    <X className='size-3.5 text-red-400/80' />
                  </div>
                ) : (
                  <div className='grid size-7 place-items-center rounded-full border border-white/[0.06] bg-white/[0.03]'>
                    <X className='size-3.5 text-muted-foreground/40' />
                  </div>
                )}
              </div>
              <div className='grid place-items-center px-6 py-4'>
                {r.us ? (
                  <div className='grid size-7 place-items-center rounded-full border border-mint/30 bg-mint/15'>
                    <Check className='size-3.5 text-mint' />
                  </div>
                ) : (
                  <div className='grid size-7 place-items-center rounded-full border border-white/[0.06] bg-white/[0.03]'>
                    <X className='size-3.5 text-muted-foreground/40' />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
