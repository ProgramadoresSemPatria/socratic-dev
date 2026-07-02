'use client'

import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const copy = {
  en: {
    shortcut: {
      eyebrow: 'Shortcut',
      title: 'How you use AI today',
      steps: ['ask', 'AI spits it out', 'it works', 'forgot it'],
      footer: 'ship today · empty tomorrow',
    },
    retained: {
      eyebrow: 'Retained',
      title: 'How Socratic teaches you',
      steps: ['ask', 'why?', 'try it', 'got it'],
      footer: '+5 min of thinking · a career of returns',
    },
  },
  pt: {
    shortcut: {
      eyebrow: 'Atalho',
      title: 'Como você usa IA hoje',
      steps: ['pergunta', 'IA cospe', 'funciona', 'esqueci'],
      footer: 'ship hoje · vazio amanhã',
    },
    retained: {
      eyebrow: 'Retido',
      title: 'Como o Sócrates te ensina',
      steps: ['pergunta', 'por quê?', 'tenta', 'entendi'],
      footer: '+5 min de pensar · uma carreira de retorno',
    },
  },
}

export function StatementCanvas() {
  const t = useT(copy)
  return (
    <div className='mx-auto mt-14 grid w-full max-w-[880px] gap-4 px-4 text-left lg:mt-16 lg:grid-cols-2'>
      <ComparisonCard
        eyebrow={t.shortcut.eyebrow}
        title={t.shortcut.title}
        tone='stone'
        steps={t.shortcut.steps}
        footer={t.shortcut.footer}
      />
      <ComparisonCard
        eyebrow={t.retained.eyebrow}
        title={t.retained.title}
        tone='sage'
        steps={t.retained.steps}
        footer={t.retained.footer}
      />
    </div>
  )
}

function ComparisonCard({
  eyebrow,
  title,
  tone,
  steps,
  footer,
}: {
  eyebrow: string
  title: string
  tone: 'sand' | 'sage'
  steps: readonly string[]
  footer: string
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg p-7 sm:p-8',
        tone === 'sand' ? 'bg-pastel-sand' : 'bg-pastel-sage',
      )}
    >
      <p className='eyebrow mb-6'>{eyebrow}</p>
      <h3 className='type-h4 mb-8'>{title}</h3>
      <ol className='flex flex-col gap-3'>
        {steps.map((step, i) => (
          <li
            key={step}
            className='flex items-baseline gap-3 text-[15px] text-aubergine'
          >
            <span className='font-mono text-[11px] tracking-wider text-muted-foreground'>
              0{i + 1}
            </span>
            <span aria-hidden className='text-ink/40'>
              →
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className='mt-auto pt-8'>
        <p className='border-t border-ink/10 pt-4 font-mono text-[11px] tracking-wide text-muted-foreground'>
          {footer}
        </p>
      </div>
    </div>
  )
}
