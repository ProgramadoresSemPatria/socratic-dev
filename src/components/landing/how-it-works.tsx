import { Reveal } from './reveal'

const steps = [
  {
    n: '01',
    title: 'Desafio realista',
    desc: 'A IA gera um briefing de cliente fictício — escopo, restrições e dor. Você começa pelo problema, não pela sintaxe.',
  },
  {
    n: '02',
    title: 'Perguntas, não respostas',
    desc: 'Travou? O tutor pergunta “que estrutura resolve isso?”. Você responde, ele aprofunda. O raciocínio é seu.',
  },
  {
    n: '03',
    title: 'Hints graduais',
    desc: 'Três níveis de pista, do vago ao quase-direto. Você escolhe quanta ajuda quer — e paga em pontos.',
  },
  {
    n: '04',
    title: 'Review socrático',
    desc: 'No fim, a IA não corrige: ela interroga suas escolhas até você entender o porquê de cada linha.',
  },
]

export function HowItWorks() {
  return (
    <section id='metodo' className='px-6 py-16 sm:px-10 lg:px-16 lg:py-24'>
      <div className='mx-auto max-w-[860px] text-center'>
        <Reveal>
          <span className='text-[13px] font-semibold tracking-[0.08em] text-[#6b6478] uppercase'>
            Como funciona
          </span>
          <h2 className='type-h2 mt-4'>
            Sócrates, mas com uma tela de código.
          </h2>
        </Reveal>
      </div>

      <div className='mt-12 grid gap-y-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-8'>
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={(i % 4) * 0.08} className='relative'>
            <div className='font-heading text-5xl font-light tracking-tight text-[#dad8ea]'>
              {s.n}
            </div>
            <h3 className='type-h3 mt-3 text-2xl lg:text-[26px]'>{s.title}</h3>
            <p className='type-body mt-2.5 max-w-[320px]'>{s.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
