'use client'

import { useT } from '@/lib/i18n'

const copy = {
  en: {
    label: 'What you train here',
    topics: [
      'JavaScript',
      'TypeScript',
      'React',
      'APIs & REST',
      'Data modeling',
      'Algorithms',
      'System design',
      'Debugging',
      'Node.js',
    ],
  },
  pt: {
    label: 'O que você treina aqui',
    topics: [
      'JavaScript',
      'TypeScript',
      'React',
      'APIs & REST',
      'Modelagem de dados',
      'Algoritmos',
      'System design',
      'Debugging',
      'Node.js',
    ],
  },
}

function Row({ topics }: { topics: readonly string[] }) {
  return (
    <div className='flex shrink-0 items-center'>
      {topics.map((name) => (
        <span
          key={name}
          className='font-heading text-ink/30 hover:text-ink/70 px-8 text-xl font-medium tracking-tight whitespace-nowrap transition-colors duration-300 sm:px-10 sm:text-2xl'
        >
          {name}
        </span>
      ))}
    </div>
  )
}

export function LogoCloud() {
  const t = useT(copy)

  return (
    <section className='py-8'>
      <p className='eyebrow mb-6 text-center'>{t.label}</p>
      <div className='relative overflow-hidden'>
        <div className='from-card pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r to-transparent' />
        <div className='from-card pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l to-transparent' />
        <div className='animate-marquee flex w-max hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]'>
          <Row topics={t.topics} />
          <Row topics={t.topics} />
        </div>
      </div>
    </section>
  )
}
