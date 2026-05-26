'use client'

import { Brain, Bug, Copy, GitBranch } from 'lucide-react'
import { motion } from 'motion/react'

const pains = [
  {
    icon: Copy,
    title: 'Tutorial Hell',
    desc: 'Você copia código sem entender. Cinco cursos depois, ainda trava no básico.',
    accent: 'from-iris/30 to-violet/10',
  },
  {
    icon: Brain,
    title: 'Atrofia cognitiva',
    desc: 'Copilot e ChatGPT entregam a resposta. Sua cabeça desaprende sintaxe e lógica.',
    accent: 'from-mint/30 to-iris/10',
  },
  {
    icon: GitBranch,
    title: 'Sem tech lead',
    desc: 'Autodidata, sozinho, sem ninguém pra perguntar “por que isso e não aquilo?”',
    accent: 'from-ember/30 to-iris/10',
  },
  {
    icon: Bug,
    title: 'Debugging eterno',
    desc: 'Dezenas de horas presas no mesmo erro. Sem aprender nada no caminho.',
    accent: 'from-iris/30 to-mint/10',
  },
]

export function Problem() {
  return (
    <section id='problema' className='relative py-28 sm:py-36'>
      <div className='mx-auto max-w-6xl px-4'>
        <div className='grid items-start gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className='lg:sticky lg:top-32'
          >
            <div className='glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] text-muted-foreground'>
              <span className='size-1 rounded-full bg-ember' />O elefante na
              sala
            </div>
            <h2 className='font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-5xl'>
              A IA está formando devs que{' '}
              <span className='text-gradient-iris font-serif font-normal italic'>
                não sabem programar
              </span>
              .
            </h2>
            <p className='mt-5 text-[17px] leading-relaxed text-muted-foreground'>
              Quem está começando hoje tem um problema que ninguém teve antes: a
              ferramenta mais poderosa da história da computação está ensinando
              a não pensar.
            </p>
          </motion.div>

          <div className='grid gap-4 sm:grid-cols-2'>
            {pains.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className='group glass relative overflow-hidden rounded-2xl p-6 transition-colors hover:bg-white/[0.05]'
              >
                <div
                  className={`absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br ${p.accent} opacity-0 blur-2xl transition-opacity group-hover:opacity-100`}
                />
                <div className='relative'>
                  <div className='mb-4 grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.04]'>
                    <p.icon className='size-4.5 text-foreground/80' />
                  </div>
                  <h3 className='mb-1.5 font-heading text-xl font-semibold tracking-tight'>
                    {p.title}
                  </h3>
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
