'use client'

import { Eye, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { transform } from 'sucrase'

function buildSrcDoc(compiled: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; background: #fff; color: #111; }
  #err { color: #c0392b; white-space: pre-wrap; font-family: ui-monospace, monospace; font-size: 13px; }
</style>
</head>
<body>
<div id="root"></div>
<pre id="err"></pre>
<script type="module">
  import React from 'https://esm.sh/react@19';
  import * as JSXRuntime from 'https://esm.sh/react@19/jsx-runtime';
  import { createRoot } from 'https://esm.sh/react-dom@19/client';
  const mods = { 'react': React, 'react/jsx-runtime': JSXRuntime, 'react/jsx-dev-runtime': JSXRuntime };
  const require = (m) => {
    if (m in mods) return mods[m];
    throw new Error('import de "' + m + '" não suportado no preview');
  };
  try {
    const exports = {};
    const module = { exports };
    (function (exports, module, require) {
${compiled}
    })(exports, module, require);
    const Comp = module.exports.default || module.exports.App ||
      Object.values(module.exports).find((v) => typeof v === 'function');
    if (!Comp) throw new Error('exporte um componente (export default) para ver o preview');
    createRoot(document.getElementById('root')).render(React.createElement(Comp));
  } catch (e) {
    document.getElementById('err').textContent = '✕ ' + (e && e.message ? e.message : String(e));
  }
</script>
</body>
</html>`
}

export function ReactPreview({
  code,
  onClose,
}: {
  code: string
  onClose?: () => void
}) {
  const [srcDoc, setSrcDoc] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const compiled = transform(code, {
        transforms: ['typescript', 'jsx', 'imports'],
      }).code
      setSrcDoc(buildSrcDoc(compiled))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [code])

  return (
    <div className='flex h-[55%] min-h-[200px] shrink-0 flex-col border-t border-white/[0.06] bg-[#0a0a0c]'>
      <div className='flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 font-mono text-[11px] tracking-wider text-zinc-400 uppercase'>
        <span className='flex items-center gap-1.5'>
          <Eye className='size-3.5' /> Preview
        </span>
        {onClose && (
          <button
            type='button'
            onClick={onClose}
            aria-label='Fechar preview'
            className='-mr-1 grid size-6 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white'
          >
            <X className='size-3.5' />
          </button>
        )}
      </div>
      {error ? (
        <div className='px-4 py-3 font-mono text-[12px] text-red-400'>
          ✕ {error}
        </div>
      ) : (
        <iframe
          title='preview'
          sandbox='allow-scripts'
          srcDoc={srcDoc}
          className='min-h-0 flex-1 bg-white'
        />
      )}
    </div>
  )
}
