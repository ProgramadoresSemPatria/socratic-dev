export type ChatRole = 'user' | 'ai'

export interface ChatMsg {
  role: ChatRole
  text: string
  hintLevel?: 1 | 2 | 3
}

export type Challenge = {
  id: string
  title: string
  description: string
  stack: string
  level: string
  client_briefing: string
  initial_code: string
  tests_source: string
  intro: string
  kind: 'code' | 'design'
  topics?: string[] | null
  editorial?: string | null
}
