import {
  Code2,
  Compass,
  GaugeCircle,
  Layers,
  MessagesSquare,
  Sparkles,
} from 'lucide-react'
import { Reveal } from './reveal'

const features = [
  {
    icon: Code2,
    title: 'Editor de verdade',
    desc: 'Monaco completo — o mesmo motor do VS Code. Nada de campo de texto fake para fingir que você está codando.',
  },
  {
    icon: MessagesSquare,
    title: 'IA que questiona',
    desc: 'O tutor responde pergunta com pergunta. Ele te guia até a solução, mas a solução continua sendo sua.',
  },
  {
    icon: Layers,
    title: 'Hints em três níveis',
    desc: 'Do empurrão sutil ao quase-spoiler. Você decide a profundidade da ajuda e paga em pontos de independência.',
  },
  {
    icon: Compass,
    title: 'Briefings reais',
    desc: 'Cada desafio chega com cliente, escopo e restrições — como no trabalho de verdade, não como exercício de algoritmo.',
  },
  {
    icon: GaugeCircle,
    title: 'Score de independência',
    desc: 'Cada hint custa pontos. O dashboard mostra, sem piedade, o quanto você resolveu sozinho.',
  },
  {
    icon: Sparkles,
    title: 'Review socrático',
    desc: 'Submeteu? A IA não corrige — ela interroga suas escolhas até você entender por que fez o que fez.',
  },
]

export function Features() {
  return (
    <section id='recursos' className='px-6 py-16 sm:px-10 lg:px-16 lg:py-24'>
      <div className='mx-auto max-w-[860px] text-center'>
        <Reveal>
          <h2 className='type-h2'>Feito para quem quer pensar, não copiar.</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className='type-body mx-auto mt-5 max-w-[600px]'>
            Um ambiente desenhado para o esforço produtivo — não para o atalho
            fácil.
          </p>
        </Reveal>
      </div>

      <div className='mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3'>
        {features.map((f, i) => (
          <Reveal
            key={f.title}
            delay={(i % 3) * 0.08}
            className='flex flex-col gap-3'
          >
            <div className='grid size-12 place-items-center rounded-xl bg-[#dad8ea]/55 text-[#1b1916]'>
              <f.icon className='size-6' strokeWidth={1.5} />
            </div>
            <h3 className='type-h3 text-2xl lg:text-[28px]'>{f.title}</h3>
            <p className='type-body'>{f.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
