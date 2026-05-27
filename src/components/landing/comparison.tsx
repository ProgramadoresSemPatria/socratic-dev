'use client'

import { Check, X } from 'lucide-react'
import { motion } from 'motion/react'
import { Eyebrow, Section, SectionHeading } from './section'

const rows = [
  { feature: 'Te dá o código pronto', others: true, us: false },
  { feature: 'Te força a raciocinar', others: false, us: true },
  { feature: 'Mede sua independência', others: false, us: true },
  { feature: 'Hints escaláveis (3 níveis)', others: false, us: true },
  { feature: 'Code review com perguntas', others: false, us: true },
  { feature: 'Desafios com briefing de cliente', others: false, us: true },
]

export function Comparison() {
  return (
    <Section id='exemplo' muted>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        className='mx-auto mb-12 max-w-2xl text-center'
      >
        <Eyebrow>O contraste</Eyebrow>
        <SectionHeading className='mt-4'>
          O oposto de tudo que <span className='text-primary'>já existe</span>.
        </SectionHeading>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className='mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-soft'
      >
        {/* header */}
        <div className='grid grid-cols-[1.4fr_1fr_1fr] border-b border-border'>
          <div className='px-5 py-5 text-[13px] font-medium text-muted-foreground sm:px-6'>
            Critério
          </div>
          <div className='px-3 py-5 text-center text-[13px] font-medium text-muted-foreground sm:px-6'>
            Copilot · GPT · Cursor
          </div>
          <div className='bg-primary/5 px-3 py-5 text-center text-[13px] font-semibold text-primary sm:px-6'>
            Socratic.dev
          </div>
        </div>

        {rows.map((r, i) => (
          <motion.div
            key={r.feature}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className='grid grid-cols-[1.4fr_1fr_1fr] border-b border-border last:border-b-0'
          >
            <div className='px-5 py-4 text-[14px] font-medium text-foreground sm:px-6'>
              {r.feature}
            </div>
            <div className='grid place-items-center px-3 py-4'>
              {r.others ? (
                <Cell tone='bad'>
                  <X className='size-3.5' />
                </Cell>
              ) : (
                <Cell tone='neutral'>
                  <X className='size-3.5' />
                </Cell>
              )}
            </div>
            <div className='grid place-items-center bg-primary/5 px-3 py-4'>
              {r.us ? (
                <Cell tone='good'>
                  <Check className='size-3.5' />
                </Cell>
              ) : (
                <Cell tone='neutral'>
                  <X className='size-3.5' />
                </Cell>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}

function Cell({
  tone,
  children,
}: {
  tone: 'good' | 'bad' | 'neutral'
  children: React.ReactNode
}) {
  const styles = {
    good: 'bg-primary text-primary-foreground',
    bad: 'border border-red-500/25 bg-red-500/10 text-red-500',
    neutral: 'border border-border bg-muted text-muted-foreground/50',
  }[tone]
  return (
    <div className={`grid size-7 place-items-center rounded-full ${styles}`}>
      {children}
    </div>
  )
}
