'use client'

import { BriefingPanel } from '@/components/challenge/briefing-panel'
import { ChatPanel } from '@/components/challenge/chat-panel'
import { ReactPreview } from '@/components/challenge/react-preview'
import { ReviewModal } from '@/components/challenge/review-modal'
import { RunTerminal } from '@/components/challenge/run-terminal'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  challengeIntro,
  challengeLanguage,
  starterCode,
  type Challenge,
} from '@/lib/challenge'
import { apiFetch } from '@/lib/api/client'
import { runCode } from '@/lib/runner/run-code'
import type { RunnerLanguage, RunResult } from '@/lib/runner/types'
import { useSocraticSession } from '@/lib/session/use-socratic-session'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  Brain,
  Building,
  Clock,
  GitPullRequestArrow,
  Loader2,
  PlayCircle,
  Terminal,
} from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import dynamic from 'next/dynamic'
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

const POST = { method: 'POST', headers: { 'content-type': 'application/json' } }

export default function ChallengePage() {
  const router = useRouter()
  const [challenge, setChallenge] = React.useState<Challenge | null>(null)

  const s = useSocraticSession<string>({
    challenge: challenge ? { id: challenge.id } : null,
    initialWork: challenge ? starterCode(challenge) : '',
    initialMessages: challenge
      ? [{ role: 'ai', text: challengeIntro(challenge) }]
      : [],
  })

  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [review, setReview] = React.useState<string | null>(null)
  const [reviewing, setReviewing] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const [result, setResult] = React.useState<RunResult | null>(null)
  const [showPanel, setShowPanel] = React.useState(false)
  const [submitTests, setSubmitTests] = React.useState<{
    passed: number
    total: number
  } | null>(null)

  const language: RunnerLanguage = challenge
    ? challengeLanguage(challenge.stack)
    : 'ts'

  React.useEffect(() => {
    if (!s.authLoading && !s.user) router.replace('/login?next=/challenge')
  }, [s.authLoading, s.user, router])

  React.useEffect(() => {
    if (!s.user) return
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
      if (active && data) setChallenge(data as unknown as Challenge)
    })()
    return () => {
      active = false
    }
  }, [s.user])

  async function sendUser() {
    if (!s.input.trim() || s.thinking || !challenge) return
    const text = s.input.trim()
    const next = [...s.messages, { role: 'user' as const, text }]
    s.setMessages(next)
    s.setInput('')
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: JSON.stringify({
          mode: 'reply',
          messages: next,
          code: s.work,
          title: challenge.title,
          briefing: challenge.client_briefing,
        }),
      })
      const data = await res.json()
      s.pushMessage({
        role: 'ai',
        text: data.text || data.error || 'Não consegui responder agora.',
      })
    } finally {
      s.setThinking(false)
    }
  }

  async function askHint(level: 1 | 2 | 3) {
    if (s.thinking || !challenge) return
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: JSON.stringify({
          mode: 'hint',
          hintLevel: level,
          session_id: s.sessionId,
          messages: s.messages,
          code: s.work,
          title: challenge.title,
          briefing: challenge.client_briefing,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        s.pushMessage({ role: 'ai', text: data.error || 'Hint indisponível.' })
        return
      }
      s.applyHint(level)
      s.syncRemaining(data.remaining)
      s.pushMessage({
        role: 'ai',
        text: data.text || 'Hint indisponível.',
        hintLevel: level,
      })
    } finally {
      s.setThinking(false)
    }
  }

  async function askSolve() {
    if (s.thinking || !challenge) return
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/solve', {
        ...POST,
        body: JSON.stringify({
          kind: 'code',
          session_id: s.sessionId,
          title: challenge.title,
          briefing: challenge.client_briefing,
          work: s.work,
        }),
      })
      const data = await res.json()
      if (res.ok && data.code) {
        s.spendSolve()
        s.syncRemaining(data.remaining)
        s.setWork(data.code)
        s.pushMessage({
          role: 'ai',
          text: 'Apliquei a solução no editor. Rode os testes e estude por que ela funciona.',
        })
      } else {
        s.pushMessage({
          role: 'ai',
          text: data.error || 'Não consegui resolver agora.',
        })
      }
    } finally {
      s.setThinking(false)
    }
  }

  async function submitReview() {
    if (!challenge || reviewing) return
    setReviewOpen(true)
    setReviewing(true)
    setReview(null)
    setSubmitTests(null)

    const code = s.work
    const touched =
      code.trim().length > 0 && code.trim() !== starterCode(challenge).trim()
    if (!touched) {
      setReview(
        'Você ainda não escreveu uma solução — implemente algo no editor e submeta de novo.',
      )
      setReviewing(false)
      return
    }

    let passed = 0
    let total = 0
    if (challenge.tests_source && language !== 'react') {
      const r = await runCode(
        { code, language, testsSource: challenge.tests_source },
        { timeoutMs: 5000 },
      )
      total = r.tests.length
      passed = r.tests.filter((t) => t.passed).length
      setResult(r)
    }
    setSubmitTests({ passed, total })
    const solved = total === 0 || passed === total

    try {
      const res = await apiFetch('/api/review', {
        ...POST,
        body: JSON.stringify({
          code,
          title: challenge.title,
          briefing: challenge.client_briefing,
          tests_passed: passed,
          tests_total: total,
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      setReview(data.review || data.error || 'Não foi possível gerar o review.')
      if (solved) s.complete(s.elapsed)
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
      { code: s.work, language, testsSource: challenge.tests_source },
      { timeoutMs: 5000 },
    )
    setResult(r)
    setRunning(false)
  }

  const minutes = String(Math.floor(s.elapsed / 60)).padStart(2, '0')
  const seconds = String(s.elapsed % 60).padStart(2, '0')

  if (s.authLoading || (!challenge && s.user)) {
    return <ChallengeSkeleton />
  }
  if (!s.user || !challenge) return null

  return (
    <div className='relative flex h-screen flex-col overflow-hidden'>
      <header className='z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#DFE5E9] bg-white/80 px-4 backdrop-blur-xl'>
        <div className='flex items-center gap-4'>
          <Logo />
          <div className='hidden items-center gap-2 border-l border-[#DFE5E9] pl-4 font-mono text-[12px] text-[#6b6478] sm:flex'>
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
                s.independence > 70
                  ? 'text-mint'
                  : s.independence > 40
                    ? 'text-warning-foreground'
                    : 'text-destructive-foreground',
              )}
            >
              {s.independence}%
            </span>
          </div>
          <Button
            size='sm'
            disabled={reviewing}
            className='h-8 gap-1.5 rounded-lg border-transparent bg-primary pr-3 pl-3 text-primary-foreground hover:bg-primary/90'
            onClick={submitReview}
          >
            <GitPullRequestArrow className='size-3.5' />
            Submeter
          </Button>
        </div>
      </header>

      <div className='grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[360px_1fr_400px] lg:grid-rows-[minmax(0,1fr)]'>
        <aside className='min-h-0 overflow-y-auto border-r border-[#DFE5E9] bg-[#F7F9FA]'>
          <BriefingPanel challenge={challenge} />
        </aside>

        <section className='relative flex min-h-0 flex-col'>
          <div className='flex h-10 items-center justify-between border-b border-[#DFE5E9] bg-[#F7F9FA] px-4'>
            <div className='flex items-center gap-2 font-mono text-[12px] text-[#6b6478]'>
              <Code2Tag language={language} />
              <span>solucao.{language === 'js' ? 'js' : 'ts'}</span>
              <span className='ml-1 size-1 rounded-full bg-amber-400/70' />
              <span className='text-[11px] text-amber-400/70'>unsaved</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => setShowPanel((v) => !v)}
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
              value={s.work}
              onChange={(v) => s.setWork(v ?? '')}
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
              <ReactPreview code={s.work} onClose={() => setShowPanel(false)} />
            ) : (
              <RunTerminal
                result={result}
                running={running}
                onClose={() => setShowPanel(false)}
              />
            ))}
        </section>

        <aside className='flex min-h-0 flex-col border-l border-[#DFE5E9] bg-[#F7F9FA]'>
          <ChatPanel
            messages={s.messages}
            scrollRef={s.scrollRef}
            thinking={s.thinking}
            input={s.input}
            setInput={s.setInput}
            sendUser={sendUser}
            askHint={askHint}
            hintsUsed={s.hintsUsed}
            hintsRemaining={s.hintsRemaining}
            onSolve={askSolve}
            onBuy={s.buyHints}
          />
        </aside>
      </div>

      <AnimatePresence>
        {reviewOpen && (
          <ReviewModal
            review={review}
            reviewing={reviewing}
            independence={s.independence}
            hintsUsed={s.hintsUsed}
            elapsed={s.elapsed}
            tests={submitTests}
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

function ChallengeSkeleton() {
  return (
    <div className='flex h-screen flex-1 flex-col overflow-hidden bg-white'>
      <header className='flex h-14 shrink-0 items-center justify-between border-b border-[#DFE5E9] px-4'>
        <Skeleton className='h-6 w-28' />
        <div className='flex items-center gap-2'>
          <Skeleton className='hidden h-8 w-20 rounded-full md:block' />
          <Skeleton className='h-8 w-24 rounded-full' />
        </div>
      </header>
      <div className='grid min-h-0 flex-1 lg:grid-cols-[360px_1fr_400px]'>
        <aside className='space-y-3 border-r border-[#DFE5E9] p-6'>
          <Skeleton className='h-5 w-40 rounded-full' />
          <Skeleton className='h-7 w-3/4' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='mt-4 h-24 w-full rounded-xl' />
        </aside>
        <section className='flex min-h-0 flex-col border-r border-[#DFE5E9]'>
          <div className='flex h-10 items-center justify-between border-b border-[#DFE5E9] px-4'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-20' />
          </div>
          <div className='flex-1 space-y-3 bg-[#0a0a0c] p-6'>
            <Skeleton className='h-4 w-1/2 bg-white/[0.06]' />
            <Skeleton className='h-4 w-2/3 bg-white/[0.06]' />
            <Skeleton className='h-4 w-1/3 bg-white/[0.06]' />
            <Skeleton className='h-4 w-3/5 bg-white/[0.06]' />
          </div>
        </section>
        <aside className='space-y-3 p-6'>
          <Skeleton className='h-16 w-full rounded-xl' />
          <Skeleton className='ml-auto h-12 w-3/4 rounded-xl' />
          <Skeleton className='h-12 w-2/3 rounded-xl' />
        </aside>
      </div>
    </div>
  )
}
