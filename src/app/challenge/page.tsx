'use client'

import { ReactPreview } from '@/components/challenge/react-preview'
import { RunTerminal } from '@/components/challenge/run-terminal'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import type { ChatMsg } from '@/lib/ai/types'
import { useUser } from '@/lib/auth/use-user'
import { runCode } from '@/lib/runner/run-code'
import type { RunResult, RunnerLanguage } from '@/lib/runner/types'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  Brain,
  Building,
  ChevronRight,
  Clock,
  GitPullRequestArrow,
  Lightbulb,
  Loader2,
  PlayCircle,
  Send,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
      <Loader2 className='mr-2 size-4 animate-spin' /> Carregando editor...
    </div>
  ),
})

type Challenge = {
  id: string
  title: string
  description: string
  stack: string
  level: string
  client_briefing: string
  initial_code: string
  tests_source: string
  intro: string
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
}

export default function ChallengePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()

  const [challenge, setChallenge] = React.useState<Challenge | null>(null)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [code, setCode] = React.useState('')
  const [messages, setMessages] = React.useState<ChatMsg[]>([])
  const [input, setInput] = React.useState('')
  const [thinking, setThinking] = React.useState(false)
  const [independence, setIndependence] = React.useState(92)
  const [hintsUsed, setHintsUsed] = React.useState(0)
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [review, setReview] = React.useState<string | null>(null)
  const [reviewing, setReviewing] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [running, setRunning] = React.useState(false)
  const [result, setResult] = React.useState<RunResult | null>(null)
  const [showPanel, setShowPanel] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const language = (
    challenge?.stack === 'javascript' ? 'js' : 'ts'
  ) as RunnerLanguage

  // Auth guard
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/challenge')
    }
  }, [authLoading, user, router])

  // Load the challenge from the DB + open a session
  React.useEffect(() => {
    if (!user) return
    let active = true
    ;(async () => {
      const id =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('id')
          : null

      const query = supabase.from('challenges').select('*')
      const { data } = id
        ? await query.eq('id', id).single()
        : await query.order('created_at', { ascending: true }).limit(1).single()

      if (!active || !data) return
      const ch = data as unknown as Challenge
      setChallenge(ch)
      setCode(ch.initial_code || '')
      setMessages([
        {
          role: 'ai',
          text:
            ch.intro ||
            'Olá. Leia o briefing à esquerda e me diga: qual o primeiro passo pra resolver isso?',
        },
      ])

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, challenge_id: ch.id }),
      })
      if (active && res.ok) {
        const session = await res.json()
        setSessionId(session.id)
      }
    })()
    return () => {
      active = false
    }
  }, [user])

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

  async function sendUser() {
    if (!input.trim() || thinking || !challenge) return
    const text = input.trim()
    const next: ChatMsg[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    setThinking(true)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'reply',
          messages: next,
          code,
          title: challenge.title,
          briefing: challenge.client_briefing,
        }),
      })
      const data = await res.json()
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: data.text || data.error || 'Não consegui responder agora.',
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  async function askHint(level: 1 | 2 | 3) {
    if (thinking || !challenge) return
    setThinking(true)
    setHintsUsed((h) => h + 1)
    setIndependence((i) => Math.max(0, i - level * 4))
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'hint',
          hintLevel: level,
          messages,
          code,
          title: challenge.title,
          briefing: challenge.client_briefing,
        }),
      })
      const data = await res.json()
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: data.text || data.error || 'Hint indisponível.',
          hintLevel: level,
        },
      ])
      if (sessionId && user) {
        fetch('/api/hints', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: user.id,
            hint_level: level,
          }),
        }).catch(() => {})
      }
    } finally {
      setThinking(false)
    }
  }

  async function submitReview() {
    if (!challenge || reviewing) return
    setReviewOpen(true)
    setReviewing(true)
    setReview(null)
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code,
          title: challenge.title,
          briefing: challenge.client_briefing,
          session_id: sessionId,
          user_id: user?.id,
        }),
      })
      const data = await res.json()
      setReview(data.review || data.error || 'Não foi possível gerar o review.')
    } finally {
      setReviewing(false)
    }
  }

  async function run() {
    if (running || !challenge) return
    setShowPanel(true)
    if (language === 'react') return
    setRunning(true)
    setResult(null)
    const r = await runCode(
      { code, language, testsSource: challenge.tests_source },
      { timeoutMs: 5000 },
    )
    setResult(r)
    setRunning(false)
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  if (authLoading || (!challenge && user)) {
    return (
      <div className='grid h-screen flex-1 place-items-center bg-background text-sm text-muted-foreground'>
        <span className='flex items-center gap-2'>
          <Loader2 className='size-4 animate-spin' /> Carregando desafio…
        </span>
      </div>
    )
  }
  if (!user || !challenge) return null

  return (
    <div className='relative flex h-screen flex-1 flex-col overflow-hidden'>
      {/* Top bar */}
      <header className='z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-background/80 px-4 backdrop-blur-xl'>
        <div className='flex items-center gap-4'>
          <Logo />
          <div className='hidden items-center gap-2 border-l border-white/[0.06] pl-4 font-mono text-[12px] text-muted-foreground/80 sm:flex'>
            <Building className='size-3.5' />
            {challenge.title}
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
            disabled={reviewing}
            className='h-8 gap-1.5 rounded-full border-transparent bg-foreground pr-3 pl-3 text-background hover:bg-foreground/90'
            onClick={submitReview}
          >
            <GitPullRequestArrow className='size-3.5' />
            Submeter
          </Button>
        </div>
      </header>

      {/* Workspace */}
      <div className='grid min-h-0 flex-1 lg:grid-cols-[360px_1fr_400px] lg:grid-rows-[minmax(0,1fr)]'>
        {/* Briefing panel */}
        <aside className='overflow-y-auto border-r border-white/[0.06] bg-card/30'>
          <BriefingPanel challenge={challenge} />
        </aside>

        {/* Editor */}
        <section className='relative flex min-h-0 flex-col'>
          <div className='flex h-10 items-center justify-between border-b border-white/[0.06] bg-white/[0.015] px-4'>
            <div className='flex items-center gap-2 font-mono text-[12px] text-muted-foreground/80'>
              <Code2Tag language={language} />
              <span>solucao.{language === 'js' ? 'js' : 'ts'}</span>
              <span className='ml-1 size-1 rounded-full bg-amber-400/70' />
              <span className='text-[11px] text-amber-400/70'>unsaved</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => setShowPanel((s) => !s)}
                className={cn(
                  'gap-1.5 rounded-md hover:text-foreground',
                  showPanel ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <Terminal className='size-3.5' />
                {language === 'react' ? 'Preview' : 'Terminal'}
              </Button>
              <Button
                size='xs'
                variant='ghost'
                onClick={run}
                disabled={running}
                className='gap-1.5 rounded-md text-muted-foreground hover:text-foreground'
              >
                {running ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <PlayCircle className='size-3.5' />
                )}
                Rodar
              </Button>
            </div>
          </div>
          <div className='relative min-h-0 flex-1'>
            <MonacoEditor
              height='100%'
              language={language === 'js' ? 'javascript' : 'typescript'}
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
          {showPanel &&
            (language === 'react' ? (
              <ReactPreview code={code} onClose={() => setShowPanel(false)} />
            ) : (
              <RunTerminal
                result={result}
                running={running}
                onClose={() => setShowPanel(false)}
              />
            ))}
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
            review={review}
            reviewing={reviewing}
            independence={independence}
            hintsUsed={hintsUsed}
            onClose={() => setReviewOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Code2Tag({ language }: { language: RunnerLanguage }) {
  return (
    <span className='grid size-4 place-items-center rounded border border-iris/30 bg-iris/20 text-[8px] font-bold text-iris uppercase'>
      {language === 'js' ? 'JS' : 'TS'}
    </span>
  )
}

function BriefingPanel({ challenge }: { challenge: Challenge }) {
  return (
    <div className='p-6'>
      <div className='glass mb-5 inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase'>
        <Building className='size-3' />
        Briefing do cliente
      </div>

      <h2 className='mb-3 font-heading text-2xl leading-tight font-semibold tracking-tight'>
        {challenge.title}
      </h2>

      <div className='mb-6 flex items-center gap-2 font-mono text-[11px] text-muted-foreground/70'>
        <span className='rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5'>
          {challenge.stack === 'javascript' ? 'JavaScript' : 'TypeScript'}
        </span>
        <span className='rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5'>
          {LEVEL_LABEL[challenge.level] ?? challenge.level}
        </span>
      </div>

      <div className='space-y-4 text-sm leading-relaxed'>
        <p className='whitespace-pre-line text-foreground/90'>
          {challenge.client_briefing}
        </p>

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
  const parts = (text ?? '').split(/(`[^`]+`)/g)
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
          <span key={i} className='whitespace-pre-line'>
            {p}
          </span>
        ),
      )}
    </>
  )
}

function ReviewModal({
  review,
  reviewing,
  independence,
  hintsUsed,
  onClose,
}: {
  review: string | null
  reviewing: boolean
  independence: number
  hintsUsed: number
  onClose: () => void
}) {
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
            O tutor revisou seu código. Leia, responda mentalmente e melhore.
          </p>
        </div>

        <div className='px-8 pb-6'>
          {reviewing || !review ? (
            <div className='flex items-center gap-2 py-8 text-sm text-muted-foreground'>
              <Loader2 className='size-4 animate-spin' /> Gerando review…
            </div>
          ) : (
            <div className='glass rounded-2xl p-5 text-[14px] leading-relaxed text-foreground/95'>
              <FormattedText text={review} />
            </div>
          )}
        </div>

        <div className='border-t border-white/[0.06] bg-white/[0.015] px-8 py-6'>
          <div className='mb-5 grid grid-cols-2 gap-3'>
            <Metric
              label='Independência'
              value={`${independence}%`}
              accent='mint'
            />
            <Metric label='Hints usados' value={String(hintsUsed)} />
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
