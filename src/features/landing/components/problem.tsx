'use client'

import { Brain, Bug, Copy, GitBranch } from 'lucide-react'
import { motion } from 'motion/react'
import { Eyebrow, Section, SectionHeading, SectionLead } from './section'

const pains = [
  {
    icon: Copy,
    title: 'Tutorial Hell',
    desc: 'Você copia código sem entender. Cinco cursos depois, ainda trava no básico.',
  },
  {
    icon: Brain,
    title: 'Atrofia cognitiva',
    desc: 'Copilot e ChatGPT entregam a resposta. Sua cabeça desaprende sintaxe e lógica.',
  },
  {
    icon: GitBranch,
    title: 'Sem tech lead',
    desc: 'Autodidata, sozinho, sem ninguém pra perguntar “por que isso e não aquilo?”.',
  },
  {
    icon: Bug,
    title: 'Debugging eterno',
    desc: 'Dezenas de horas presas no mesmo erro. Sem aprender nada no caminho.',
  },
]

export function Problem() {
  return (
    <Section id='problema'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        className='mx-auto max-w-2xl text-center'
      >
        <Eyebrow>O elefante na sala</Eyebrow>
        <SectionHeading className='mt-4'>
          A IA está formando devs que{' '}
          <span className='text-primary'>não sabem programar</span>.
        </SectionHeading>
        <SectionLead className='mt-5'>
          Quem está começando hoje tem um problema que ninguém teve antes: a
          ferramenta mais poderosa da história da computação está ensinando a não
          pensar.
        </SectionLead>
      </motion.div>

      <div className='mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
        {pains.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            className='group rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-soft-lg'
          >
            <div className='mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'>
              <p.icon className='size-5' />
            </div>
            <h3 className='mb-1.5 font-heading text-lg font-semibold tracking-tight text-foreground'>
              {p.title}
            </h3>
            <p className='text-sm leading-relaxed text-muted-foreground'>
              {p.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
