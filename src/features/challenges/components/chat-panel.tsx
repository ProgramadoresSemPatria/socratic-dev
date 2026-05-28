'use client'

import { SOLVE_COST } from '@/features/hints/constants'
import type { ChatMsg } from '@/lib/ai/types'
import { cn } from '@/lib/utils'
import { Lightbulb, Send, Sparkles, Wand2 } from 'lucide-react'
import { motion } from 'motion/react'
import { FormattedText } from './formatted-text'

export function ChatPanel({
  messages,
  scrollRef,
  thinking,
  input,
  setInput,
  sendUser,
  askHint,
  hintsUsed,
  hintsRemaining,
  onSolve,
  onBuy,
}: {
  messages: ChatMsg[]
  scrollRef: React.RefObject<HTMLDivElement | null>
  thinking: boolean
  input: string
  setInput: (v: string) => void
  sendUser: () => void
  askHint: (level: 1 | 2 | 3) => void
  hintsUsed: number
  hintsRemaining: number | null
  onSolve: () => void
  onBuy: () => void
}) {
  const noHints = hintsRemaining !== null && hintsRemaining <= 0
  const cantSolve = hintsRemaining !== null && hintsRemaining < SOLVE_COST
  return (
    <>
      <div className='flex h-10 items-center justify-between border-b border-[#DFE5E9] bg-[#F7F9FA] px-4'>
        <div className='flex items-center gap-2'>
          <div className='grid size-6 place-items-center rounded-full bg-gradient-to-br from-iris to-mint text-[9px] font-bold text-white'>
            S
          </div>
          <div className='text-[12px] font-medium text-[#1b1916]'>
            Tutor Socrático
          </div>
        </div>
        <div className='font-mono text-[10px] text-[#6b6478]'>
          {hintsUsed} hint{hintsUsed === 1 ? '' : 's'} usado
          {hintsUsed === 1 ? '' : 's'}
        </div>
      </div>

      <div
        ref={scrollRef}
        className='min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-[13.5px]'
      >
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {m.role === 'user' ? (
              <div className='flex justify-end'>
                <div className='max-w-[85%] rounded-2xl rounded-br-md bg-[#1b1916] px-3.5 py-2 text-white'>
                  {m.text}
                </div>
              </div>
            ) : (
              <div className='flex gap-2'>
                <div className='grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-iris to-mint text-[9px] font-bold text-white'>
                  S
                </div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl rounded-bl-md border px-3.5 py-2 leading-relaxed text-[#2c2330]',
                    m.hintLevel
                      ? 'border-amber-400/40 bg-amber-50'
                      : 'border-iris/20 bg-iris/5',
                  )}
                >
                  {m.hintLevel && (
                    <div className='mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-amber-700 uppercase'>
                      <Lightbulb className='size-3' />
                      Hint nível {m.hintLevel}
                    </div>
                  )}
                  <FormattedText text={m.text} />
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {thinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex gap-2'
          >
            <div className='grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-iris to-mint text-[9px] font-bold text-white'>
              S
            </div>
            <div className='flex gap-1 rounded-2xl rounded-bl-md border border-iris/20 bg-iris/5 px-3.5 py-2'>
              <span className='size-1.5 animate-bounce rounded-full bg-iris' />
              <span className='size-1.5 animate-bounce rounded-full bg-iris [animation-delay:0.15s]' />
              <span className='size-1.5 animate-bounce rounded-full bg-iris [animation-delay:0.3s]' />
            </div>
          </motion.div>
        )}
      </div>

      <div className='border-t border-[#DFE5E9] px-3 pt-2 pb-1'>
        <div className='mb-1.5 flex items-center justify-between font-mono text-[10px] tracking-wider text-[#6b6478] uppercase'>
          <span>Preciso de uma pista</span>
          {hintsRemaining !== null && (
            <span className={cn(noHints && 'font-semibold text-red-500')}>
              {hintsRemaining} restantes
            </span>
          )}
        </div>
        <div className='flex gap-1.5'>
          <HintBtn level={1} disabled={noHints} onClick={() => askHint(1)}>
            Vago
          </HintBtn>
          <HintBtn level={2} disabled={noHints} onClick={() => askHint(2)}>
            Médio
          </HintBtn>
          <HintBtn level={3} disabled={noHints} onClick={() => askHint(3)}>
            Quase direto
          </HintBtn>
        </div>
        <div className='mt-1.5'>
          {noHints ? (
            <button
              onClick={onBuy}
              className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-iris/30 bg-iris/10 px-2.5 py-1.5 text-[11px] font-medium text-iris transition-colors hover:bg-iris/15'
            >
              <Sparkles className='size-3' /> Comprar +10 hints
            </button>
          ) : (
            <button
              onClick={onSolve}
              disabled={cantSolve}
              title='Revela a solução completa — último recurso'
              className='flex w-full cursor-pointer items-center gap-1.5 rounded-lg border border-[#DFE5E9] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#1b1916] transition-colors hover:border-iris/40 hover:bg-iris/5 disabled:opacity-40'
            >
              <Wand2 className='size-3 text-iris' /> Resolver pra mim
              <span className='ml-auto font-mono text-[9px] text-[#6b6478]'>
                −{SOLVE_COST} hints
              </span>
            </button>
          )}
        </div>
      </div>

      <div className='border-t border-[#DFE5E9] p-3'>
        <div className='flex items-end gap-2'>
          <div className='flex-1 rounded-xl border border-[#DFE5E9] bg-white transition-colors focus-within:border-primary/40'>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendUser()
                }
              }}
              placeholder='Pense primeiro. Depois pergunte...'
              rows={2}
              className='w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] text-[#1b1916] outline-none placeholder:text-[#6b6478]'
            />
          </div>
          <button
            onClick={sendUser}
            disabled={!input.trim() || thinking}
            className='grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40'
          >
            <Send className='size-3.5' />
          </button>
        </div>
        <div className='mt-2 px-1 font-mono text-[10px] text-[#6b6478]'>
          enter para enviar · shift+enter quebra linha
        </div>
      </div>
    </>
  )
}

function HintBtn({
  level,
  onClick,
  disabled,
  children,
}: {
  level: 1 | 2 | 3
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const cost = level * 4
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className='group flex-1 cursor-pointer rounded-lg border border-[#DFE5E9] bg-white px-2.5 py-1.5 text-left transition-colors hover:border-amber-400/50 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40'
    >
      <div className='flex items-center gap-1 text-[11px] font-medium text-[#1b1916]'>
        <Lightbulb className='size-3 text-amber-500' />
        {children}
      </div>
      <div className='mt-0.5 font-mono text-[9px] text-[#6b6478]'>
        -{cost} pts indep.
      </div>
    </button>
  )
}
