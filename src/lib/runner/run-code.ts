import type { RunRequest, RunResult } from './types'

export function runCode(
  req: RunRequest,
  opts: { timeoutMs?: number } = {},
): Promise<RunResult> {
  const timeoutMs = opts.timeoutMs ?? 5000

  return new Promise((resolve) => {
    let worker: Worker
    try {
      worker = new Worker(new URL('./runner.worker.ts', import.meta.url), {
        type: 'module',
      })
    } catch (e) {
      resolve({
        logs: [],
        tests: [],
        ok: false,
        error: 'Worker indisponível: ' + (e as Error).message,
        durationMs: 0,
      })
      return
    }

    let done = false
    const finish = (r: RunResult) => {
      if (done) return
      done = true
      clearTimeout(timer)
      worker.terminate()
      resolve(r)
    }

    const timer = setTimeout(() => {
      finish({
        logs: [],
        tests: [],
        ok: false,
        error: `Tempo excedido (${timeoutMs}ms) — possível loop infinito`,
        durationMs: timeoutMs,
      })
    }, timeoutMs)

    worker.onmessage = (e: MessageEvent<RunResult>) => finish(e.data)
    worker.onerror = (e) =>
      finish({
        logs: [],
        tests: [],
        ok: false,
        error: e.message || 'Erro ao executar',
        durationMs: 0,
      })

    worker.postMessage(req)
  })
}
