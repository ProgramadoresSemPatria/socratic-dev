'use client'

import {
  Lightbulb,
  MessageCircleQuestion,
  ScrollText,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'motion/react'

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
    desc: "Travou? O tutor pergunta: 'que estrutura de dados resolve isso?'. Você responde. Ele aprofunda.",
  },
  {
    n: '03',
    icon: Lightbulb,
    title: 'Hints graduais',
    desc: 'Três níveis de pista — do vago ao quase direto. Você decide o quanto de ajuda quer. E paga em pontos de independência.',
  },
  {
    n: '04',
    icon: TrendingUp,
    title: 'Review socrático',
    desc: "Submeteu? A IA não corrige. Pergunta: 'por que var e não const?'. Você aprende defendendo a sua escolha.",
  },
]

export function Method() {
  return (
    <section id='metodo' className='relative py-28 sm:py-36'>
      <div className='mx-auto max-w-6xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className='mx-auto max-w-3xl text-center'
        >
          <div className='glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] text-muted-foreground'>
            <span className='size-1 rounded-full bg-iris' />O método
          </div>
          <h2 className='font-heading text-4xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-5xl md:text-6xl'>
            Sócrates, mas com uma{' '}
            <span className='text-gradient font-serif font-normal italic'>
              tela de código
            </span>
            .
          </h2>
          <p className='mt-5 text-lg leading-relaxed text-balance text-muted-foreground'>
            2.400 anos atrás, ele formava pensadores fazendo perguntas. A gente
            atualizou a interface.
          </p>
        </motion.div>

        <div className='mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className='group relative'
            >
              <div className='glass relative h-full overflow-hidden rounded-3xl p-6 transition-colors hover:bg-white/[0.05]'>
                <div className='absolute top-5 right-5 font-mono text-[11px] text-muted-foreground/50'>
                  {s.n}
                </div>
                <div className='mb-5 grid size-11 place-items-center rounded-2xl border border-iris/20 bg-gradient-to-br from-iris/20 to-mint/10'>
                  <s.icon className='size-5 text-foreground/90' />
                </div>
                <h3 className='mb-2 font-heading text-[19px] font-semibold tracking-tight'>
                  {s.title}
                </h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  {s.desc}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className='absolute top-1/2 -right-3 hidden -translate-y-1/2 text-xl text-muted-foreground/30 lg:block'>
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
