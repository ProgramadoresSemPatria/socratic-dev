/** Languages we can execute in the in-browser runner. */
export type RunnerLanguage = 'js' | 'ts' | 'react'

export type StackId = 'javascript' | 'typescript' | 'python' | 'react'
export type StackUiId = 'js' | 'ts' | 'py' | 'react'

export type Stack = {
  id: StackId
  uiId: StackUiId
  label: string
  description: string
  runnerLanguage: RunnerLanguage
  iconLabel: string
  gradient: string
}

export const STACKS: readonly Stack[] = [
  {
    id: 'javascript',
    uiId: 'js',
    label: 'JavaScript',
    description: 'Web, Node, full-stack',
    runnerLanguage: 'js',
    iconLabel: 'JS',
    gradient: 'from-amber-400/30 to-orange-500/20',
  },
  {
    id: 'typescript',
    uiId: 'ts',
    label: 'TypeScript',
    description: 'Type safety, tooling moderno',
    runnerLanguage: 'ts',
    iconLabel: 'TS',
    gradient: 'from-blue-500/30 to-iris/20',
  },
  {
    id: 'python',
    uiId: 'py',
    label: 'Python',
    description: 'Backend, dados, scripts',
    runnerLanguage: 'ts',
    iconLabel: 'PY',
    gradient: 'from-mint/30 to-blue-400/20',
  },
  {
    id: 'react',
    uiId: 'react',
    label: 'React',
    description: 'Componentes, hooks, estado',
    runnerLanguage: 'react',
    iconLabel: 'RX',
    gradient: 'from-cyan-400/30 to-iris/20',
  },
] as const

export function stackById(id: string): Stack | undefined {
  return STACKS.find((s) => s.id === id)
}

export function stackByUiId(uiId: string): Stack | undefined {
  return STACKS.find((s) => s.uiId === uiId)
}
