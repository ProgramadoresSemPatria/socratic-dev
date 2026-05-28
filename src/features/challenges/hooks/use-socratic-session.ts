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

  const startedAtRef = React.useRef<number>(Date.now())
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

    startSession({ userId: user.id, challengeId: challenge.id })
      .then((d) => d?.id && setSessionId(d.id))
      .catch(() => {})

    getHintBalance(user.id)
      .then((b) => setHintsRemaining(b.remaining))
      .catch(() => {})
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

  // Optimistic local decrement only. The server is the source of truth for
  // hint balance — every tutor/solve call returns `remaining`, which the
  // caller pipes through `syncRemaining` to overwrite this local prediction.
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
    if (!user) return
    try {
      await buyHintsAction(user.id)
      const b = await getHintBalance(user.id)
      setHintsRemaining(b.remaining)
    } catch {
      // ignore
    }
  }

  function complete(durationSeconds: number) {
    if (!sessionId) return
    completeSession({ id: sessionId, durationSeconds }).catch(() => {})
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
    hintsRemaining,
    complete,
  }
}
