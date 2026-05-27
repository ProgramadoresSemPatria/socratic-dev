'use client'

import { cn } from '@/lib/utils'

interface BackdropProps {
  className?: string
  variant?: 'default' | 'subtle' | 'intense'
}

export function Backdrop({ className, variant = 'default' }: BackdropProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        className,
      )}
      aria-hidden
    >
      {/* Grid */}
      <div className='grid-pattern mask-fade-b absolute inset-0 opacity-[0.6]' />

      {/* Soft aurora mesh — toned down for a light, encord-like canvas */}
      <div
        className={cn(
          'absolute -top-40 left-1/2 size-[800px] -translate-x-1/2 animate-aurora rounded-full blur-3xl',
          variant === 'subtle' && 'opacity-25',
          variant === 'default' && 'opacity-40',
          variant === 'intense' && 'opacity-55',
        )}
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.55 0.24 285 / 0.18), transparent 60%)',
        }}
      />
      <div
        className={cn(
          'absolute top-1/3 -right-40 size-[600px] animate-aurora rounded-full blur-3xl',
          variant === 'subtle' && 'opacity-20',
          variant === 'default' && 'opacity-30',
          variant === 'intense' && 'opacity-45',
        )}
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.56 0.22 322 / 0.14), transparent 60%)',
          animationDelay: '-6s',
        }}
      />
      <div
        className={cn(
          'absolute bottom-0 -left-32 size-[500px] animate-aurora rounded-full blur-3xl',
          variant === 'subtle' && 'opacity-15',
          variant === 'default' && 'opacity-25',
          variant === 'intense' && 'opacity-40',
        )}
        style={{
          background:
            'radial-gradient(circle at center, oklch(0.5 0.26 292 / 0.12), transparent 60%)',
          animationDelay: '-12s',
        }}
      />
    </div>
  )
}
