'use client'

import { SOLVE_CAP } from '@/domain/scoring'
import { useUser } from '@/features/auth/hooks/use-user'
import { getHintBalance } from '@/features/hints/actions'
import type { ChatMsg } from '@/lib/ai/types'
import { track } from '@/lib/analytics'
import { apiFetch, getAccessToken } from '@/lib/api/client'
import { useT } from '@/lib/i18n'
import * as React from 'react'
import { completeSession, startSession } from '../actions'
import { loadDraft, saveDraft } from '../draft'

const copy = {
  en: { buyFailed: "Couldn't start checkout." },
  pt: { buyFailed: 'Não foi possível iniciar a compra.' },
}

export function useSocraticSession<TWork>(opts: {
  challenge: { id: string } | null
  initialWork: TWork
  initialMessages: ChatMsg[]
  paused?: boolean
}) {
  const { challenge, initialWork, initialMessages, paused = false } = opts
  const { user, loading: authLoading } = useUser()
  const t = useT(copy)

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
  const pausedAtRef = React.useRef<number | null>(null)
  const buyingRef = React.useRef(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const initRef = React.useRef(false)

  const elapsedNow = React.useCallback(
    () =>
      Math.floor(
        ((pausedAtRef.current ?? Date.now()) - startedAtRef.current) / 1000,
      ),
    [],
  )

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
    track('challenge_started', {
      challenge_id: challenge.id,
      resumed: !!draft,
    })

    const params = new URLSearchParams(window.location.search)
    const purchased = params.get('purchase') === 'success'
    if (params.has('purchase')) {
      params.delete('purchase')
      const qs = params.toString()
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (qs ? `?${qs}` : ''),
      )
    }

    getAccessToken().then((token) => {
      startSession({ token, challengeId: challenge.id })
        .then((d) => d?.id && setSessionId(d.id))
        .catch(() => {})
      const refreshBalance = () =>
        getHintBalance(token)
          .then((b) => setHintsRemaining(b.remaining))
          .catch(() => {})
      refreshBalance()
      if (purchased) {
        setBought(true)
        track('hints_purchased', { challenge_id: challenge.id })
        // The Stripe webhook may land a moment after the redirect.
        setTimeout(refreshBalance, 3000)
        setTimeout(() => setBought(false), 4000)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, user])

  React.useEffect(() => {
    if (paused) {
      if (pausedAtRef.current == null) pausedAtRef.current = Date.now()
      return
    }
    if (pausedAtRef.current != null) {
      startedAtRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = null
    }
    setElapsed(elapsedNow())
    const t = setInterval(() => setElapsed(elapsedNow()), 1000)
    return () => clearInterval(t)
  }, [paused, elapsedNow])

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
      elapsed: elapsedNow(),
    })
  }, [challenge, work, messages, hintsUsed, independence])

  function pushMessage(msg: ChatMsg) {
    setMessages((m) => [...m, msg])
  }

  async function streamIntoMessage(
    res: Response,
    opts?: { hintLevel?: 1 | 2 | 3; fallback?: string },
  ): Promise<string> {
    const base: ChatMsg = { role: 'ai', text: '' }
    if (opts?.hintLevel) base.hintLevel = opts.hintLevel
    setMessages((m) => [...m, base])

    const patchLast = (text: string) =>
      setMessages((m) => {
        const next = m.slice()
        next[next.length - 1] = { ...next[next.length - 1], text }
        return next
      })

    const reader = res.body?.getReader()
    if (!reader) {
      if (opts?.fallback) patchLast(opts.fallback)
      return ''
    }
    const decoder = new TextDecoder()
    let text = ''
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        patchLast(text)
      }
    } catch {}
    if (!text.trim() && opts?.fallback) patchLast(opts.fallback)
    return text
  }

  function spend(cost: number, penalty: number) {
    setHintsUsed((h) => h + cost)
    setIndependence((i) => Math.max(0, i - penalty))
  }

  function applyHint(level: 1 | 2 | 3) {
    spend(1, level * 4)
    track('hint_used', { challenge_id: challenge?.id, level })
  }

  function spendSolve() {
    setIndependence(SOLVE_CAP)
    track('solve_used', { challenge_id: challenge?.id })
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
      const res = await apiFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        url?: string
        mock?: boolean
        error?: string
      }
      if (!res.ok) throw new Error(data.error || t.buyFailed)
      if (data.url) {
        track('checkout_started', { challenge_id: challenge?.id })
        window.location.href = data.url
        return
      }
      // Dev fallback (no Stripe keys): pack credited directly.
      const token = await getAccessToken()
      const b = await getHintBalance(token)
      setHintsRemaining(b.remaining)
      setBought(true)
      track('hints_purchased', { remaining: b.remaining })
      setTimeout(() => setBought(false), 2500)
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : t.buyFailed)
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
    track('challenge_completed', {
      challenge_id: challenge?.id,
      status,
      duration_seconds: durationSeconds,
      independence,
      hints_used: hintsUsed,
    })
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
    streamIntoMessage,
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
