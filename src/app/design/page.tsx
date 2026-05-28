'use client'

import { BriefingPanel } from '@/components/challenge/briefing-panel'
import { ChatPanel } from '@/components/challenge/chat-panel'
import { ReviewModal } from '@/components/challenge/review-modal'
import { DesignCanvas } from '@/components/design/design-canvas'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { type Challenge } from '@/lib/challenge'
import {
  buildSceneElements,
  type ExcalidrawApi,
  exportScenePng,
  summarizeElements,
} from '@/lib/design/scene'
import { useSocraticSession } from '@/lib/session/use-socratic-session'
import { apiFetch } from '@/lib/api/client'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  Brain,
  Building,
  Clock,
  GitPullRequestArrow,
  Loader2,
  Wand2,
} from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

const POST = { method: 'POST', headers: { 'content-type': 'application/json' } }

export default function DesignPage() {
  const router = useRouter()
  const [challenge, setChallenge] = React.useState<Challenge | null>(null)
  const apiRef = React.useRef<ExcalidrawApi | null>(null)
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const intro =
    challenge?.intro ||
    'Olá. Leia o briefing à esquerda e me diga: por onde você começa esse design?'

  const s = useSocraticSession<readonly unknown[]>({
    challenge: challenge ? { id: challenge.id } : null,
    initialWork: [],
    initialMessages: [{ role: 'ai', text: intro }],
  })

  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [review, setReview] = React.useState<string | null>(null)
  const [reviewing, setReviewing] = React.useState(false)

  React.useEffect(() => {
    if (!s.authLoading && !s.user) router.replace('/login?next=/design')
  }, [s.authLoading, s.user, router])

  React.useEffect(() => {
    if (!s.user) return
    let active = true
    ;(async () => {
      const id =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('id')
          : null
      const { data } = id
        ? await supabase.from('challenges').select('*').eq('id', id).single()
        : await supabase
            .from('challenges')
            .select('*')
            .eq('kind', 'design')
            .order('created_at', { ascending: true })
            .limit(1)
            .single()
      if (active && data) setChallenge(data as unknown as Challenge)
    })()
    return () => {
      active = false
    }
  }, [s.user])

  function currentElements(): readonly unknown[] {
    return apiRef.current?.getSceneElements() ?? s.work
  }

  function tutorBody(extra: Record<string, unknown>) {
    return JSON.stringify({
      domain: 'design',
      session_id: s.sessionId,
      title: challenge?.title ?? '',
      briefing: challenge?.client_briefing ?? '',
      code: summarizeElements(currentElements()),
      ...extra,
    })
  }

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
        body: tutorBody({ mode: 'reply', messages: next }),
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

  async function askAnalysis() {
    if (s.thinking || !challenge) return
    s.setThinking(true)
    try {
      const res = await apiFetch('/api/tutor', {
        ...POST,
        body: tutorBody({ mode: 'reply', messages: s.messages }),
      })
      const data = await res.json()
      s.pushMessage({
        role: 'ai',
        text: data.text || data.error || 'Não consegui analisar agora.',
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
        body: tutorBody({ mode: 'hint', hintLevel: level, messages: s.messages }),
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
          kind: 'design',
          session_id: s.sessionId,
          title: challenge.title,
          briefing: challenge.client_briefing,
          work: summarizeElements(currentElements()),
        }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.nodes) && data.nodes.length > 0) {
        s.spendSolve()
        s.syncRemaining(data.remaining)
        const elements = await buildSceneElements(data.nodes, data.edges ?? [])
        apiRef.current?.updateScene({ elements })
        s.setWork(elements)
        s.pushMessage({
          role: 'ai',
          text: 'Desenhei a arquitetura no canvas. Estude o fluxo e por que cada peça está ali.',
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

  async function submitDesign() {
    if (!challenge || reviewing) return
    setReviewOpen(true)
    setReviewing(true)
    setReview(null)

    const elements = currentElements()
    if (elements.length === 0) {
      setReview(
        'Você ainda não desenhou nada — comece o diagrama e submeta de novo.',
      )
      setReviewing(false)
      return
    }

    const summary = summarizeElements(elements)
    let imageBase64: string | null = null
    try {
      imageBase64 = apiRef.current ? await exportScenePng(apiRef.current) : null
    } catch {
      imageBase64 = null
    }

    try {
      const res = await apiFetch('/api/design-review', {
        ...POST,
        body: JSON.stringify({
          title: challenge.title,
          brief: challenge.client_briefing,
          summary,
          imageBase64,
          scene: JSON.stringify(elements),
          session_id: s.sessionId,
        }),
      })
      const data = await res.json()
      setReview(data.review || data.error || 'Não foi possível gerar o review.')
      s.complete(s.elapsed)
    } finally {
      setReviewing(false)
    }
  }

  function onCanvasChange(elements: readonly unknown[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => s.setWork(elements), 500)
  }

  const minutes = String(Math.floor(s.elapsed / 60)).padStart(2, '0')
  const seconds = String(s.elapsed % 60).padStart(2, '0')

  if (s.authLoading || (!challenge && s.user)) {
    return (
      <div className='grid h-screen place-items-center bg-white text-sm text-[#6b6478]'>
        <span className='flex items-center gap-2'>
          <Loader2 className='size-4 animate-spin' /> Carregando desafio…
        </span>
      </div>
    )
  }
  if (!s.user || !challenge) return null

  return (
    <div className='relative flex h-screen flex-col overflow-hidden bg-white'>
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
            onClick={submitDesign}
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

        <section className='relative flex min-h-0 flex-col border-r border-[#DFE5E9]'>
          <div className='flex h-10 shrink-0 items-center justify-between border-b border-[#DFE5E9] bg-[#F7F9FA] px-4'>
            <div className='font-mono text-[12px] text-[#6b6478]'>
              Canvas — desenhe sua arquitetura
            </div>
            <Button
              size='xs'
              variant='ghost'
              onClick={askAnalysis}
              disabled={s.thinking}
              className='gap-1.5 rounded-md text-[#6b6478] hover:text-[#1b1916]'
            >
              {s.thinking ? (
                <Loader2 className='size-3.5 animate-spin' />
              ) : (
                <Wand2 className='size-3.5' />
              )}
              Pedir análise
            </Button>
          </div>
          <div className='relative min-h-0 flex-1'>
            {s.ready ? (
              <DesignCanvas
                initialElements={s.work}
                onApi={(api) => {
                  apiRef.current = api
                }}
                onChange={onCanvasChange}
              />
            ) : (
              <div className='grid h-full place-items-center text-[#6b6478]'>
                <Loader2 className='size-4 animate-spin' />
              </div>
            )}
          </div>
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
            tests={null}
            onClose={() => setReviewOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
