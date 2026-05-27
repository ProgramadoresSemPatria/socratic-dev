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
    <div className='flex h-[40%] min-h-[150px] shrink-0 flex-col border-t border-white/[0.06] bg-[#0a0a0c] text-zinc-200'>
      <div className='flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 font-mono text-[11px] tracking-wider text-zinc-400 uppercase'>
        <span className='flex items-center gap-1.5'>
          <Terminal className='size-3.5' /> Terminal
        </span>
        <div className='flex items-center gap-3'>
          {running ? (
            <span className='flex items-center gap-1.5 normal-case text-zinc-400'>
              <Loader2 className='size-3 animate-spin' /> rodando…
            </span>
          ) : result ? (
            <span
              className={cn(
                'flex items-center gap-1.5 font-semibold normal-case',
                result.ok ? 'text-emerald-400' : 'text-red-400',
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
          {onClose && (
            <button
              type='button'
              onClick={onClose}
              aria-label='Fechar terminal'
              className='-mr-1 grid size-6 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white'
            >
              <X className='size-3.5' />
            </button>
          )}
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-relaxed'>
        {!result && !running && (
          <p className='text-zinc-500'>
            Clique em <span className='text-zinc-200'>Rodar</span> para executar
            e testar seu código.
          </p>
        )}
        {running && <p className='text-zinc-500'>Executando…</p>}
        {result && (
          <>
            {result.logs.map((l, i) => (
              <div
                key={i}
                className={cn(
                  'whitespace-pre-wrap',
                  l.level === 'error'
                    ? 'text-red-400'
                    : l.level === 'warn'
                      ? 'text-amber-400'
                      : 'text-zinc-300',
                )}
              >
                {l.text}
              </div>
            ))}
            {result.error && (
              <div className='mt-1 whitespace-pre-wrap text-red-400'>
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
                      t.passed ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {t.passed ? (
                      <CheckCircle2 className='mt-0.5 size-3.5 shrink-0' />
                    ) : (
                      <XCircle className='mt-0.5 size-3.5 shrink-0' />
                    )}
                    <span className='text-zinc-200'>
                      {t.name}
                      {!t.passed && t.message ? (
                        <span className='text-red-400'> — {t.message}</span>
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
