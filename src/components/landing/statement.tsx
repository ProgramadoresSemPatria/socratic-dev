import { Reveal } from './reveal'

export function Statement() {
  return (
    <section id='problema' className='relative overflow-hidden px-6 py-20 text-center sm:px-10 sm:py-24 lg:py-32'>
      <div
        className='pointer-events-none absolute -top-1/3 left-1/2 hidden size-[460px] -translate-x-1/2 rounded-full opacity-50 blur-3xl lg:block'
        style={{
          background: 'radial-gradient(circle, rgba(218,216,234,0.7), transparent 60%)',
        }}
      />
      <div className='relative mx-auto flex max-w-[760px] flex-col items-center gap-6'>
        <Reveal>
          <h2 className='type-h2 text-pretty'>
            Aprender a programar virou copiar e colar.{' '}
            <span className='text-[#6b6478]'>
              O raciocínio ficou pelo caminho.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className='type-body max-w-[640px]'>
            Copilot e ChatGPT entregam a resposta antes de você formular a
            pergunta. Você avança nas tarefas, mas não internaliza nada — e na
            primeira tela em branco, trava. A ferramenta mais poderosa da
            história da computação está ensinando uma geração a não pensar.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
