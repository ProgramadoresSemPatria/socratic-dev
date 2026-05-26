'use client'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Brain,
  Building,
  CheckCircle2,
  ChevronRight,
  Clock,
  GitPullRequestArrow,
  Lightbulb,
  Loader2,
  PlayCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import * as React from 'react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
      <Loader2 className='mr-2 size-4 animate-spin' /> Carregando editor...
    </div>
  ),
})

const initialCode = `// Cliente: Padaria do Zé
// "Quero ver os produtos que vencem em 3 dias."

import { db } from './db'

export async function expiringProducts() {
  const products = await db.products.findAll()
  // como filtrar por data?

}
`

type ChatMsg = { role: 'user' | 'ai'; text: string; hintLevel?: 1 | 2 | 3 }

const initialChat: ChatMsg[] = [
  {
    role: 'ai',
    text: 'Olá. Antes de começar, leia o briefing à esquerda com calma. Que estrutura de dados o `findAll()` provavelmente devolve?',
  },
]

export default function ChallengePage() {
  const [code, setCode] = React.useState(initialCode)
  const [messages, setMessages] = React.useState<ChatMsg[]>(initialChat)
  const [input, setInput] = React.useState('')
  const [thinking, setThinking] = React.useState(false)
  const [independence, setIndependence] = React.useState(92)
  const [hintsUsed, setHintsUsed] = React.useState(0)
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, thinking])

  const aiQuestionBank: ChatMsg[] = [
    {
      role: 'ai',
      text: 'Interessante. E qual método de array filtra elementos com base numa condição? Pense em três opções e me diz qual encaixa.',
    },
    {
      role: 'ai',
      text: 'Boa. Agora, como você compara duas datas em JavaScript? Não preciso do código — me explica a lógica.',
    },
    {
      role: 'ai',
      text: 'Hmm. Se eu pegar `hoje` e somar 3 dias, como represento isso? O que `Date` te oferece?',
    },
    {
      role: 'ai',
      text: 'Você quase chegou. Releia seu código: a condição dentro do filter retorna true ou false? Mostra a expressão.',
    },
  ]

  function sendUser() {
    if (!input.trim() || thinking) return
    const text = input.trim()
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const next =
        aiQuestionBank[
          Math.min(
            messages.filter((m) => m.role === 'user').length,
            aiQuestionBank.length - 1,
          )
        ]
      setMessages((m) => [...m, next])
      setThinking(false)
    }, 1100)
  }

  function askHint(level: 1 | 2 | 3) {
    if (thinking) return
    setThinking(true)
    setHintsUsed((h) => h + 1)
    setIndependence((i) => Math.max(0, i - level * 4))
    const hints: Record<number, string> = {
      1: 'Hint nível 1 — Pense em métodos imutáveis de Array que retornam um subconjunto.',
      2: 'Hint nível 2 — `Array.prototype.filter()` recebe uma callback que retorna boolean. Você precisa comparar a propriedade `expiresAt` de cada produto com uma data futura.',
      3: 'Hint nível 3 — A condição é algo como `new Date(p.expiresAt) - Date.now() <= 3 * 24 * 60 * 60 * 1000`. Mas tente entender por que isso funciona antes de digitar.',
    }
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: 'ai', text: hints[level], hintLevel: level },
      ])
      setThinking(false)
    }, 700)
  }

  function submitReview() {
    setReviewOpen(true)
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  return (
    <div className='relative flex h-screen flex-1 flex-col overflow-hidden'>
      {/* Top bar */}
      <header className='z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-background/80 px-4 backdrop-blur-xl'>
        <div className='flex items-center gap-4'>
          <Logo />
          <div className='hidden items-center gap-2 border-l border-white/[0.06] pl-4 font-mono text-[12px] text-muted-foreground/80 sm:flex'>
            <Building className='size-3.5' />
            Padaria do Zé · API de estoque
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <div className='glass hidden h-8 items-center gap-2 rounded-full px-3 font-mono text-[12px] md:flex'>
            <Clock className='size-3.5 opacity-70' />
            <span>
              {minutes}:{seconds}
            </span>
          </div>
          <div className='glass hidden h-8 items-center gap-2 rounded-full px-3 text-[12px] md:flex'>
            <Brain className='size-3.5 opacity-70' />
            <span className='text-muted-foreground'>Independência:</span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                independence > 70
                  ? 'text-mint'
                  : independence > 40
                    ? 'text-warning-foreground'
                    : 'text-destructive-foreground',
              )}
            >
              {independence}%
            </span>
          </div>
          <Button
            size='sm'
            className='h-8 gap-1.5 rounded-full border-transparent bg-foreground pr-3 pl-3 text-background hover:bg-foreground/90'
            onClick={submitReview}
          >
            <GitPullRequestArrow className='size-3.5' />
            Submeter
          </Button>
        </div>
      </header>

      {/* Workspace */}
      <div className='grid min-h-0 flex-1 lg:grid-cols-[360px_1fr_400px]'>
        {/* Briefing panel */}
        <aside className='overflow-y-auto border-r border-white/[0.06] bg-card/30'>
          <BriefingPanel />
        </aside>

        {/* Editor */}
        <section className='relative flex min-h-0 flex-col'>
          <div className='flex h-10 items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-4'>
            <div className='flex items-center gap-2 font-mono text-[12px] text-muted-foreground/80'>
              <Code2Tag />
              <span>api-padaria.ts</span>
              <span className='ml-1 size-1 rounded-full bg-amber-400/70' />
              <span className='text-[11px] text-amber-400/70'>unsaved</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Button
                size='xs'
                variant='ghost'
                className='gap-1.5 rounded-md text-muted-foreground hover:text-foreground'
              >
                <PlayCircle className='size-3.5' /> Rodar
              </Button>
            </div>
          </div>
          <div className='relative min-h-0 flex-1'>
            <MonacoEditor
              height='100%'
              defaultLanguage='typescript'
              value={code}
              onChange={(v) => setCode(v ?? '')}
              theme='vs-dark'
              options={{
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
                fontLigatures: true,
                minimap: { enabled: false },
                padding: { top: 20, bottom: 20 },
                scrollBeyondLastLine: false,
                lineNumbersMinChars: 3,
                renderLineHighlight: 'none',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                tabSize: 2,
              }}
            />
          </div>
        </section>

        {/* Chat */}
        <aside className='flex min-h-0 flex-col border-l border-white/[0.06] bg-card/30'>
          <ChatPanel
            messages={messages}
            scrollRef={scrollRef}
            thinking={thinking}
            input={input}
            setInput={setInput}
            sendUser={sendUser}
            askHint={askHint}
            hintsUsed={hintsUsed}
          />
        </aside>
      </div>

      <AnimatePresence>
        {reviewOpen && (
          <ReviewModal
            independence={independence}
            hintsUsed={hintsUsed}
            onClose={() => setReviewOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Code2Tag() {
  return (
    <span className='grid size-4 place-items-center rounded border border-iris/30 bg-iris/20 text-[8px] font-bold text-iris'>
      TS
    </span>
  )
}

function BriefingPanel() {
  return (
    <div className='p-6'>
      <div className='glass mb-5 inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase'>
        <Building className='size-3' />
        Briefing do cliente
      </div>

      <h2 className='mb-3 font-heading text-2xl leading-tight font-semibold tracking-tight'>
        API de controle de estoque para a Padaria do Zé
      </h2>

      <div className='mb-6 flex items-center gap-2 font-mono text-[11px] text-muted-foreground/70'>
        <span className='rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5'>
          TypeScript
        </span>
        <span className='rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5'>
          Júnior
        </span>
        <span className='rounded-full border border-mint/20 bg-mint/10 px-2 py-0.5 text-mint'>
          ~25min
        </span>
      </div>

      <div className='space-y-4 text-sm leading-relaxed'>
        <p className='text-foreground/90'>
          Seu Zé tem uma padaria de bairro. Hoje, joga pão fora todo dia porque
          esquece o que está perto do vencimento.
        </p>
        <p className='text-muted-foreground'>
          Ele te pediu uma função que retorne os produtos que{' '}
          <span className='text-foreground'>vencem em até 3 dias</span> a partir
          de hoje. Só isso. Sem frontend, sem nada chique.
        </p>

        <div className='mt-6'>
          <div className='mb-2 font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
            Restrições
          </div>
          <ul className='space-y-1.5 text-[13px] text-foreground/90'>
            <Constraint>Use SQLite (já configurado no `./db`)</Constraint>
            <Constraint>
              Função deve ser pura — sem efeitos colaterais
            </Constraint>
            <Constraint>Retorne o array vazio se não houver itens</Constraint>
            <Constraint>Não importe libs de data (use só Date)</Constraint>
          </ul>
        </div>

        <div className='mt-6'>
          <div className='mb-2 font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase'>
            Modelo
          </div>
          <pre className='overflow-x-auto rounded-xl border border-white/[0.06] bg-code p-3 font-mono text-[12px] leading-relaxed text-foreground/90'>
            {`type Product = {
  id: string
  name: string
  expiresAt: string  // ISO date
  quantity: number
}`}
          </pre>
        </div>

        <div className='mt-6 rounded-xl border border-iris/20 bg-iris/5 p-4'>
          <div className='mb-1.5 flex items-center gap-2 font-mono text-[11px] tracking-wider text-iris uppercase'>
            <Sparkles className='size-3.5' />
            Regra da casa
          </div>
          <p className='text-[13px] leading-relaxed text-foreground/85'>
            O tutor não vai te dar a resposta. Ele faz perguntas. Se você quiser
            um hint direto, pague em pontos de independência.
          </p>
        </div>
      </div>
    </div>
  )
}

function Constraint({ children }: { children: React.ReactNode }) {
  return (
    <li className='flex gap-2.5'>
      <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-mint' />
      <span>{children}</span>
    </li>
  )
}

function ChatPanel({
  messages,
  scrollRef,
  thinking,
  input,
  setInput,
  sendUser,
  askHint,
  hintsUsed,
}: {
  messages: ChatMsg[]
  scrollRef: React.RefObject<HTMLDivElement | null>
  thinking: boolean
  input: string
  setInput: (v: string) => void
  sendUser: () => void
  askHint: (level: 1 | 2 | 3) => void
  hintsUsed: number
}) {
  return (
    <>
      <div className='flex h-10 items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-4'>
        <div className='flex items-center gap-2'>
          <div className='grid size-6 place-items-center rounded-full bg-gradient-to-br from-iris to-mint text-[9px] font-bold text-background'>
            S
          </div>
          <div className='text-[12px] font-medium'>Tutor Socrático</div>
        </div>
        <div className='font-mono text-[10px] text-muted-foreground/70'>
          {hintsUsed} hint{hintsUsed === 1 ? '' : 's'} usado
          {hintsUsed === 1 ? '' : 's'}
        </div>
      </div>

      <div
        ref={scrollRef}
        className='flex-1 space-y-3 overflow-y-auto p-4 text-[13.5px]'
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
                <div className='max-w-[85%] rounded-2xl rounded-br-md bg-foreground/10 px-3.5 py-2 text-foreground/95'>
                  {m.text}
                </div>
              </div>
            ) : (
              <div className='flex gap-2'>
                <div className='grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-iris to-mint text-[9px] font-bold text-background'>
                  S
                </div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 leading-relaxed',
                    m.hintLevel
                      ? 'border border-warning/20 bg-warning/10 text-foreground/95'
                      : 'border border-iris/15 bg-gradient-to-br from-iris/10 via-violet/5 to-mint/5 text-foreground/95',
                  )}
                >
                  {m.hintLevel && (
                    <div className='mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-warning-foreground uppercase'>
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
            <div className='grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-iris to-mint text-[9px] font-bold text-background'>
              S
            </div>
            <div className='flex gap-1 rounded-2xl rounded-bl-md border border-iris/15 bg-iris/10 px-3.5 py-2'>
              <span className='size-1.5 animate-bounce rounded-full bg-iris' />
              <span className='size-1.5 animate-bounce rounded-full bg-iris [animation-delay:0.15s]' />
              <span className='size-1.5 animate-bounce rounded-full bg-iris [animation-delay:0.3s]' />
            </div>
          </motion.div>
        )}
      </div>

      {/* Hint shelf */}
      <div className='border-t border-white/[0.04] px-3 pt-2 pb-1'>
        <div className='mb-1.5 font-mono text-[10px] tracking-wider text-muted-foreground/60 uppercase'>
          Preciso de uma pista
        </div>
        <div className='flex gap-1.5'>
          <HintBtn level={1} onClick={() => askHint(1)}>
            Vago
          </HintBtn>
          <HintBtn level={2} onClick={() => askHint(2)}>
            Médio
          </HintBtn>
          <HintBtn level={3} onClick={() => askHint(3)}>
            Quase direto
          </HintBtn>
        </div>
      </div>

      {/* Input */}
      <div className='border-t border-white/[0.06] p-3'>
        <div className='flex items-end gap-2'>
          <div className='flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] transition-colors focus-within:border-iris/40'>
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
              className='w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground/50'
            />
          </div>
          <button
            onClick={sendUser}
            disabled={!input.trim() || thinking}
            className='grid size-10 shrink-0 place-items-center rounded-xl bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:opacity-40'
          >
            <Send className='size-3.5' />
          </button>
        </div>
        <div className='mt-2 px-1 font-mono text-[10px] text-muted-foreground/50'>
          enter para enviar · shift+enter quebra linha
        </div>
      </div>
    </>
  )
}

function HintBtn({
  level,
  onClick,
  children,
}: {
  level: 1 | 2 | 3
  onClick: () => void
  children: React.ReactNode
}) {
  const cost = level * 4
  return (
    <button
      onClick={onClick}
      className='group flex-1 rounded-lg border border-white/[0.05] bg-white/[0.025] px-2.5 py-1.5 text-left transition-all hover:border-warning/30 hover:bg-warning/5'
    >
      <div className='flex items-center gap-1 text-[11px] font-medium'>
        <Lightbulb className='size-3 text-warning' />
        {children}
      </div>
      <div className='mt-0.5 font-mono text-[9px] text-muted-foreground/60'>
        -{cost} pts indep.
      </div>
    </button>
  )
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') ? (
          <code
            key={i}
            className='rounded bg-iris/5 px-1 py-0.5 font-mono text-[12.5px] text-iris'
          >
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

function ReviewModal({
  independence,
  hintsUsed,
  onClose,
}: {
  independence: number
  hintsUsed: number
  onClose: () => void
}) {
  const questions = [
    {
      q: 'Você usou `findAll()` e depois filtrou em memória. Em prod, com 100k produtos, isso escala?',
      hint: 'Pense em como o SQL faria isso direto no banco.',
    },
    {
      q: 'Sua condição compara datas com `>`. Para datas ISO string, isso é confiável? Em todos os fusos?',
      hint: 'Tente com `2026-01-01T23:00:00Z` vs `2026-01-02T01:00:00-03:00`.',
    },
    {
      q: 'Você retornou todos os campos do produto. O cliente disse que precisa de quais?',
      hint: 'Releia o briefing. Menos é mais.',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 p-4 backdrop-blur-xl'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className='border-gradient noise relative my-8 w-full max-w-2xl overflow-hidden rounded-3xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='absolute top-4 right-4 z-10'>
          <button
            onClick={onClose}
            className='grid size-8 place-items-center rounded-full border border-white/[0.08] bg-white/[0.05] transition-colors hover:bg-white/[0.1]'
          >
            <X className='size-4' />
          </button>
        </div>

        <div className='px-8 pt-10 pb-6'>
          <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-iris/20 bg-iris/10 px-3 py-1 font-mono text-[11px] text-iris'>
            <GitPullRequestArrow className='size-3' />
            Code Review Socrático
          </div>
          <h2 className='mb-2 font-heading text-3xl leading-tight font-semibold tracking-[-0.02em]'>
            Você submeteu. Agora vamos{' '}
            <span className='text-gradient font-serif font-normal italic'>
              defender
            </span>
            .
          </h2>
          <p className='text-muted-foreground'>
            Três perguntas. Pra cada uma, escreva sua resposta antes de virar a
            pista.
          </p>
        </div>

        <div className='space-y-3 px-8 pb-6'>
          {questions.map((q, i) => (
            <ReviewQuestion key={i} index={i + 1} {...q} />
          ))}
        </div>

        <div className='border-t border-white/[0.06] bg-white/[0.015] px-8 py-6'>
          <div className='mb-5 grid grid-cols-3 gap-3'>
            <Metric
              label='Independência'
              value={`${independence}%`}
              accent='mint'
            />
            <Metric label='Hints usados' value={String(hintsUsed)} />
            <Metric
              label='Conceitos novos'
              value='filter · Date'
              accent='iris'
            />
          </div>
          <div className='flex gap-2'>
            <Button
              size='lg'
              variant='ghost'
              onClick={onClose}
              className='flex-1 rounded-full'
            >
              Revisar de novo
            </Button>
            <Button
              size='lg'
              className='flex-1 rounded-full border-transparent bg-foreground text-background hover:bg-foreground/90'
              render={<Link href='/dashboard' />}
            >
              Ver progresso <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ReviewQuestion({
  index,
  q,
  hint,
}: {
  index: number
  q: string
  hint: string
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className='glass rounded-2xl p-4'>
      <div className='flex gap-3'>
        <div className='grid size-6 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] font-mono text-[11px] text-muted-foreground'>
          {index}
        </div>
        <div className='flex-1'>
          <p className='text-[14px] leading-relaxed text-foreground/95'>
            <FormattedText text={q} />
          </p>
          <button
            onClick={() => setOpen((v) => !v)}
            className='mt-2 font-mono text-[11px] text-iris/80 transition-colors hover:text-iris'
          >
            {open ? 'esconder dica' : 'preciso de uma dica →'}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='overflow-hidden'
              >
                <div className='mt-2 text-[13px] text-muted-foreground italic'>
                  <FormattedText text={hint} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'mint' | 'iris'
}) {
  return (
    <div className='rounded-xl border border-white/[0.05] bg-white/[0.025] p-3'>
      <div className='mb-1 font-mono text-[10px] tracking-wider text-muted-foreground/60 uppercase'>
        {label}
      </div>
      <div
        className={cn(
          'font-heading text-lg font-semibold tabular-nums',
          accent === 'mint' && 'text-mint',
          accent === 'iris' && 'text-iris',
        )}
      >
        {value}
      </div>
    </div>
  )
}
