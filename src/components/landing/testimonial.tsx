import { Reveal } from './reveal'

export function Testimonial() {
  return (
    <section id='manifesto' className='p-3 md:p-6'>
      <Reveal>
        <figure className='rounded-2xl bg-[#1b1916] px-6 py-12 lg:px-[60px] lg:py-[64px]'>
          <blockquote className='type-quote mb-10 max-w-[820px] lg:mb-14'>
            “Eu sei que nada sei. E é exatamente isso que vai te tornar um dev de
            verdade — a coragem de pensar antes de perguntar.”
          </blockquote>
          <figcaption className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-center gap-4'>
              <span className='grid size-[64px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-iris to-violet font-heading text-2xl font-light text-white lg:size-[80px]'>
                Σ
              </span>
              <div>
                <p className='text-xl font-normal tracking-[-0.56px] text-white lg:text-[28px]'>
                  Sócrates
                </p>
                <p className='mt-0.5 text-sm tracking-[-0.32px] text-[#dad8ea] lg:text-base'>
                  Filósofo · Atenas, 470 a.C.
                </p>
              </div>
            </div>
            <div className='text-sm text-white/45'>
              o método que sobreviveu a 2.400 anos de atalhos
            </div>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  )
}
