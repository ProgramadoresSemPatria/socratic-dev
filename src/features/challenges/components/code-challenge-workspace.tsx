'use client'

import { Button } from '@/components/ui/button'
import type { RunnerLanguage } from '@/domain/stacks'
import { runCode } from '@/features/runner/run-code'
import type { RunResult } from '@/features/runner/types'
import { apiFetch } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import { useIsDark } from '@/lib/theme'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import {
  CheckCircle2,
  Loader2,
  PlayCircle,
  Terminal,
  XCircle,
} from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useSocraticSession } from '../hooks/use-socratic-session'
import type { Challenge } from '../types'
import { challengeIntro, challengeLanguage, starterCode } from '../utils'
import { BriefingPanel } from './briefing-panel'
import { ChallengeSkeleton } from './challenge-skeleton'
import { ChatPanel } from './chat-panel'
import { ReactPreview } from './react-preview'
import { ReviewModal } from './review-modal'
import { RunTerminal } from './run-terminal'
import { WorkspaceHeader } from './workspace-header'

const copy = {
  en: {
    loadingEditor: 'Loading editor...',
    replyFallback: "Couldn't respond right now.",
    hintUnavailable: 'Hint unavailable.',
    solutionApplied:
      'I applied the solution in the editor. Run the tests and study why it works.',
    teachDecisions: 'Key decisions:',
    teachThink: 'Now you, before moving on:',
    solveFallback: "Couldn't solve it right now.",
    noSolutionYet:
      "You haven't written a solution yet. Implement something in the editor and submit again.",
    reviewFallback: "Couldn't generate the review.",
    pythonNote:
      'Python is evaluated by the AI on submit. Click "Submit" to get Socratic feedback.',
    run: 'Run',
    statusRunning: 'running',
    statusPassed: (n: number, total: number) => `${n}/${total} passed`,
    statusFailed: (n: number, total: number) => `${n}/${total} failed`,
    statusError: 'error',
    toggleTerminal: 'Toggle terminal',
    errNetwork: 'Lost connection to the tutor — try again.',
    notFound: 'Challenge not found',
    backToDashboard: 'Back to dashboard',
    panelBriefing: 'Briefing',
    panelWork: 'Code',
    panelTutor: 'Tutor',
  },
  pt: {
    loadingEditor: 'Carregando editor...',
    replyFallback: 'Não consegui responder agora.',
    hintUnavailable: 'Hint indisponível.',
    solutionApplied:
      'Apliquei a solução no editor. Rode os testes e estude por que ela funciona.',
    teachDecisions: 'Decisões-chave:',
    teachThink: 'Agora você, antes de seguir:',
    solveFallback: 'Não consegui resolver agora.',
    noSolutionYet:
      'Você ainda não escreveu uma solução. Implemente algo no editor e submeta de novo.',
    reviewFallback: 'Não foi possível gerar o review.',
    pythonNote:
      'Python é avaliado pela IA ao submeter. Clique em "Submeter" para receber o feedback socrático.',
    run: 'Rodar',
    statusRunning: 'rodando',
    statusPassed: (n: number, total: number) => `${n}/${total} passaram`,
    statusFailed: (n: number, total: number) => `${n}/${total} falharam`,
    statusError: 'erro',
    toggleTerminal: 'Abrir/fechar terminal',
    errNetwork: 'Sem conexão com o tutor — tente de novo.',
    notFound: 'Desafio não encontrado',
    backToDashboard: 'Voltar ao dashboard',
    panelBriefing: 'Briefing',
    panelWork: 'Código',
    panelTutor: 'Tutor',
  },
}

function EditorLoading() {
  const t = useT(copy)
  return (
    <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
      <Loader2 className='mr-2 size-4 animate-spin' /> {t.loadingEditor}
    </div>
  )
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorLoading />,
})

const POST = { method: 'POST', headers: { 'content-type': 'application/json' } }

export function CodeChallengeWorkspace({ user }: { user: User }) {
  const router = useRouter()
  const t = useT(copy)
  const isDark = useIsDark()
  const [challenge, setChallenge] = React.useState<Challenge | null>(null)
  const [loadError, setLoadError] = React.useState(false)
  const [activePanel, setActivePanel] = React.useState<
    'brief' | 'work' | 'chat'
  >('brief')

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
  const [outcome, setOutcome] = React.useState<'pass' | 'fail'>('pass')

  const language: RunnerLanguage = challenge
    ? challengeLanguage(challenge.stack)
    : 'ts'

  React.useEffect(() => {
    let active = true
    ;(async () => {
      const id =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('id')
          : null
      const query = supabase.from('challenges').select('*')
      const { data, error } = id
        ? await query.eq('id', id).single()
        : await query.order('created_at', { ascending: true }).limit(1).single()
      if (!active) return
      if (error || !data) setLoadError(true)
      else setChallenge(data as unknown as Challenge)
    })().catch(() => {
      if (active) setLoadError(true)
    })
    return () => {
      active = false
    }
  }, [])

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
        text: data.text || data.error || t.replyFallback,
      })
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
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
          messages: s.messages,
          code: s.work,
          title: challenge.title,
          briefing: challenge.client_briefing,
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      s.syncRemaining(data.remaining)
      if (data.text) s.applyHint(level)
      s.pushMessage({
        role: 'ai',
        text: data.text || data.error || t.hintUnavailable,
        hintLevel: level,
      })
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      s.setThinking(false)
    }
  }

  async function askSolve() {
    if (s.thinking || !challenge) return
    s.setThinking(true)
    s.spendSolve()
    try {
      const res = await apiFetch('/api/solve', {
        ...POST,
        body: JSON.stringify({
          kind: 'code',
          title: challenge.title,
          briefing: challenge.client_briefing,
          work: s.work,
          tests: challenge.tests_source,
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      s.syncRemaining(data.remaining)
      if (data.code) {
        s.setWork(data.code)
        const teach = data.teach as
          | {
              flow?: string
              decisions?: { what: string; why: string }[]
              questions?: string[]
            }
          | undefined
        const parts: string[] = []
        if (teach?.flow) parts.push(teach.flow)
        if (teach?.decisions?.length) {
          parts.push('', `**${t.teachDecisions}**`)
          for (const d of teach.decisions) {
            parts.push(`- **${d.what}**: ${d.why}`)
          }
        }
        if (teach?.questions?.length) {
          parts.push('', `**${t.teachThink}**`)
          for (const q of teach.questions) parts.push(`- ${q}`)
        }
        s.pushMessage({
          role: 'ai',
          text: parts.length ? parts.join('\n') : t.solutionApplied,
        })
      } else {
        s.pushMessage({
          role: 'ai',
          text: data.error || t.solveFallback,
        })
      }
    } catch {
      s.pushMessage({ role: 'ai', text: t.errNetwork })
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
      setOutcome('fail')
      setReview(t.noSolutionYet)
      s.complete(s.elapsed, 'abandoned')
      setReviewing(false)
      return
    }

    let passed = 0
    let total = 0
    if (challenge.tests_source && language !== 'react' && language !== 'py') {
      const r = await runCode(
        { code, language, testsSource: challenge.tests_source },
        { timeoutMs: 5000 },
      )
      total = r.tests.length
      passed = r.tests.filter((t) => t.passed).length
      setResult(r)
      if (passed < total) setShowPanel(true)
    }
    setSubmitTests({ passed, total })
    const solved = total === 0 || passed === total
    setOutcome(solved ? 'pass' : 'fail')
    s.complete(s.elapsed, solved ? 'completed' : 'abandoned')

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
      setReview(data.review || data.error || t.reviewFallback)
    } catch {
      setReviewOpen(false)
      s.pushMessage({ role: 'ai', text: t.errNetwork })
    } finally {
      setReviewing(false)
    }
  }

  async function run() {
    if (running || !challenge) return
    setShowPanel(true)
    if (language === 'react') return
    if (language === 'py') {
      setResult({
        logs: [{ level: 'info', text: t.pythonNote }],
        tests: [],
        ok: false,
        durationMs: 0,
      })
      return
    }
    setRunning(true)
    setResult(null)
    const r = await runCode(
      { code: s.work, language, testsSource: challenge.tests_source },
      { timeoutMs: 5000 },
    )
    setResult(r)
    setRunning(false)
    if (!r.ok) setShowPanel(true)
  }

  if (loadError)
    return (
      <div className='flex h-dvh flex-col items-center justify-center gap-4 bg-background'>
        <span className='font-mono text-4xl text-muted-foreground'>∅</span>
        <h1 className='text-xl font-light'>{t.notFound}</h1>
        <Button variant='outline' onClick={() => router.push('/dashboard')}>
          {t.backToDashboard}
        </Button>
      </div>
    )

  if (!challenge) return <ChallengeSkeleton />

  return (
    <div className='relative flex h-dvh flex-col overflow-hidden'>
      <WorkspaceHeader
        title={challenge.title}
        elapsed={s.elapsed}
        independence={s.independence}
        submitting={reviewing}
        onSubmit={submitReview}
      />

      <div className='flex shrink-0 items-center gap-1 border-b border-border bg-muted px-4 py-2 lg:hidden'>
        {(['brief', 'work', 'chat'] as const).map((p) => (
          <button
            key={p}
            type='button'
            onClick={() => setActivePanel(p)}
            className={cn(
              'rounded-full px-3 py-1 font-mono text-[12px] transition-colors',
              activePanel === p
                ? 'bg-ink text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {p === 'brief'
              ? t.panelBriefing
              : p === 'work'
                ? t.panelWork
                : t.panelTutor}
          </button>
        ))}
      </div>

      <div className='flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[360px_1fr_400px] lg:grid-rows-[minmax(0,1fr)]'>
        <aside
          className={cn(
            'min-h-0 overflow-y-auto border-border bg-muted lg:border-r',
            activePanel === 'brief' ? 'flex-1' : 'hidden lg:block',
          )}
        >
          <BriefingPanel challenge={challenge} />
        </aside>

        <section
          className={cn(
            'relative min-h-0 flex-col',
            activePanel === 'work' ? 'flex flex-1' : 'hidden lg:flex',
          )}
        >
          <div className='flex h-10 items-center justify-between border-b border-border bg-muted px-4'>
            <div className='flex items-center gap-2 font-mono text-[12px] text-muted-foreground'>
              <Code2Tag language={language} />
              <span className='hidden sm:inline'>solucao.{language === 'js' ? 'js' : language === 'py' ? 'py' : language === 'react' ? 'tsx' : 'ts'}</span>
              <span className='ml-1 hidden size-1 rounded-full bg-warning/70 sm:inline-block' />
              <span className='hidden text-[11px] text-warning-foreground/80 sm:inline'>unsaved</span>
            </div>
            <div className='flex items-center gap-1.5'>
              {language !== 'react' && (
                <RunStatusChip
                  running={running}
                  result={result}
                  onClick={() => setShowPanel((v) => !v)}
                />
              )}
              <Button
                size='xs'
                variant='ghost'
                onClick={() => setShowPanel((v) => !v)}
                aria-label={language === 'react' ? 'Preview' : language === 'py' ? 'Console' : 'Terminal'}
                className={cn(
                  'gap-1.5 rounded-md hover:text-foreground',
                  showPanel ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <Terminal className='size-3.5' />
                <span className='hidden sm:inline'>
                  {language === 'react' ? 'Preview' : language === 'py' ? 'Console' : 'Terminal'}
                </span>
              </Button>
              <Button
                size='xs'
                variant='ghost'
                onClick={run}
                disabled={running}
                aria-label={t.run}
                className='gap-1.5 rounded-md text-muted-foreground hover:text-foreground'
              >
                {running ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <PlayCircle className='size-3.5' />
                )}
                <span className='hidden sm:inline'>{t.run}</span>
              </Button>
            </div>
          </div>
          <div className='relative min-h-0 flex-1'>
            <MonacoEditor
              height='100%'
              language={language === 'js' ? 'javascript' : language === 'py' ? 'python' : 'typescript'}
              value={s.work}
              onChange={(v) => s.setWork(v ?? '')}
              theme={isDark ? 'vs-dark' : 'light'}
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

        <aside
          className={cn(
            'min-h-0 flex-col border-border bg-muted lg:border-l',
            activePanel === 'chat' ? 'flex flex-1' : 'hidden lg:flex',
          )}
        >
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
            buying={s.buying}
            buyError={s.buyError}
            bought={s.bought}
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
            outcome={outcome}
            sessionId={s.sessionId}
            onClose={() => setReviewOpen(false)}
            onComplete={() => router.push('/dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function RunStatusChip({
  running,
  result,
  onClick,
}: {
  running: boolean
  result: RunResult | null
  onClick: () => void
}) {
  const t = useT(copy)
  if (running)
    return (
      <button
        type='button'
        onClick={onClick}
        aria-label={t.toggleTerminal}
        className='flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground'
      >
        <Loader2 className='size-3 animate-spin' /> {t.statusRunning}
      </button>
    )
  if (!result) return null
  const total = result.tests.length
  const passed = result.tests.filter((x) => x.passed).length
  const failed = total - passed
  if (total === 0 && !result.error) return null
  const solved = total > 0 && failed === 0 && !result.error
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={t.toggleTerminal}
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors',
        solved
          ? 'border-mint/30 bg-mint/10 text-mint hover:bg-mint/20'
          : 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20',
      )}
    >
      {solved ? (
        <CheckCircle2 className='size-3' />
      ) : (
        <XCircle className='size-3' />
      )}
      {total === 0
        ? t.statusError
        : solved
          ? t.statusPassed(passed, total)
          : t.statusFailed(failed, total)}
    </button>
  )
}

function Code2Tag({ language }: { language: RunnerLanguage }) {
  const label = { js: 'JS', ts: 'TS', react: 'RX', py: 'PY' }[language]
  return (
    <span className='grid size-4 place-items-center rounded border border-primary/20 bg-primary/10 text-[8px] font-semibold text-primary uppercase'>
      {label}
    </span>
  )
}
