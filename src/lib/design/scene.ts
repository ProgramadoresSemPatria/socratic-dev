type SceneEl = {
  type?: string
  text?: string
  id?: string
  containerId?: string | null
  startBinding?: { elementId?: string } | null
  endBinding?: { elementId?: string } | null
  isDeleted?: boolean
}

export type ExcalidrawApi = {
  getSceneElements: () => readonly unknown[]
  getAppState: () => Record<string, unknown>
  getFiles: () => Record<string, unknown>
  updateScene: (scene: { elements: readonly unknown[] }) => void
}

const NODE_STYLE: Record<
  string,
  { shape: 'rectangle' | 'ellipse' | 'diamond'; emoji: string; bg: string }
> = {
  client: { shape: 'ellipse', emoji: '👤', bg: '#e7f0ff' },
  gateway: { shape: 'rectangle', emoji: '🚪', bg: '#fff1e6' },
  service: { shape: 'rectangle', emoji: '⚙️', bg: '#f1f0fb' },
  database: { shape: 'ellipse', emoji: '🗄️', bg: '#e8f8ee' },
  cache: { shape: 'diamond', emoji: '⚡', bg: '#fff7d6' },
  queue: { shape: 'rectangle', emoji: '📨', bg: '#eafaf5' },
  storage: { shape: 'ellipse', emoji: '📦', bg: '#f3eefe' },
  external: { shape: 'rectangle', emoji: '☁️', bg: '#eef0f2' },
}

export async function buildSceneElements(
  nodes: { id: string; label: string; type?: string; note?: string }[],
  edges: { from: string; to: string; label?: string }[],
): Promise<readonly unknown[]> {
  const { convertToExcalidrawElements } = await import('@excalidraw/excalidraw')
  const COLS = 3
  const W = 240
  const H = 104
  const GAP_X = 140
  const GAP_Y = 140

  const pos = new Map<string, { x: number; y: number }>()
  nodes.forEach((n, i) => {
    pos.set(n.id, {
      x: (i % COLS) * (W + GAP_X),
      y: Math.floor(i / COLS) * (H + GAP_Y),
    })
  })

  const skeleton: unknown[] = nodes.map((n) => {
    const p = pos.get(n.id)!
    const st = NODE_STYLE[n.type ?? ''] ?? NODE_STYLE.service
    return {
      type: st.shape,
      id: n.id,
      x: p.x,
      y: p.y,
      width: W,
      height: H,
      backgroundColor: st.bg,
      label: {
        text: n.note
          ? `${st.emoji} ${n.label}\n${n.note}`
          : `${st.emoji} ${n.label}`,
        fontSize: 16,
      },
    }
  })

  const byId = new Map(nodes.map((n) => [n.id, n.id]))
  const byLabel = new Map(nodes.map((n) => [n.label.trim().toLowerCase(), n.id]))
  const resolve = (ref: string): string | undefined =>
    byId.get(ref) ?? byLabel.get((ref ?? '').trim().toLowerCase())

  for (const e of edges) {
    const fromId = resolve(e.from)
    const toId = resolve(e.to)
    if (!fromId || !toId || fromId === toId) continue
    const a = pos.get(fromId)!
    const b = pos.get(toId)!
    const ax = a.x + W / 2
    const ay = a.y + H / 2
    const bx = b.x + W / 2
    const by = b.y + H / 2
    skeleton.push({
      type: 'arrow',
      x: ax,
      y: ay,
      points: [
        [0, 0],
        [bx - ax, by - ay],
      ],
      start: { id: fromId },
      end: { id: toId },
      ...(e.label ? { label: { text: e.label } } : {}),
    })
  }

  skeleton.unshift({
    type: 'text',
    x: 0,
    y: -64,
    text: 'Arquitetura sugerida — siga as setas pra entender o fluxo',
    fontSize: 20,
  })

  return convertToExcalidrawElements(skeleton as never) as readonly unknown[]
}

export function summarizeElements(elements: readonly unknown[]): string {
  const els = (elements as SceneEl[]).filter((e) => !e.isDeleted)
  if (els.length === 0) return 'O canvas está vazio — nada desenhado ainda.'

  const labelByContainer = new Map<string, string>()
  const standalone: string[] = []
  for (const e of els) {
    if (e.type === 'text' && e.text?.trim()) {
      const t = e.text.trim()
      if (e.containerId) labelByContainer.set(e.containerId, t)
      else standalone.push(t)
    }
  }

  const boxes = [...labelByContainer.values(), ...standalone]
  const connections: string[] = []
  for (const e of els) {
    if (e.type !== 'arrow' && e.type !== 'line') continue
    const fromL = (e.startBinding?.elementId &&
      labelByContainer.get(e.startBinding.elementId)) || '?'
    const toL = (e.endBinding?.elementId &&
      labelByContainer.get(e.endBinding.elementId)) || '?'
    connections.push(`${fromL} → ${toL}`)
  }

  const shapes = els.filter((e) =>
    ['rectangle', 'ellipse', 'diamond'].includes(e.type ?? ''),
  ).length

  const lines = [
    `Elementos no canvas: ${els.length} (${shapes} formas, ${connections.length} conexões).`,
    boxes.length
      ? `Nós/rótulos: ${boxes.join(', ')}.`
      : 'Ainda não há rótulos de texto nas formas.',
  ]
  if (connections.length) lines.push(`Conexões (setas): ${connections.join('; ')}.`)
  return lines.join('\n')
}

export async function exportScenePng(api: ExcalidrawApi): Promise<string | null> {
  const { exportToBlob } = await import('@excalidraw/excalidraw')
  const blob = await exportToBlob({
    elements: api.getSceneElements(),
    appState: {
      ...api.getAppState(),
      exportBackground: true,
      viewBackgroundColor: '#ffffff',
    },
    files: api.getFiles(),
    mimeType: 'image/png',
  } as never)
  return blobToBase64(blob)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
