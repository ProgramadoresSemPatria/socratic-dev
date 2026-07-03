'use client'

import { useUser } from '@/features/auth/hooks/use-user'
import {
  buyHints as buyHintsAction,
  getHintBalance,
} from '@/features/hints/actions'
import {
  SOLVE_COST,
  SOLVE_INDEPENDENCE_PENALTY,
} from '@/features/hints/constants'
import type { ChatMsg } from '@/lib/ai/types'
import { getAccessToken } from '@/lib/api/client'
import * as React from 'react'
import { completeSession, startSession } from '../actions'
import { loadDraft, saveDraft } from '../draft'

export function useSocraticSession<TWork>(opts: {
  challenge: { id: string } | null
  initialWork: TWork
  initialMessages: ChatMsg[]
}) {
  const { challenge, initialWork, initialMessages } = opts
  const { user, loading: authLoading } = useUser()

  const [messages, setMessages] = React.useState<ChatMsg[]>([])
  const [input, setInput] = React.useState('')
  const [thinking, setThinking] = React.useState(false)
  const [independence, setIndependence] = React.useState(100)
  const [hintsUsed, setHintsUsed] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [work, setWork] = React.useState<TWork>(initialWork)
  const [ready, setReady] = React.useState(false)
  const [hintsRemaining, setHintsRemaining] = React.useState<number | null>(
    null,
  )
  const [buying, setBuying] = React.useState(false)
  const [buyError, setBuyError] = React.useState<string | null>(null)
  const [bought, setBought] = React.useState(false)

  const startedAtRef = React.useRef<number>(Date.now())
  const buyingRef = React.useRef(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const initRef = React.useRef(false)

  React.useEffect(() => {
    if (!challenge || !user || initRef.current) return
    initRef.current = true

    const draft = loadDraft<TWork>(challenge.id)
    if (draft) {
      setWork(draft.work)
      setMessages(draft.messages)
      setHintsUsed(draft.hintsUsed)
      setIndependence(draft.independence)
      const base = Number.isFinite(draft.elapsed) ? draft.elapsed : 0
      startedAtRef.current = Date.now() - base * 1000
      setElapsed(base)
    } else {
      setWork(initialWork)
      setMessages(initialMessages)
      startedAtRef.current = Date.now()
    }
    setReady(true)

    getAccessToken().then((token) => {
      startSession({ token, challengeId: challenge.id })
        .then((d) => d?.id && setSessionId(d.id))
        .catch(() => {})
      getHintBalance(token)
        .then((b) => setHintsRemaining(b.remaining))
        .catch(() => {})
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, user])

  React.useEffect(() => {
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)),
      1000,
    )
    return () => clearInterval(t)
  }, [])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, thinking])

  React.useEffect(() => {
    if (!challenge || !initRef.current || messages.length === 0) return
    saveDraft<TWork>(challenge.id, {
      work,
      messages,
      hintsUsed,
      independence,
      elapsed: Math.floor((Date.now() - startedAtRef.current) / 1000),
    })
  }, [challenge, work, messages, hintsUsed, independence])

  function pushMessage(msg: ChatMsg) {
    setMessages((m) => [...m, msg])
  }

  function spend(cost: number, penalty: number) {
    setHintsUsed((h) => h + cost)
    setIndependence((i) => Math.max(0, i - penalty))
  }

  function applyHint(level: 1 | 2 | 3) {
    spend(1, level * 4)
  }

  function spendSolve() {
    spend(SOLVE_COST, SOLVE_INDEPENDENCE_PENALTY)
  }

  function syncRemaining(n: number | undefined) {
    if (typeof n === 'number') setHintsRemaining(n)
  }

  async function buyHints() {
    if (!user || buyingRef.current) return
    buyingRef.current = true
    setBuying(true)
    setBuyError(null)
    setBought(false)
    try {
      const token = await getAccessToken()
      await buyHintsAction(token)
      const b = await getHintBalance(token)
      setHintsRemaining(b.remaining)
      setBought(true)
      setTimeout(() => setBought(false), 2500)
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : '')
      setTimeout(() => setBuyError(null), 5000)
    } finally {
      buyingRef.current = false
      setBuying(false)
    }
  }

  function complete(
    durationSeconds: number,
    status: 'completed' | 'abandoned' = 'completed',
  ) {
    if (!sessionId) return
    getAccessToken()
      .then((token) =>
        completeSession({ token, id: sessionId, durationSeconds, status }),
      )
      .catch(() => {})
  }

  return {
    user,
    authLoading,
    ready,
    messages,
    setMessages,
    pushMessage,
    input,
    setInput,
    thinking,
    setThinking,
    independence,
    hintsUsed,
    elapsed,
    sessionId,
    work,
    setWork,
    scrollRef,
    applyHint,
    spendSolve,
    syncRemaining,
    buyHints,
    buying,
    buyError,
    bought,
    hintsRemaining,
    complete,
  }
}
