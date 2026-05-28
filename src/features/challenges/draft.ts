import type { ChatMsg } from '@/lib/ai/types'

export type SocraticDraft<TWork> = {
  work: TWork
  messages: ChatMsg[]
  hintsUsed: number
  independence: number
  /** Accumulated ACTIVE seconds (time the workspace was actually open),
   * not wall-clock since first open — so closed-tab time never counts. */
  elapsed: number
}

function draftKey(id: string): string {
  return `socratic:draft:${id}`
}

export function loadDraft<TWork>(id: string): SocraticDraft<TWork> | null {
  try {
    const raw = localStorage.getItem(draftKey(id))
    return raw ? (JSON.parse(raw) as SocraticDraft<TWork>) : null
  } catch {
    return null
  }
}

export function saveDraft<TWork>(id: string, state: SocraticDraft<TWork>): void {
  try {
    localStorage.setItem(draftKey(id), JSON.stringify(state))
  } catch {
    // ignore quota / serialization errors
  }
}
