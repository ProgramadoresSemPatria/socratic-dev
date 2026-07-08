'use client'

import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LOCALES = ['en', 'pt'] as const

export function LangToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  return (
    <div
      className={cn(
        'border-border flex items-center rounded-full border p-0.5 font-mono text-[11px]',
        className,
      )}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type='button'
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            'cursor-pointer rounded-full px-2.5 py-1 uppercase transition-colors duration-200',
            locale === l
              ? 'bg-ink text-background'
              : 'text-muted-foreground hover:text-ink',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
