import { transform } from 'sucrase'
import type { RunLog, RunRequest, RunResult, TestResult } from './types'

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<RunRequest>) => void) | null
  postMessage: (msg: RunResult) => void
}

function format(v: unknown): string {
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  )
    return false
  const ka = Object.keys(a as Record<string, unknown>)
  const kb = Object.keys(b as Record<string, unknown>)
  if (ka.length !== kb.length) return false
  return ka.every((k) =>
    deepEqual(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
    ),
  )
}

ctx.onmessage = (e: MessageEvent<RunRequest>) => {
  const { code, language, testsSource } = e.data
  const started = performance.now()
  const logs: RunLog[] = []
  const tests: TestResult[] = []
  let error: string | undefined

  const capture =
    (level: RunLog['level']) =>
    (...args: unknown[]) => {
      logs.push({ level, text: args.map(format).join(' ') })
    }
  const sandboxConsole = {
    log: capture('log'),
    info: capture('info'),
    warn: capture('warn'),
    error: capture('error'),
  }

  const expect = (actual: unknown) => ({
    toBe(expected: unknown) {
      if (!Object.is(actual, expected))
        throw new Error(
          `esperado ${format(expected)}, recebido ${format(actual)}`,
        )
    },
    toEqual(expected: unknown) {
      if (!deepEqual(actual, expected))
        throw new Error(
          `esperado ${format(expected)}, recebido ${format(actual)}`,
        )
    },
    toBeTruthy() {
      if (!actual)
        throw new Error(`esperado valor truthy, recebido ${format(actual)}`)
    },
  })

  const test = (name: string, fn: () => unknown) => {
    try {
      const r = fn()
      if (r && typeof (r as Promise<unknown>).then === 'function') {
        throw new Error('testes assíncronos não são suportados nesta versão')
      }
      tests.push({ name, passed: true })
    } catch (err) {
      tests.push({ name, passed: false, message: (err as Error).message })
    }
  }

  try {
    const transforms =
      language === 'ts' ? ['typescript', 'imports'] : ['imports']
    const transpiled = transform(code, {
      transforms: transforms as ('typescript' | 'imports')[],
    }).code

    const moduleObj = { exports: {} as Record<string, unknown> }
    const require = (name: string) => {
      throw new Error(
        `import de "${name}" não é suportado — escreva a solução sem imports externos`,
      )
    }
    const userFn = new Function(
      'exports',
      'module',
      'require',
      'console',
      transpiled,
    )
    userFn(moduleObj.exports, moduleObj, require, sandboxConsole)

    if (testsSource) {
      const testFn = new Function(
        'exports',
        'test',
        'expect',
        'console',
        testsSource,
      )
      testFn(moduleObj.exports, test, expect, sandboxConsole)
    }
  } catch (err) {
    error = (err as Error).message || String(err)
  }

  const ok = !error && tests.length > 0 && tests.every((t) => t.passed)
  ctx.postMessage({
    logs,
    error,
    tests,
    ok,
    durationMs: Math.round(performance.now() - started),
  })
}
