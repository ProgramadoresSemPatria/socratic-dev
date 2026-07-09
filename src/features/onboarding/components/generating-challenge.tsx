'use client'

import {
  Halftone,
  glyph,
  paintArchitecture,
} from '@/features/landing/components/halftone'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import * as React from 'react'

const paintBraces = glyph('{ }', 2)

const copy = {
  en: {
    eyebrow: 'Generating',
    title: 'Building your challenge.',
    messages: [
      'parsing your request…',
      'inventing a fictional client…',
      'writing the briefing…',
      'hiding the tests…',
      'calibrating difficulty to your level…',
    ],
    notePre:
      'Generating with the stack and level saved to your profile. Want to change them?',
    noteLink: 'Update your profile',
  },
  pt: {
    eyebrow: 'Gerando',
    title: 'Montando seu desafio.',
    messages: [
      'interpretando pedido…',
      'inventando cliente fictício…',
      'gerando briefing…',
      'escondendo testes…',
      'calibrando dificuldade pro seu nível…',
    ],
    notePre: 'Gerando com a stack e o nível salvos no seu perfil. Quer mudar?',
    noteLink: 'Ajuste no perfil',
  },
}

export function GeneratingChallenge({ design }: { design: boolean }) {
  const t = useT(copy)
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(
      () => setI((v) => Math.min(v + 1, t.messages.length - 1)),
      1700,
    )
    return () => clearInterval(timer)
  }, [t.messages.length])

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className='relative flex flex-1 items-center overflow-hidden'
    >
      <div className='pointer-events-none absolute inset-x-0 top-1/2 h-[420px] -translate-y-1/2 opacity-25 mix-blend-multiply dark:mix-blend-screen'>
        <Halftone
          draw={design ? paintArchitecture : paintBraces}
          ambient
          spacing={9}
        />
      </div>

      <div className='container-main relative w-full max-w-6xl pb-16'>
        <div className='max-w-md'>
          <div className='flex items-center gap-3'>
            <p className='eyebrow'>{t.eyebrow}</p>
            <Loader2 className='size-3.5 animate-spin text-muted-foreground' />
          </div>
          <h1 className='type-h2 mt-5'>{t.title}</h1>

          <div className='mt-10 space-y-3 font-mono text-[13px]'>
            {t.messages.slice(0, i + 1).map((m, idx) => (
              <motion.div
                key={m}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex items-center gap-3',
                  idx < i ? 'text-muted-foreground' : 'text-ink',
                )}
              >
                <span className='grid w-4 shrink-0 place-items-center'>
                  {idx < i ? (
                    <Check className='size-3.5 text-mint' />
                  ) : (
                    <Loader2 className='size-3.5 animate-spin text-primary' />
                  )}
                </span>
                <span>{m}</span>
              </motion.div>
            ))}
          </div>

          <div className='mt-14 border-t border-border pt-5 text-[12px] text-muted-foreground'>
            {t.notePre}{' '}
            <Link
              href='/profile'
              className='link-underline font-medium text-ink'
            >
              {t.noteLink}
            </Link>
            .
          </div>
        </div>
      </div>
    </motion.main>
  )
}
