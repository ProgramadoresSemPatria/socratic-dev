'use client'

import {
  Lightbulb,
  MessageCircleQuestion,
  ScrollText,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Eyebrow, Section, SectionHeading, SectionLead } from './section'

const steps = [
  {
    n: '01',
    icon: ScrollText,
    title: 'Desafio realista',
    desc: 'A IA gera um briefing de cliente fictício — escopo, restrições, dor. Não é mais um exercício de algoritmo.',
  },
  {
    n: '02',
    icon: MessageCircleQuestion,
    title: 'Perguntas, não respostas',
    desc: 'Travou? O tutor pergunta: “que estrutura de dados resolve isso?”. Você responde. Ele aprofunda.',
  },
  {
    n: '03',
    icon: Lightbulb,
    title: 'Hints graduais',
    desc: 'Três níveis de pista — do vago ao quase direto. Você decide quanta ajuda quer, e paga em pontos de independência.',
  },
  {
    n: '04',
    icon: TrendingUp,
    title: 'Review socrático',
    desc: 'Submeteu? A IA não corrige. Pergunta: “por que var e não const?”. Você aprende defendendo a sua escolha.',
  },
]

export function Method() {
  return (
    <Section id='metodo' muted>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        className='mx-auto max-w-2xl text-center'
      >
        <Eyebrow>Como funciona</Eyebrow>
        <SectionHeading className='mt-4'>
          Sócrates, mas com uma tela de código.
        </SectionHeading>
        <SectionLead className='mt-5'>
          2.400 anos atrás, ele formava pensadores fazendo perguntas. A gente só
          atualizou a interface.
        </SectionLead>
      </motion.div>

      <div className='mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className='relative rounded-2xl border border-border bg-card p-6 shadow-soft'
          >
            <div className='mb-5 flex items-center justify-between'>
              <div className='grid size-11 place-items-center rounded-xl bg-primary/10 text-primary'>
                <s.icon className='size-5' />
              </div>
              <span className='font-heading text-2xl font-semibold text-foreground/15'>
                {s.n}
              </span>
            </div>
            <h3 className='mb-2 font-heading text-[19px] font-semibold tracking-tight text-foreground'>
              {s.title}
            </h3>
            <p className='text-sm leading-relaxed text-muted-foreground'>
              {s.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
