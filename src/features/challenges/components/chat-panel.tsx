'use client'

import { Button } from '@/components/ui/button'
import { SOLVE_COST } from '@/features/hints/constants'
import type { ChatMsg } from '@/lib/ai/types'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Lightbulb, Loader2, Send, Sparkles, Wand2 } from 'lucide-react'
import { motion } from 'motion/react'
import { FormattedText } from './formatted-text'

const copy = {
  en: {
    tutorName: 'Socratic tutor',
    hintsUsed: (n: number) => `${n} hint${n === 1 ? '' : 's'} used`,
    hintLevel: (n: number) => `Hint level ${n}`,
    needHint: 'Need a hint',
    remaining: (n: number) => `${n} left`,
    hintVague: 'Vague',
    hintMedium: 'Medium',
    hintDirect: 'Almost direct',
    buyHints: 'Buy +10 hints',
    buySuccess: '+10 hints',
    buyFailed: 'Could not buy hints',
    solveTitle: 'Reveals the full solution (last resort)',
    solveForMe: 'Solve it for me',
    placeholder: 'Think first. Then ask...',
    sendLabel: 'Send message',
    inputHelp: 'enter to send · shift+enter for new line',
    hintCost: (cost: number) => `−${cost}`,
    hintCostTitle: (cost: number) => `-${cost} independence pts`,
  },
  pt: {
    tutorName: 'Tutor Socrático',
    hintsUsed: (n: number) =>
      `${n} hint${n === 1 ? '' : 's'} usado${n === 1 ? '' : 's'}`,
    hintLevel: (n: number) => `Hint nível ${n}`,
    needHint: 'Preciso de uma pista',
    remaining: (n: number) => `${n} restantes`,
    hintVague: 'Vago',
    hintMedium: 'Médio',
    hintDirect: 'Quase direto',
    buyHints: 'Comprar +10 hints',
    buySuccess: '+10 hints',
    buyFailed: 'Não foi possível comprar hints',
    solveTitle: 'Revela a solução completa (último recurso)',
    solveForMe: 'Resolver pra mim',
    placeholder: 'Pense primeiro. Depois pergunte...',
    sendLabel: 'Enviar mensagem',
    inputHelp: 'enter para enviar · shift+enter quebra linha',
    hintCost: (cost: number) => `−${cost}`,
    hintCostTitle: (cost: number) => `-${cost} pts de independência`,
  },
}

function TutorAvatar() {
  return (
    <div className='grid size-5 shrink-0 place-items-center rounded-full bg-pastel-lavender font-mono text-[10px] text-ink'>
      Σ
    </div>
  )
}

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
  buying,
  buyError,
  bought,
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
  buying?: boolean
  buyError?: string | null
  bought?: boolean
}) {
  const t = useT(copy)
  const noHints = hintsRemaining !== null && hintsRemaining <= 0
  const cantSolve = hintsRemaining !== null && hintsRemaining < SOLVE_COST
  return (
    <>
      <div className='flex h-10 items-center justify-between border-b border-border bg-muted px-4'>
        <div className='flex items-center gap-2'>
          <TutorAvatar />
          <div className='text-[12px] font-medium text-ink'>
            {t.tutorName}
          </div>
        </div>
        <div className='font-mono text-[10px] text-muted-foreground'>
          {t.hintsUsed(hintsUsed)}
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
                <div className='max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-background'>
                  {m.text}
                </div>
              </div>
            ) : (
              <div className='flex gap-2'>
                <TutorAvatar />
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 leading-relaxed text-aubergine',
                    m.hintLevel
                      ? 'border border-warning/40 bg-warning/10'
                      : 'bg-pastel-sage/60',
                  )}
                >
                  {m.hintLevel && (
                    <div className='mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-warning-foreground uppercase'>
                      <Lightbulb className='size-3' strokeWidth={1.5} />
                      {t.hintLevel(m.hintLevel)}
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
            <TutorAvatar />
            <div className='flex items-center gap-1 rounded-2xl rounded-bl-md bg-pastel-sage/60 px-3.5 py-3'>
              <span className='size-1.5 animate-bounce rounded-full bg-primary' />
              <span className='size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.15s]' />
              <span className='size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.3s]' />
            </div>
          </motion.div>
        )}
      </div>

      <div className='border-t border-border px-3 pt-2 pb-1'>
        <div className='mb-1.5 flex items-center justify-between font-mono text-[10px] tracking-wider text-muted-foreground uppercase'>
          <span>{t.needHint}</span>
          {hintsRemaining !== null && (
            <span
              className={cn(noHints && 'font-medium text-destructive-foreground')}
            >
              {t.remaining(hintsRemaining)}
            </span>
          )}
        </div>
        <div className='flex gap-1.5'>
          <HintBtn level={1} disabled={noHints} onClick={() => askHint(1)}>
            {t.hintVague}
          </HintBtn>
          <HintBtn level={2} disabled={noHints} onClick={() => askHint(2)}>
            {t.hintMedium}
          </HintBtn>
          <HintBtn level={3} disabled={noHints} onClick={() => askHint(3)}>
            {t.hintDirect}
          </HintBtn>
        </div>
        <div className='mt-1.5'>
          {noHints ? (
            <button
              onClick={onBuy}
              disabled={buying}
              className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-3 font-mono text-[10px] text-primary transition-colors duration-200 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60 lg:py-1.5'
            >
              {buying ? (
                <Loader2 className='size-3 animate-spin' strokeWidth={1.5} />
              ) : (
                <Sparkles className='size-3' strokeWidth={1.5} />
              )}{' '}
              {t.buyHints}
            </button>
          ) : (
            <button
              onClick={onSolve}
              disabled={cantSolve}
              title={t.solveTitle}
              className='flex w-full cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-3 font-mono text-[10px] text-ink transition-colors duration-200 hover:border-primary/30 hover:bg-primary/5 disabled:opacity-40 lg:py-1.5'
            >
              <Wand2 className='size-3 text-primary' strokeWidth={1.5} />{' '}
              {t.solveForMe}
              <span className='ml-auto text-muted-foreground'>
                −{SOLVE_COST} hints
              </span>
            </button>
          )}
          {buyError != null ? (
            <div className='mt-1.5 px-2 font-mono text-[10px] text-destructive'>
              {buyError || t.buyFailed}
            </div>
          ) : bought ? (
            <div className='mt-1.5 px-2 font-mono text-[10px] text-mint'>
              {t.buySuccess}
            </div>
          ) : null}
        </div>
      </div>

      <div className='border-t border-border p-3'>
        <div className='flex items-center gap-2'>
          <div className='flex flex-1 items-center rounded-full border border-border bg-card transition-colors duration-200 focus-within:border-primary/40'>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendUser()
                }
              }}
              placeholder={t.placeholder}
              rows={1}
              className='w-full resize-none bg-transparent px-4 py-2.5 text-[16px] text-ink outline-none placeholder:text-muted-foreground lg:text-[13.5px]'
            />
          </div>
          <Button
            size='icon-lg'
            onClick={sendUser}
            disabled={!input.trim() || thinking}
            aria-label={t.sendLabel}
            className='shrink-0'
          >
            <Send className='size-3.5' />
          </Button>
        </div>
        <div className='mt-2 hidden px-2 font-mono text-[10px] text-muted-foreground md:block'>
          {t.inputHelp}
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
  const t = useT(copy)
  const cost = level * 4
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={t.hintCostTitle(cost)}
      className='flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full border border-border px-2 py-3 font-mono text-[10px] text-ink transition-colors duration-200 hover:border-warning/50 hover:bg-warning/10 disabled:cursor-not-allowed disabled:opacity-40 lg:py-1.5'
    >
      <Lightbulb
        className='size-3 shrink-0 text-warning-foreground'
        strokeWidth={1.5}
      />
      <span className='truncate'>{children}</span>
      <span className='text-muted-foreground'>· {t.hintCost(cost)}</span>
    </button>
  )
}
