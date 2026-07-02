'use client'

import { useT } from '@/lib/i18n'
import Link from 'next/link'
import { useState } from 'react'
import { Halftone } from './halftone'
import { Reveal } from './reveal'

const copy = {
  en: {
    eyebrow: 'For every kind of challenge',
    title: 'A training ground, not a tutorial.',
    cta: 'Start training',
    soon: 'Coming soon',
    arenas: {
      api: {
        eyebrow: 'REST · GraphQL · Schema',
        title: 'APIs & data modeling',
        desc: 'Design endpoints, queries and schema under the real constraints of a fictional client. The tutor questions every contract decision before accepting — you defend the design, not just the code.',
      },
      ui: {
        eyebrow: 'State · Components · Edge cases',
        title: 'Real-world interfaces',
        desc: 'State, composition and the edge cases no tutorial shows you — without pasting the first answer from a chat.',
      },
      algo: {
        eyebrow: 'Big-O · Structures · Trade-offs',
        title: 'Structures & complexity',
        desc: 'You justify your O(n) choice and your data structure before the tutor accepts the solution.',
      },
      debug: {
        eyebrow: 'Stack trace · Root cause · Hypotheses',
        title: 'Guided bug hunt',
        desc: 'Questions that walk you to the root cause, instead of dumping an already-solved stack trace.',
      },
      design: {
        eyebrow: 'Architecture · Trade-offs · Scale',
        title: 'System design on canvas',
        desc: 'Sketch the architecture in Excalidraw. The AI sees your diagram and interrogates every scaling decision.',
      },
    },
  },
  pt: {
    eyebrow: 'Para todo tipo de desafio',
    title: 'Um campo de treino, não um tutorial.',
    cta: 'Começar a treinar',
    soon: 'Em breve',
    arenas: {
      api: {
        eyebrow: 'REST · GraphQL · Schema',
        title: 'APIs e modelagem de dados',
        desc: 'Projete endpoints, queries e schema sob as restrições reais de um cliente fictício. O tutor questiona cada decisão de contrato antes de aceitar — você defende o design, não só o código.',
      },
      ui: {
        eyebrow: 'Estado · Componentes · Edge-cases',
        title: 'Interfaces de verdade',
        desc: 'Estado, composição e os edge-cases que ninguém mostra no tutorial — sem colar a primeira resposta do chat.',
      },
      algo: {
        eyebrow: 'Big-O · Estruturas · Trade-offs',
        title: 'Estruturas e complexidade',
        desc: 'Você justifica sua escolha de O(n) e a estrutura de dados antes de o tutor aceitar a solução.',
      },
      debug: {
        eyebrow: 'Stack trace · Causa raiz · Hipóteses',
        title: 'Caça ao bug guiada',
        desc: 'Perguntas que te levam à causa raiz, em vez de despejar o stack trace já resolvido.',
      },
      design: {
        eyebrow: 'Arquitetura · Trade-offs · Escala',
        title: 'System design no canvas',
        desc: 'Desenhe a arquitetura no Excalidraw. A IA enxerga seu diagrama e interroga cada decisão de escala.',
      },
    },
  },
} as const

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

function glyph(text: string, widthFactor: number): Painter {
  return (ctx, w, h) => {
    const size = Math.min(h * 0.85, w / widthFactor)
    ctx.font = `700 ${size}px ui-monospace, Menlo, Consolas, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)
  }
}

const paintApi = glyph('{ }', 2)
const paintUi = glyph('</>', 2)
const paintAlgo = glyph('O(n)', 2.7)

const paintDebug: Painter = (ctx, w, h) => {
  const s = Math.min(w, h * 2.4) / 480
  ctx.translate(w / 2, h / 2)
  ctx.scale(s, s)
  ctx.lineWidth = 16
  ctx.beginPath()
  ctx.arc(0, 0, 150, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillRect(-8, -212, 16, 64)
  ctx.fillRect(-8, 148, 16, 64)
  ctx.fillRect(-212, -8, 64, 16)
  ctx.fillRect(148, -8, 64, 16)
  ctx.beginPath()
  ctx.ellipse(0, 14, 50, 68, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, -70, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.moveTo(-44, -26)
  ctx.lineTo(-96, -52)
  ctx.moveTo(-50, 14)
  ctx.lineTo(-104, 14)
  ctx.moveTo(-44, 54)
  ctx.lineTo(-96, 84)
  ctx.moveTo(44, -26)
  ctx.lineTo(96, -52)
  ctx.moveTo(50, 14)
  ctx.lineTo(104, 14)
  ctx.moveTo(44, 54)
  ctx.lineTo(96, 84)
  ctx.moveTo(-14, -94)
  ctx.lineTo(-32, -124)
  ctx.moveTo(14, -94)
  ctx.lineTo(32, -124)
  ctx.stroke()
}

const paintDesign: Painter = (ctx, w, h) => {
  const s = Math.min(w, h * 2.6) / 560
  ctx.translate(w / 2, h / 2)
  ctx.scale(s, s)
  const box = (x: number, y: number) => {
    ctx.beginPath()
    ctx.roundRect(x, y, 120, 70, 12)
    ctx.fill()
  }
  box(-270, -110)
  box(-270, 40)
  box(-60, -35)
  ctx.beginPath()
  ctx.ellipse(200, -55, 55, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(145, -55, 110, 110)
  ctx.beginPath()
  ctx.ellipse(200, 55, 55, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.moveTo(-150, -75)
  ctx.lineTo(-60, -10)
  ctx.moveTo(-150, 75)
  ctx.lineTo(-60, 10)
  ctx.moveTo(60, 0)
  ctx.lineTo(145, 0)
  ctx.stroke()
}

type ArenaKey = 'api' | 'ui' | 'algo' | 'debug' | 'design'

type Arena = {
  key: ArenaKey
  href: string
  fill: string
  soon?: boolean
  paint: Painter
}

const arenas: Arena[] = [
  { key: 'api', href: '/onboarding', fill: 'bg-pastel-greige', paint: paintApi },
  { key: 'ui', href: '/onboarding', fill: 'bg-pastel-sage', paint: paintUi },
  { key: 'algo', href: '/onboarding', fill: 'bg-pastel-mist', paint: paintAlgo },
  { key: 'debug', href: '/onboarding', fill: 'bg-pastel-sand', soon: true, paint: paintDebug },
  { key: 'design', href: '/onboarding', fill: 'bg-pastel-lavender', paint: paintDesign },
]

function Scene({ paint, active }: { paint: Painter; active: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-5 top-4 h-[175px] mix-blend-multiply transition-opacity duration-500 ease-out ${active ? 'opacity-85' : 'opacity-[0.18]'}`}
    >
      <Halftone
        draw={paint}
        active={active}
        interactive
        spacing={8}
        flow={12}
        className='absolute inset-0'
      />
    </div>
  )
}

function Arrow() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      aria-hidden
      className='shrink-0 transition-transform duration-200 group-hover/link:translate-x-0.5'
    >
      <path
        d='M3 8h10M9 4l4 4-4 4'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function UseCases() {
  const t = useT(copy)
  const [active, setActive] = useState(0)

  const columns = arenas
    .map((_, i) => (i === active ? '4fr' : '1fr'))
    .join(' ')

  return (
    <section className='relative overflow-hidden px-6 py-16 sm:px-10 lg:px-16 lg:py-24'>
      <Reveal>
        <p className='eyebrow'>{t.eyebrow}</p>
        <h2 className='type-h2 mt-4 max-w-[680px]'>{t.title}</h2>
      </Reveal>

      <Reveal>
        <div
          className='mt-[60px] hidden gap-4 transition-[grid-template-columns] duration-500 ease-out lg:grid'
          style={{ gridTemplateColumns: columns }}
        >
          {arenas.map((arena, i) => {
            const isActive: boolean = i === active
            const at = t.arenas[arena.key]
            const cardClass = `group group/link focus-visible:ring-ink/30 relative block h-[460px] overflow-hidden rounded-lg transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 ${arena.fill}`
            const inner = (
              <>
                <Scene paint={arena.paint} active={isActive} />

                <div
                  className={`pointer-events-none absolute bottom-[14px] left-[42px] transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}
                  style={{
                    transformOrigin: 'left bottom',
                    transform: 'rotate(-90deg)',
                  }}
                >
                  <h3 className='text-ink font-heading text-[26px] font-light whitespace-nowrap xl:text-[30px]'>
                    {at.title}
                  </h3>
                </div>

                <div
                  className={`absolute bottom-6 left-6 flex w-[min(500px,calc(100%-48px))] flex-col gap-[14px] transition-opacity duration-300 ${
                    isActive
                      ? 'opacity-100 delay-200'
                      : 'pointer-events-none opacity-0'
                  }`}
                >
                  <p className='eyebrow text-ink/60'>{at.eyebrow}</p>
                  <h3 className='text-ink font-heading text-[28px] leading-[1.05] font-light xl:text-[36px]'>
                    {at.title}
                  </h3>
                  <p className='text-ink max-w-[480px] text-[16px] leading-[1.34] tracking-[-0.18px] xl:text-[17px]'>
                    {at.desc}
                  </p>
                  {arena.soon ? (
                    <span className='bg-ink/8 text-ink mt-1 w-fit rounded-full px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.14em] uppercase'>
                      {t.soon}
                    </span>
                  ) : (
                    <span className='text-ink -mt-1 inline-flex w-fit items-center gap-1.5 py-2 text-base font-medium tracking-[-0.12px]'>
                      <span className='link-underline'>{t.cta}</span>
                      <Arrow />
                    </span>
                  )}
                </div>
              </>
            )

            return arena.soon ? (
              <div
                key={arena.key}
                onMouseEnter={() => setActive(i)}
                className={`${cardClass} cursor-default`}
              >
                {inner}
              </div>
            ) : (
              <Link
                key={arena.key}
                href={arena.href}
                aria-label={at.title}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={cardClass}
              >
                {inner}
              </Link>
            )
          })}
        </div>
      </Reveal>

      <div className='mt-10 flex flex-col gap-4 lg:hidden'>
        {arenas.map((arena) => {
          const at = t.arenas[arena.key]
          const body = (
            <>
              <div className='pointer-events-none relative mb-4 h-[110px] opacity-40 mix-blend-multiply'>
                <Halftone
                  draw={arena.paint}
                  spacing={7}
                  className='absolute inset-0'
                />
              </div>
              <div className='relative flex flex-col gap-3'>
                <p className='eyebrow text-ink/60'>{at.eyebrow}</p>
                <h3 className='text-ink font-heading text-[24px] leading-[1.1] font-light'>
                  {at.title}
                </h3>
                <p className='text-ink text-[15px] leading-[1.4] tracking-[-0.18px]'>
                  {at.desc}
                </p>
                {arena.soon ? (
                  <span className='bg-ink/8 text-ink w-fit rounded-full px-3 py-1.5 font-mono text-[10px] font-medium tracking-[0.14em] uppercase'>
                    {t.soon}
                  </span>
                ) : (
                  <span className='text-ink inline-flex w-fit items-center gap-1.5 py-1 text-[15px] font-medium'>
                    <span className='link-underline'>{t.cta}</span>
                    <Arrow />
                  </span>
                )}
              </div>
            </>
          )
          return arena.soon ? (
            <div
              key={arena.key}
              className={`relative block overflow-hidden rounded-lg p-6 ${arena.fill}`}
            >
              {body}
            </div>
          ) : (
            <Reveal key={arena.key}>
              <Link
                href={arena.href}
                className={`group group/link relative block overflow-hidden rounded-lg p-6 ${arena.fill}`}
              >
                {body}
              </Link>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
