import { ArrowRight, Code2, Network } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from './reveal'

const modes = [
  {
    icon: Code2,
    tag: null,
    title: 'Desafios de código',
    desc: 'Editor Monaco de verdade, testes escondidos e um tutor que responde pergunta com pergunta. Resolva como no trabalho — sem cola.',
    cta: 'Resolver código',
    points: [
      'JavaScript & TypeScript',
      'Do iniciante ao nível big tech',
      'Roda os testes na hora',
    ],
  },
  {
    icon: Network,
    tag: 'Novo',
    title: 'Desafios de system design',
    desc: 'Desenhe a arquitetura num canvas — serviços, bancos, filas e o fluxo dos dados. A IA enxerga seu diagrama e interroga cada decisão.',
    cta: 'Desenhar arquitetura',
    points: [
      'Canvas Excalidraw integrado',
      'IA com visão analisa a arquitetura',
      'Distribuição de dados, escala e trade-offs',
    ],
  },
]

export function Modes() {
  return (
    <section className='px-6 py-16 sm:px-10 lg:px-16 lg:py-24'>
      <div className='mx-auto max-w-[860px] text-center'>
        <Reveal>
          <span className='text-[13px] font-semibold tracking-[0.08em] text-[#6b6478] uppercase'>
            Dois modos
          </span>
          <h2 className='type-h2 mt-4'>
            Treine o que o mercado cobra.{' '}
            <span className='text-gradient font-serif font-normal italic'>
              Pensando.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className='type-body mx-auto mt-5 max-w-[600px]'>
            Código ou system design (arquitetura) — o mesmo princípio
            socrático: a IA nunca entrega pronto, ela te leva até lá.
          </p>
        </Reveal>
      </div>

      <div className='mx-auto mt-12 grid max-w-[980px] gap-4 lg:mt-16 lg:grid-cols-2'>
        {modes.map((m, i) => (
          <Reveal key={m.title} delay={i * 0.1} className='h-full'>
            <div className='shadow-soft hover:shadow-soft-lg relative flex h-full flex-col rounded-2xl border border-[#DFE5E9] bg-white p-7 transition-shadow sm:p-8'>
              {m.tag && (
                <span className='absolute top-6 right-6 rounded-full bg-iris/10 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-iris uppercase'>
                  {m.tag}
                </span>
              )}
              <div className='grid size-12 place-items-center rounded-xl bg-[#dad8ea]/55 text-[#1b1916]'>
                <m.icon className='size-6' strokeWidth={1.5} />
              </div>
              <h3 className='type-h3 mt-5 text-2xl lg:text-[28px]'>{m.title}</h3>
              <p className='type-body mt-3'>{m.desc}</p>
              <ul className='mt-5 space-y-2'>
                {m.points.map((p) => (
                  <li
                    key={p}
                    className='flex items-center gap-2.5 text-sm text-[#2c2330]'
                  >
                    <span className='size-1.5 shrink-0 rounded-full bg-iris' />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href='/onboarding'
                className='group/cta mt-7 inline-flex items-center gap-1.5 text-[15px] font-medium text-iris'
              >
                {m.cta}
                <ArrowRight className='size-4 transition-transform group-hover/cta:translate-x-0.5' />
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
