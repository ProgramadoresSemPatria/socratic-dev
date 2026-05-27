'use client'

import type { RunResult } from '@/lib/runner/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, Loader2, Terminal, X, XCircle } from 'lucide-react'

export function RunTerminal({
  result,
  running,
  onClose,
}: {
  result: RunResult | null
  running: boolean
  onClose?: () => void
}) {
  const passed = result?.tests.filter((t) => t.passed).length ?? 0
  const total = result?.tests.length ?? 0

  return (
    <div className='flex h-[40%] min-h-[150px] shrink-0 flex-col border-t border-white/[0.06] bg-[#0a0a0c]'>
      <div className='flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 font-mono text-[11px] tracking-wider text-muted-foreground uppercase'>
        <span className='flex items-center gap-1.5'>
          <Terminal className='size-3.5' /> Terminal
        </span>
        {running ? (
          <span className='flex items-center gap-1.5 normal-case'>
            <Loader2 className='size-3 animate-spin' /> rodando…
          </span>
        ) : result ? (
          <span
            className={cn(
              'flex items-center gap-1.5 font-semibold normal-case',
              result.ok ? 'text-mint' : 'text-destructive-foreground',
            )}
          >
            {result.ok ? (
              <CheckCircle2 className='size-3.5' />
            ) : (
              <XCircle className='size-3.5' />
            )}
            {total > 0
              ? `${passed}/${total} testes`
              : result.error
                ? 'erro'
                : 'ok'}{' '}
            · {result.durationMs}ms
          </span>
        ) : null}
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed'>
        {!result && !running && (
          <p className='text-muted-foreground/60'>
            Clique em <span className='text-foreground/80'>Rodar</span> para
            executar e testar seu código.
          </p>
        )}
        {running && <p className='text-muted-foreground/60'>Executando…</p>}
        {result && (
          <>
            {result.logs.map((l, i) => (
              <div
                key={i}
                className={cn(
                  'whitespace-pre-wrap',
                  l.level === 'error'
                    ? 'text-destructive-foreground'
                    : l.level === 'warn'
                      ? 'text-warning-foreground'
                      : 'text-foreground/80',
                )}
              >
                {l.text}
              </div>
            ))}
            {result.error && (
              <div className='mt-1 whitespace-pre-wrap text-destructive-foreground'>
                ✕ {result.error}
              </div>
            )}
            {result.tests.length > 0 && (
              <div className='mt-3 space-y-1.5 border-t border-white/[0.06] pt-3'>
                {result.tests.map((t, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2',
                      t.passed ? 'text-mint' : 'text-destructive-foreground',
                    )}
                  >
                    {t.passed ? (
                      <CheckCircle2 className='mt-0.5 size-3.5 shrink-0' />
                    ) : (
                      <XCircle className='mt-0.5 size-3.5 shrink-0' />
                    )}
                    <span className='text-foreground/80'>
                      {t.name}
                      {!t.passed && t.message ? (
                        <span className='text-destructive-foreground'>
                          {' '}
                          — {t.message}
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
