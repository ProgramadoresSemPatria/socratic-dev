'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import * as React from 'react'

export function Tile({
  selected,
  onClick,
  className,
  children,
}: {
  selected: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-lg text-left transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft-lg',
        selected && 'ring-2 ring-primary',
        className,
      )}
    >
      {children}
      <span
        className={cn(
          'absolute top-3 right-3 grid size-6 place-items-center rounded-full transition-all duration-300',
          selected
            ? 'scale-100 bg-lime text-ink opacity-100 dark:text-background'
            : 'scale-75 opacity-0',
        )}
      >
        <Check className='size-3.5' />
      </span>
    </button>
  )
}

export function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className='border-l border-border pl-5 sm:pl-6'>
      <div className='font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase'>
        {label}
      </div>
      <div className='mt-3 font-heading text-3xl font-light tracking-tight text-ink sm:text-4xl'>
        {value}
      </div>
    </div>
  )
}
