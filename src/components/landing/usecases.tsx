import Link from 'next/link'
import { CaseVisual, type CaseKind } from './case-visual'
import { Reveal } from './reveal'

type Tag = { label: string; dot: string }
type Case = {
  kind: CaseKind
  tags: Tag[]
  title: string
  desc: string
  href: string
  wide?: boolean
}

const cases: Case[] = [
  {
    kind: 'api',
    wide: true,
    tags: [
      { label: 'REST & GraphQL', dot: '#b8aef0' },
      { label: 'Modelagem de schema', dot: '#8b7be0' },
    ],
    title: 'APIs e modelagem de dados',
    desc: 'Projete endpoints, queries e schema sob as restrições reais de um cliente fictício. O tutor questiona cada decisão de contrato e normalização antes de aceitar a sua solução — você defende o design, não só o código.',
    href: '/onboarding',
  },
  {
    kind: 'ui',
    tags: [
      { label: 'Estado', dot: '#c1c1c0' },
      { label: 'Componentes', dot: '#a89ee8' },
      { label: 'Edge-cases', dot: '#7a6fd0' },
    ],
    title: 'Interfaces de verdade',
    desc: 'Estado, composição e os edge-cases que ninguém mostra no tutorial — sem colar a primeira resposta do chat.',
    href: '/onboarding',
  },
  {
    kind: 'algo',
    tags: [
      { label: 'Big-O', dot: '#b2afaa' },
      { label: 'Estruturas', dot: '#9f93e6' },
      { label: 'Trade-offs', dot: '#6E56CF' },
    ],
    title: 'Estruturas e complexidade',
    desc: 'Você justifica sua escolha de O(n) e a estrutura de dados antes de o tutor aceitar a solução.',
    href: '/onboarding',
  },
  {
    kind: 'debug',
    tags: [
      { label: 'Stack trace', dot: '#c9c5bf' },
      { label: 'Causa raiz', dot: '#9b8fe2' },
      { label: 'Hipóteses', dot: '#7263cc' },
    ],
    title: 'Caça ao bug guiada',
    desc: 'Perguntas que te levam à causa raiz, em vez de despejar o stack trace já resolvido.',
    href: '/onboarding',
  },
  {
    kind: 'sql',
    tags: [
      { label: 'JOINs', dot: '#b8aef0' },
      { label: 'Agregações', dot: '#8b7be0' },
      { label: 'Pipelines', dot: '#5f4fc4' },
    ],
    title: 'SQL e pipelines de dados',
    desc: 'Do JOIN ao agregado, raciocinando sobre o dado antes de escrever a query — e explicando o plano de execução.',
    href: '/onboarding',
  },
  {
    kind: 'cli',
    wide: true,
    tags: [
      { label: 'Shell', dot: '#c1bdb6' },
      { label: 'Scripts', dot: '#a89ee8' },
      { label: 'Automação', dot: '#6E56CF' },
    ],
    title: 'CLI e automação prática',
    desc: 'Pequenas ferramentas que resolvem problemas reais e cabem em uma sessão. O tutor te empurra a tratar erros, flags e casos de borda como um script de produção — não como um snippet de blog.',
    href: '/onboarding',
  },
]

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

function Card({ c }: { c: Case }) {
  return (
    <div className='flex h-full flex-col gap-[18px]'>
      <div
        className={
          'relative overflow-hidden rounded-[14px] ' +
          (c.wide ? 'h-[160px] lg:h-[194px]' : 'h-[260px] lg:h-[320px]')
        }
      >
        <CaseVisual kind={c.kind} />
      </div>

      <div className='flex flex-wrap gap-[10px] px-[14px]'>
        {c.tags.map((tag) => (
          <span
            key={tag.label}
            className='flex items-center gap-[7px] rounded-[20px] border border-[#dfe5e9] bg-white/60 py-[4px] pr-[9px] pl-[7px]'
          >
            <span
              className='size-[14px] shrink-0 rounded-full'
              style={{ backgroundColor: tag.dot }}
            />
            <span className='text-sm leading-[1.1] text-[#1b1916] md:text-[16px]'>
              {tag.label}
            </span>
          </span>
        ))}
      </div>

      <div className='flex flex-col gap-[14px] px-[14px]'>
        <h3 className='type-h3 lg:text-[36px]'>{c.title}</h3>
        <p className='text-[18px] leading-[1.34] tracking-[-0.18px] text-[#1b1916]'>
          {c.desc}
        </p>
        <Link
          href={c.href}
          className='group/link relative -mt-1 inline-flex w-fit items-center justify-start gap-1.5 py-2.5 text-base font-medium tracking-[-0.12px] text-[#1b1916] after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-200 hover:after:scale-x-100'
        >
          Saiba mais
          <Arrow />
        </Link>
      </div>
    </div>
  )
}

export function UseCases() {
  const [lead, ...rest] = cases

  return (
    <section className='px-6 py-16 sm:px-10 lg:px-16 lg:py-24'>
      <div className='mx-auto max-w-[860px] text-center'>
        <Reveal>
          <span className='text-[13px] font-semibold tracking-[0.08em] text-[#6b6478] uppercase'>
            Para todo tipo de desafio
          </span>
          <h2 className='type-h2 mt-4'>Um campo de treino, não um tutorial.</h2>
        </Reveal>
      </div>

      <div className='mt-12 flex flex-col gap-[40px] lg:mt-16'>
        <Reveal>
          <Card c={lead} />
        </Reveal>

        <div className='grid grid-cols-1 gap-[40px] lg:grid-cols-2'>
          {rest.map((c, i) => (
            <Reveal
              key={c.title}
              delay={(i % 2) * 0.08}
              className={c.wide ? 'lg:col-span-2' : undefined}
            >
              <Card c={c} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
