'use client'

import { ArrowRight, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { Reveal } from './reveal'

export function Showcase() {
  return (
    <section className='px-6 py-16 sm:px-10 lg:px-16 lg:py-24'>
      {/* Row 1 — text + IDE mock */}
      <div className='grid items-center gap-10 lg:grid-cols-2 lg:gap-16'>
        <Reveal>
          <span className='text-[13px] font-semibold tracking-[0.08em] text-[#6b6478] uppercase'>
            O loop socrático
          </span>
          <h2 className='type-h2 mt-4'>
            Você trava. Ele pergunta. Você pensa.
          </h2>
          <p className='type-body mt-5 max-w-[520px]'>
            Em vez de despejar a solução, o tutor devolve a pergunta certa no
            momento certo — te empurrando para o próximo passo sem entregar o
            destino.
          </p>
          <ul className='mt-6 space-y-3'>
            {[
              'Perguntas que miram o conceito, não a sintaxe',
              'Hints que escalam só quando você pede',
              'Cada ajuda registrada no seu score',
            ].map((t) => (
              <li key={t} className='flex items-start gap-3 type-body'>
                <span className='mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#1b1916] text-white'>
                  <Check className='size-3' strokeWidth={2.5} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <IdeMock />
        </Reveal>
      </div>

      {/* Row 2 — progress visual + text */}
      <div className='mt-16 grid items-center gap-10 lg:mt-24 lg:grid-cols-2 lg:gap-16'>
        <Reveal className='order-2 lg:order-1'>
          <ProgressMock />
        </Reveal>
        <Reveal delay={0.1} className='order-1 lg:order-2'>
          <span className='text-[13px] font-semibold tracking-[0.08em] text-[#6b6478] uppercase'>
            Independência medível
          </span>
          <h2 className='type-h2 mt-4'>
            O quanto você resolveu sozinho, em número.
          </h2>
          <p className='type-body mt-5 max-w-[520px]'>
            Cada desafio fecha com um score de independência. Pediu três hints?
            O número cai. Resolveu no seco? Ele sobe. Progresso que você não
            consegue terceirizar para a IA.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function IdeMock() {
  return (
    <div className='ring-soft overflow-hidden rounded-2xl bg-[oklch(0.1_0.012_280)]'>
      <div className='flex items-center gap-2 border-b border-white/[0.06] px-4 py-3'>
        <span className='size-2.5 rounded-full bg-red-500/60' />
        <span className='size-2.5 rounded-full bg-amber-400/60' />
        <span className='size-2.5 rounded-full bg-emerald-500/60' />
        <span className='flex-1 text-center font-mono text-[11px] text-white/45'>
          api-padaria.ts
        </span>
      </div>
      <div className='space-y-3 p-5 text-[13px]'>
        <div className='flex justify-end'>
          <div className='max-w-[80%] rounded-2xl rounded-br-md bg-white/10 px-3 py-2 text-white/90'>
            Como filtro só os produtos que vencem em 3 dias?
          </div>
        </div>
        <div className='flex'>
          <div className='max-w-[88%] rounded-2xl rounded-bl-md border border-iris/25 bg-gradient-to-br from-iris/20 via-violet/10 to-mint/10 px-3 py-2 text-white/95'>
            Antes de codar — que estrutura de dados o{' '}
            <code className='text-[oklch(0.74_0.16_285)]'>findAll()</code> te
            devolve?
          </div>
        </div>
        <div className='flex justify-end'>
          <div className='max-w-[80%] rounded-2xl rounded-br-md bg-white/10 px-3 py-2 text-white/90'>
            um array de objetos
          </div>
        </div>
        <div className='flex'>
          <div className='max-w-[88%] rounded-2xl rounded-bl-md border border-iris/25 bg-gradient-to-br from-iris/20 via-violet/10 to-mint/10 px-3 py-2 text-white/95'>
            Exato. E qual método de array filtra por uma condição?
          </div>
        </div>
        <div className='flex items-center gap-2 pt-1'>
          <div className='flex h-9 flex-1 items-center rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 text-[12px] text-white/40'>
            Pense, depois pergunte…
          </div>
          <div className='grid size-9 place-items-center rounded-xl bg-white/90'>
            <ArrowRight className='size-3.5 text-black' />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressMock() {
  const bars = [
    { label: 'APIs', v: 82 },
    { label: 'Front-end', v: 64 },
    { label: 'Algoritmos', v: 48 },
    { label: 'Debugging', v: 71 },
  ]
  return (
    <div className='rounded-2xl border border-[#DFE5E9] bg-white p-6 shadow-soft sm:p-8'>
      <div className='flex items-end justify-between'>
        <div>
          <div className='text-sm text-[#6b6478]'>Score de independência</div>
          <div className='font-heading text-4xl font-light tracking-tight text-[#1b1916]'>
            73<span className='text-2xl text-[#6b6478]'>/100</span>
          </div>
        </div>
        <div className='rounded-full bg-[#dad8ea]/55 px-3 py-1 text-xs font-medium text-[#1b1916]'>
          ▲ 12 esta semana
        </div>
      </div>
      <div className='mt-6 space-y-4'>
        {bars.map((b, i) => (
          <div key={b.label}>
            <div className='mb-1.5 flex justify-between text-xs text-[#6b6478]'>
              <span>{b.label}</span>
              <span>{b.v}%</span>
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-[#eef1f4]'>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${b.v}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
                className='h-full rounded-full bg-[#1b1916]'
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
