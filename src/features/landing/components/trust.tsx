import { Ban, Eye, MessageSquareWarning, Trophy } from 'lucide-react'
import { Reveal } from './reveal'

const guarantees = [
  {
    icon: Ban,
    title: 'Zero respostas prontas',
    desc: 'A IA é proibida de entregar a solução. Por design.',
  },
  {
    icon: Eye,
    title: 'Hints rastreados',
    desc: 'Toda ajuda fica registrada e pesa no seu score.',
  },
  {
    icon: MessageSquareWarning,
    title: 'Review que questiona',
    desc: 'Você defende cada escolha antes de fechar o desafio.',
  },
  {
    icon: Trophy,
    title: 'Progresso honesto',
    desc: 'Métrica de independência que você não terceiriza.',
  },
]

export function Trust() {
  return (
    <section className='px-6 py-16 sm:px-10 lg:px-16 lg:py-20'>
      <div className='mx-auto mb-12 max-w-[720px] text-center'>
        <Reveal>
          <h2 className='type-h2'>O método, sem atalhos.</h2>
        </Reveal>
      </div>
      <div className='grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4'>
        {guarantees.map((g, i) => (
          <Reveal key={g.title} delay={(i % 4) * 0.07}>
            <div className='flex flex-col items-center gap-3 text-center'>
              <div className='grid size-12 place-items-center rounded-full border border-[#DFE5E9] text-[#1b1916]'>
                <g.icon className='size-5' strokeWidth={1.5} />
              </div>
              <div className='font-heading text-lg font-normal tracking-tight text-[#1b1916]'>
                {g.title}
              </div>
              <p className='text-sm leading-snug text-[#6b6478]'>{g.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
