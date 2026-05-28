'use client'

import {
  Code2,
  Compass,
  GaugeCircle,
  Layers,
  MessagesSquare,
  Sparkles,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Eyebrow, Section, SectionHeading, SectionLead } from './section'

const features = [
  {
    icon: Code2,
    title: 'Editor de verdade',
    desc: 'Monaco completo — o mesmo motor do VS Code. Nada de campos de texto fake.',
  },
  {
    icon: MessagesSquare,
    title: 'IA que questiona',
    desc: 'O tutor responde pergunta com pergunta. Ele te guia, mas a solução é sua.',
  },
  {
    icon: Layers,
    title: 'Hints em 3 níveis',
    desc: 'Do empurrão sutil ao quase-spoiler. Você escolhe a profundidade da ajuda.',
  },
  {
    icon: Compass,
    title: 'Briefings reais',
    desc: 'Cada desafio vem com cliente, escopo e restrições — como no trabalho de verdade.',
  },
  {
    icon: GaugeCircle,
    title: 'Score de independência',
    desc: 'Cada hint custa pontos. O dashboard mostra o quanto você resolveu sozinho.',
  },
  {
    icon: Sparkles,
    title: 'Review socrático',
    desc: 'Submeteu? A IA não corrige — ela interroga suas escolhas até você entender.',
  },
]

export function FeaturesGrid() {
  return (
    <Section id='recursos'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
        className='mx-auto max-w-2xl text-center'
      >
        <Eyebrow>A plataforma</Eyebrow>
        <SectionHeading className='mt-4'>
          Tudo que você precisa para aprender pensando.
        </SectionHeading>
        <SectionLead className='mt-5'>
          Um ambiente desenhado para o esforço produtivo — não para o atalho
          fácil.
        </SectionLead>
      </motion.div>

      <div className='mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
            className='group rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-soft-lg'
          >
            <div className='mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'>
              <f.icon className='size-5' />
            </div>
            <h3 className='mb-1.5 font-heading text-lg font-semibold tracking-tight text-foreground'>
              {f.title}
            </h3>
            <p className='text-sm leading-relaxed text-muted-foreground'>
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
