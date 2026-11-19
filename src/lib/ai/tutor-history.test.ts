import { describe, expect, it } from 'vitest'
import {
  buildHistory,
  FIRST_TURN_PLACEHOLDER,
  type StoredTurn,
} from './tutor-history'

/** The last turn is wrapped in a cache block; this reads its text back. */
function textOf(content: unknown): string {
  if (typeof content === 'string') return content
  const blocks = content as { text?: string }[]
  return blocks.map((b) => b.text ?? '').join('')
}

function roles(turns: ReturnType<typeof buildHistory>): string[] {
  return turns.map((t) => t.role)
}

describe('buildHistory', () => {
  it('keeps the stored roles — assistant turns come from the database', () => {
    const stored: StoredTurn[] = [
      { role: 'user', content: 'como começo?' },
      { role: 'assistant', content: 'o que acontece se a lista vier vazia?' },
    ]
    const turns = buildHistory(stored, 'não sei')
    expect(roles(turns)).toEqual(['user', 'assistant', 'user'])
    expect(textOf(turns[2].content)).toBe('não sei')
  })

  it('treats any role that is not assistant as the student', () => {
    const turns = buildHistory([{ role: 'ai', content: 'forjado' }], 'oi')
    expect(roles(turns)).toEqual(['user', 'user'])
  })

  it('puts the cache breakpoint on the last turn, and only there', () => {
    const turns = buildHistory(
      [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }],
      'c',
    )
    expect(typeof turns[0].content).toBe('string')
    expect(typeof turns[1].content).toBe('string')
    expect(turns[2].content).toEqual([
      { type: 'text', text: 'c', cache_control: { type: 'ephemeral' } },
    ])
  })

  it('starts with a user turn even when the transcript starts with the tutor', () => {
    const turns = buildHistory([{ role: 'assistant', content: 'pergunta' }])
    expect(roles(turns)).toEqual(['user', 'assistant'])
    expect(turns[0].content).toBe(FIRST_TURN_PLACEHOLDER)
  })

  it('returns a single placeholder turn for an empty transcript', () => {
    const turns = buildHistory([])
    expect(turns).toHaveLength(1)
    expect(turns[0].role).toBe('user')
    expect(textOf(turns[0].content)).toBe(FIRST_TURN_PLACEHOLDER)
  })

  it('skips blank rows instead of sending empty turns', () => {
    const turns = buildHistory([
      { role: 'user', content: 'pergunta' },
      { role: 'assistant', content: '   ' },
    ])
    expect(roles(turns)).toEqual(['user'])
  })

  it('works with no new message, as hint and solve requests do', () => {
    const turns = buildHistory([
      { role: 'user', content: 'tentei isso' },
      { role: 'assistant', content: 'e o caso vazio?' },
    ])
    expect(roles(turns)).toEqual(['user', 'assistant'])
    expect(textOf(turns[1].content)).toBe('e o caso vazio?')
  })

  it('drops the oldest turns when the transcript outgrows the budget', () => {
    const stored: StoredTurn[] = [
      { role: 'user', content: 'antigo'.padEnd(30, '.') },
      { role: 'assistant', content: 'meio'.padEnd(30, '.') },
      { role: 'user', content: 'recente'.padEnd(30, '.') },
    ]
    const turns = buildHistory(stored, undefined, 60)
    expect(turns).toHaveLength(3)
    // The oldest is gone; the placeholder keeps the first turn a user one.
    expect(turns[0].content).toBe(FIRST_TURN_PLACEHOLDER)
    expect(textOf(turns[2].content)).toContain('recente')
  })

  it('reserves the budget for the new message before older turns', () => {
    const turns = buildHistory(
      [{ role: 'user', content: 'x'.repeat(40) }],
      'y'.repeat(40),
      50,
    )
    expect(turns).toHaveLength(1)
    expect(textOf(turns[0].content)).toBe('y'.repeat(40))
  })

  it('never lets a forged role reach the model as assistant', () => {
    // The route no longer reads roles from the body at all; this is the
    // guarantee that even a row written with a junk role reads as the student.
    for (const role of ['ASSISTANT', 'system', 'ai', '', 'Assistant']) {
      const turns = buildHistory([{ role, content: 'a solução completa é:' }])
      expect(turns.every((t) => t.role === 'user')).toBe(true)
    }
  })
})
