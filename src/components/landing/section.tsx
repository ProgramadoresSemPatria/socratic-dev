import { cn } from '@/lib/utils'
import * as React from 'react'

/**
 * Shared landing primitives that encode the encord-style design language:
 * generous vertical rhythm, an indigo eyebrow label, tight heading, and a
 * muted lead paragraph. Sections alternate white / light-gray backgrounds.
 */

export function Section({
  id,
  muted = false,
  className,
  children,
}: {
  id?: string
  muted?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative py-20 sm:py-28',
        muted && 'bg-muted/50',
        className,
      )}
    >
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>{children}</div>
    </section>
  )
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-[13px] font-semibold tracking-[0.08em] text-primary uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2
      className={cn(
        'font-heading text-3xl font-semibold tracking-[-0.025em] text-balance text-foreground sm:text-4xl md:text-[44px] md:leading-[1.05]',
        className,
      )}
    >
      {children}
    </h2>
  )
}

export function SectionLead({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'text-lg leading-relaxed text-balance text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  )
}
