'use client'

import '@excalidraw/excalidraw/index.css'
import { useT } from '@/lib/i18n'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { registerExcalidrawModule } from '../utils/excalidraw-registry'
import type { ExcalidrawApi } from '../utils/scene'

const copy = {
  en: { loadingCanvas: 'Loading canvas…' },
  pt: { loadingCanvas: 'Carregando canvas…' },
}

function CanvasLoading() {
  const t = useT(copy)
  return (
    <div className='grid h-full place-items-center text-sm text-muted-foreground'>
      <span className='flex items-center gap-2'>
        <Loader2 className='size-4 animate-spin' /> {t.loadingCanvas}
      </span>
    </div>
  )
}

const Excalidraw = dynamic(
  () =>
    import('@excalidraw/excalidraw').then((m) => {
      registerExcalidrawModule(m)
      return m.Excalidraw
    }),
  {
    ssr: false,
    loading: () => <CanvasLoading />,
  },
)

async function loadUserLibrary(api: ExcalidrawApi) {
  try {
    const res = await fetch('/design-library.excalidrawlib')
    if (!res.ok) return
    const data = (await res.json()) as {
      library?: unknown[]
      libraryItems?: unknown[]
    }
    const items = data.libraryItems ?? data.library
    if (!Array.isArray(items) || items.length === 0) return
    await api.updateLibrary({ libraryItems: items, merge: true })
  } catch {
    // library is optional — never break the canvas
  }
}

function useDarkMode(): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const update = () => setDark(el.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

export function DesignCanvas({
  initialElements,
  onApi,
  onChange,
}: {
  initialElements?: readonly unknown[]
  onApi: (api: ExcalidrawApi) => void
  onChange: (elements: readonly unknown[]) => void
}) {
  const dark = useDarkMode()
  return (
    <div className='h-full w-full'>
      <Excalidraw
        theme={dark ? 'dark' : 'light'}
        excalidrawAPI={(api) => {
          const wrapped = api as unknown as ExcalidrawApi
          onApi(wrapped)
          void loadUserLibrary(wrapped)
        }}
        onChange={(elements) => onChange(elements)}
        initialData={
          {
            elements: initialElements ?? [],
            appState: { viewBackgroundColor: '#ffffff' },
            scrollToContent: true,
          } as never
        }
      />
    </div>
  )
}
