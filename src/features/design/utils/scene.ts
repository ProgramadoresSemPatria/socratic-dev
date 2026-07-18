import { excalidrawModule } from './excalidraw-registry'
import { getLibraryComponent, type LibraryComponent } from './library-components'

type SceneEl = {
  type?: string
  text?: string
  id?: string
  containerId?: string | null
  groupIds?: string[]
  startBinding?: { elementId?: string } | null
  endBinding?: { elementId?: string } | null
  x?: number
  y?: number
  width?: number
  height?: number
  points?: number[][]
  isDeleted?: boolean
}

export type ExcalidrawApi = {
  getSceneElements: () => readonly unknown[]
  getAppState: () => Record<string, unknown>
  getFiles: () => Record<string, unknown>
  updateScene: (scene: { elements: readonly unknown[] }) => void
  updateLibrary: (opts: {
    libraryItems: unknown
    merge?: boolean
    prompt?: boolean
    openLibraryMenu?: boolean
    defaultStatus?: 'published' | 'unpublished'
  }) => Promise<unknown>
  scrollToContent: (
    target?: readonly unknown[],
    opts?: { fitToContent?: boolean; animate?: boolean },
  ) => void
}

type SceneNode = {
  id: string
  label: string
  type?: string
  note?: string
  tier?: number
}
type SceneEdge = { from: string; to: string; label?: string; dashed?: boolean }

const STROKE = '#1b1916'

type Kind =
  | 'client'
  | 'cdn'
  | 'lb'
  | 'gateway'
  | 'service'
  | 'worker'
  | 'external'
  | 'queue'
  | 'cache'
  | 'database'
  | 'storage'
  | 'search'

const SPEC: Record<Kind, { w: number; h: number; fill: string; tier: number }> = {
  client:   { w: 240, h: 110, fill: '#F7F9FA', tier: 0 },
  cdn:      { w: 270, h: 130, fill: '#DFE5E9', tier: 1 },
  lb:       { w: 250, h: 110, fill: '#EAE7E4', tier: 1 },
  gateway:  { w: 250, h: 110, fill: '#EAE7E4', tier: 1 },
  service:  { w: 260, h: 110, fill: '#EEEBFF', tier: 2 },
  worker:   { w: 250, h: 110, fill: '#EEEBFF', tier: 2 },
  external: { w: 270, h: 130, fill: '#DFE5E9', tier: 2 },
  queue:    { w: 250, h: 110, fill: '#DDD2C7', tier: 3 },
  cache:    { w: 210, h: 130, fill: '#DAD8EA', tier: 3 },
  database: { w: 230, h: 150, fill: '#E8EFDB', tier: 4 },
  storage:  { w: 230, h: 120, fill: '#E8EFDB', tier: 4 },
  search:   { w: 240, h: 120, fill: '#E8EFDB', tier: 4 },
}

const ALIAS: Record<string, Kind> = {
  user: 'client', users: 'client', mobile: 'client', web: 'client',
  frontend: 'client', browser: 'client', app: 'client',
  loadbalancer: 'lb', 'load-balancer': 'lb', nginx: 'lb',
  proxy: 'gateway', 'api-gateway': 'gateway', apigateway: 'gateway',
  api: 'service', server: 'service', backend: 'service', microservice: 'service',
  'third-party': 'external', saas: 'external',
  broker: 'queue', kafka: 'queue', rabbitmq: 'queue', sqs: 'queue',
  pubsub: 'queue', 'message-queue': 'queue',
  redis: 'cache', memcached: 'cache',
  db: 'database', sql: 'database', postgres: 'database', mysql: 'database',
  mongo: 'database', mongodb: 'database', nosql: 'database',
  s3: 'storage', blob: 'storage', bucket: 'storage', files: 'storage',
  'object-storage': 'storage',
  elasticsearch: 'search', elastic: 'search', opensearch: 'search',
  solr: 'search', 'search-engine': 'search',
  job: 'worker', cron: 'worker', consumer: 'worker', batch: 'worker',
}

function kindOf(type?: string): Kind {
  const k = (type ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-')
  if (k in SPEC) return k as Kind
  return ALIAS[k] ?? 'service'
}

// How much wider the shape must be than the text so the label fits its
// usable inner area (diamond/ellipse have less horizontal room than rects).
const TEXT_FACTOR: Record<Kind, number> = {
  client: 1, cdn: 1.9, lb: 1.06, gateway: 1.06, service: 1, worker: 1,
  external: 1.9, queue: 1.12, cache: 2, database: 1.05, storage: 1.05,
  search: 1.05,
}

type PlacedNode = SceneNode & { kind: Kind }
type Box = { x: number; y: number; w: number; h: number; fontSize: number }

function nodeSize(n: PlacedNode): { w: number; h: number; fontSize: number } {
  const comp = getLibraryComponent(n.kind)
  if (comp) {
    const fontSize = 16
    const lines = n.note ? [n.label, n.note] : [n.label]
    const maxLen = Math.max(...lines.map((l) => l.length))
    const textW = maxLen * fontSize * 0.62 + 24
    const w = Math.round(Math.min(460, Math.max(comp.width, textW)))
    const labelH = lines.length * fontSize * 1.3 + 16
    return { w, h: Math.round(comp.height + labelH), fontSize }
  }
  const s = SPEC[n.kind]
  const fontSize = n.note ? 16 : 20
  const lines = n.note ? [n.label, n.note] : [n.label]
  const maxLen = Math.max(...lines.map((l) => l.length))
  const textW = maxLen * fontSize * 0.62 + 52
  const w = Math.round(Math.min(460, Math.max(s.w, textW * TEXT_FACTOR[n.kind])))
  return { w, h: n.note ? s.h + 14 : s.h, fontSize }
}

// Stamp a curated library component: clone with node-scoped ids and a shared
// group, icon at the top of the layout box, hand-written label centered below
// (consistent placement — the source items each anchor titles differently).
function stampSkeleton(
  n: PlacedNode,
  b: Box,
  comp: LibraryComponent,
): Record<string, unknown>[] {
  const offX = b.x + (b.w - comp.width) / 2
  const offY = b.y
  const g = [`g-${n.id}`]
  const out: Record<string, unknown>[] = []
  comp.elements.forEach((el, i) => {
    if (i === comp.titleIndex) return
    const clone: Record<string, unknown> = { ...el }
    clone.id = i === comp.bindIndex ? n.id : `${n.id}-k${i}`
    clone.groupIds = g
    clone.x = (el.x as number) + offX
    clone.y = (el.y as number) + offY
    if (Array.isArray(el.points)) {
      clone.points = (el.points as number[][]).map((p) => [...p])
    }
    out.push(clone)
  })

  const fontSize = 16
  const text = n.note ? `${n.label}\n${n.note}` : n.label
  const lines = text.split('\n')
  const estW = Math.max(...lines.map((l) => l.length)) * fontSize * 0.62
  const estH = lines.length * fontSize * 1.3
  out.push({
    type: 'text',
    id: `${n.id}-label`,
    text,
    fontSize,
    fontFamily: 1,
    textAlign: 'center',
    strokeColor: STROKE,
    width: estW,
    height: estH,
    x: b.x + b.w / 2 - estW / 2,
    y: offY + comp.height + 12,
    groupIds: g,
  })
  return out
}

function nodeSkeleton(n: PlacedNode, b: Box): Record<string, unknown>[] {
  const { x, y, w, h, fontSize } = b
  const fill = SPEC[n.kind].fill
  const base = {
    strokeColor: STROKE,
    strokeWidth: 2,
    roughness: 1,
    fillStyle: 'solid',
  }
  const label = {
    text: n.note ? `${n.label}\n${n.note}` : n.label,
    fontSize,
    strokeColor: STROKE,
  }
  const g = [`g-${n.id}`]

  switch (n.kind) {
    case 'database':
    case 'storage': {
      const rim = Math.min(38, Math.round(h * 0.26))
      return [
        { type: 'ellipse', x, y: y + h - rim, width: w, height: rim, backgroundColor: fill, groupIds: g, ...base },
        { type: 'rectangle', id: n.id, x, y: y + rim / 2, width: w, height: h - rim, backgroundColor: fill, label, groupIds: g, ...base, strokeColor: 'transparent' },
        { type: 'line', x, y: y + rim / 2, width: 0, height: h - rim, points: [[0, 0], [0, h - rim]], groupIds: g, ...base },
        { type: 'line', x: x + w, y: y + rim / 2, width: 0, height: h - rim, points: [[0, 0], [0, h - rim]], groupIds: g, ...base },
        { type: 'ellipse', x, y, width: w, height: rim, backgroundColor: fill, groupIds: g, ...base },
      ]
    }
    case 'external':
    case 'cdn':
      return [
        { type: 'ellipse', x, y: y + h * 0.3, width: w * 0.46, height: h * 0.62, backgroundColor: fill, groupIds: g, ...base },
        { type: 'ellipse', x: x + w * 0.54, y: y + h * 0.28, width: w * 0.46, height: h * 0.64, backgroundColor: fill, groupIds: g, ...base },
        { type: 'ellipse', id: n.id, x: x + w * 0.12, y, width: w * 0.76, height: h, backgroundColor: fill, label, groupIds: g, ...base },
      ]
    case 'cache':
      return [
        { type: 'diamond', id: n.id, x, y, width: w, height: h, backgroundColor: fill, roundness: { type: 2 }, label, ...base },
      ]
    case 'gateway':
    case 'lb':
      return [
        { type: 'rectangle', id: n.id, x, y, width: w, height: h, backgroundColor: fill, roundness: { type: 3 }, label, groupIds: g, ...base },
        { type: 'rectangle', x: x + 7, y: y + 7, width: w - 14, height: h - 14, backgroundColor: 'transparent', roundness: { type: 3 }, groupIds: g, ...base, strokeWidth: 1 },
      ]
    case 'queue': {
      const slot = (i: number) => ({
        type: 'line',
        x: x + w - 22 - i * 14,
        y: y + h / 2 - 15,
        width: 0,
        height: 30,
        points: [[0, 0], [0, 30]],
        groupIds: g,
        ...base,
        strokeWidth: 1,
      })
      return [
        { type: 'rectangle', id: n.id, x, y, width: w, height: h, backgroundColor: fill, roundness: { type: 3 }, label, groupIds: g, ...base },
        slot(0), slot(1), slot(2),
      ]
    }
    case 'client':
      return [
        { type: 'rectangle', id: n.id, x, y, width: w, height: h, backgroundColor: fill, roundness: { type: 3 }, label, groupIds: g, ...base },
        { type: 'line', x: x + w / 2 - 22, y: y + h - 11, width: 44, height: 0, points: [[0, 0], [44, 0]], groupIds: g, ...base },
      ]
    case 'worker':
      return [
        { type: 'rectangle', id: n.id, x, y, width: w, height: h, backgroundColor: fill, roundness: { type: 3 }, label, ...base, strokeStyle: 'dashed' },
      ]
    default:
      return [
        { type: 'rectangle', id: n.id, x, y, width: w, height: h, backgroundColor: fill, roundness: { type: 3 }, label, ...base },
      ]
  }
}

// Longest-path layering from sources (Kahn); type tier as fallback for
// isolated nodes and cycle leftovers; node.tier overrides everything.
function computeLayers(
  nodeList: PlacedNode[],
  edgeList: SceneEdge[],
): Map<string, number> {
  const out = new Map<string, string[]>()
  const remaining = new Map<string, number>()
  const touched = new Set<string>()
  for (const n of nodeList) {
    out.set(n.id, [])
    remaining.set(n.id, 0)
  }
  for (const e of edgeList) {
    out.get(e.from)!.push(e.to)
    remaining.set(e.to, (remaining.get(e.to) ?? 0) + 1)
    touched.add(e.from)
    touched.add(e.to)
  }

  const layer = new Map<string, number>()
  const queue: string[] = []
  for (const n of nodeList) {
    if (touched.has(n.id) && remaining.get(n.id) === 0) {
      layer.set(n.id, 0)
      queue.push(n.id)
    }
  }
  while (queue.length) {
    const u = queue.shift()!
    for (const v of out.get(u) ?? []) {
      layer.set(v, Math.max(layer.get(v) ?? 0, (layer.get(u) ?? 0) + 1))
      const d = (remaining.get(v) ?? 0) - 1
      remaining.set(v, d)
      if (d === 0) queue.push(v)
    }
  }

  for (const n of nodeList) {
    if (typeof n.tier === 'number') {
      layer.set(n.id, Math.max(0, Math.round(n.tier)))
      continue
    }
    if (!touched.has(n.id)) {
      layer.set(n.id, SPEC[n.kind].tier)
      continue
    }
    if (!layer.has(n.id)) {
      let best = SPEC[n.kind].tier
      for (const e of edgeList) {
        if (e.to === n.id && layer.has(e.from)) {
          best = Math.max(best, layer.get(e.from)! + 1)
        }
      }
      layer.set(n.id, best)
    }
  }

  const values = [...new Set(layer.values())].sort((a, b) => a - b)
  const remap = new Map(values.map((v, i) => [v, i]))
  for (const [k, v] of layer) layer.set(k, remap.get(v)!)
  return layer
}

type Rect = { minX: number; minY: number; maxX: number; maxY: number }

function exitPoint(r: Rect, tx: number, ty: number): [number, number] {
  const cx = (r.minX + r.maxX) / 2
  const cy = (r.minY + r.maxY) / 2
  const dx = tx - cx
  const dy = ty - cy
  const s = Math.min(
    (r.maxX - r.minX) / 2 / (Math.abs(dx) || 1e-6),
    (r.maxY - r.minY) / 2 / (Math.abs(dy) || 1e-6),
  )
  return [cx + dx * s, cy + dy * s]
}

function segmentHitsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: Rect,
  pad: number,
): boolean {
  const minX = r.minX - pad
  const minY = r.minY - pad
  const maxX = r.maxX + pad
  const maxY = r.maxY + pad
  if (Math.max(x1, x2) < minX || Math.min(x1, x2) > maxX) return false
  if (Math.max(y1, y2) < minY || Math.min(y1, y2) > maxY) return false
  const corners: [number, number][] = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ]
  const side = (px: number, py: number) =>
    (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1)
  let pos = false
  let neg = false
  for (const [px, py] of corners) {
    const s = side(px, py)
    if (s > 0) pos = true
    if (s < 0) neg = true
  }
  return pos && neg
}

type XArrow = {
  id?: string
  type?: string
  x: number
  y: number
  width?: number
  height?: number
  points?: number[][]
  containerId?: string | null
  groupIds?: string[]
  startBinding?: { elementId: string; focus?: number; gap?: number } | null
  endBinding?: { elementId: string; focus?: number; gap?: number } | null
}

// convertToExcalidrawElements re-routes every bound arrow center-to-center
// (focus 0), which stacks A→B on top of B→A and drives arrows straight
// through intermediate nodes. Re-route after conversion: parallel offsets
// for bidirectional pairs, side-channel waypoints around obstacles.
function routeArrows(converted: readonly unknown[]): void {
  const els = converted as XArrow[]

  const compOfEl = new Map<string, Rect>()
  const compKeyOfEl = new Map<string, string>()
  const rects = new Map<string, Rect>()
  for (const e of els) {
    if (e.type === 'arrow') continue
    if (e.type === 'text' && (e.containerId || !e.groupIds?.length)) continue
    const key = e.groupIds?.[0] ?? e.id
    if (!key) continue
    let r = rects.get(key)
    if (!r) {
      r = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      rects.set(key, r)
    }
    let w = e.width ?? 0
    let h = e.height ?? 0
    let x = e.x
    let y = e.y
    if (Array.isArray(e.points) && e.points.length) {
      const xs = e.points.map((p) => p[0])
      const ys = e.points.map((p) => p[1])
      x = e.x + Math.min(...xs)
      y = e.y + Math.min(...ys)
      w = Math.max(...xs) - Math.min(...xs)
      h = Math.max(...ys) - Math.min(...ys)
    }
    r.minX = Math.min(r.minX, x)
    r.minY = Math.min(r.minY, y)
    r.maxX = Math.max(r.maxX, x + w)
    r.maxY = Math.max(r.maxY, y + h)
    if (e.id) {
      compOfEl.set(e.id, r)
      compKeyOfEl.set(e.id, key)
    }
  }

  const labelOf = new Map<string, XArrow>()
  for (const e of els) {
    if (e.type === 'text' && e.containerId) labelOf.set(e.containerId, e)
  }

  const arrows = els.filter(
    (e) =>
      e.type === 'arrow' &&
      e.startBinding?.elementId &&
      e.endBinding?.elementId &&
      compOfEl.has(e.startBinding.elementId) &&
      compOfEl.has(e.endBinding.elementId),
  )

  const pairCount = new Map<string, XArrow[]>()
  for (const a of arrows) {
    const k1 = compKeyOfEl.get(a.startBinding!.elementId)!
    const k2 = compKeyOfEl.get(a.endBinding!.elementId)!
    const key = [k1, k2].sort().join('~')
    if (!pairCount.has(key)) pairCount.set(key, [])
    pairCount.get(key)!.push(a)
  }

  for (const a of arrows) {
    const from = compOfEl.get(a.startBinding!.elementId)!
    const to = compOfEl.get(a.endBinding!.elementId)!
    const fromKey = compKeyOfEl.get(a.startBinding!.elementId)!
    const toKey = compKeyOfEl.get(a.endBinding!.elementId)!
    const pairKey = [fromKey, toKey].sort().join('~')
    const pair = pairCount.get(pairKey)!

    const fcx = (from.minX + from.maxX) / 2
    const fcy = (from.minY + from.maxY) / 2
    const tcx = (to.minX + to.maxX) / 2
    const tcy = (to.minY + to.maxY) / 2
    const len = Math.hypot(tcx - fcx, tcy - fcy) || 1
    const px = -(tcy - fcy) / len
    const py = (tcx - fcx) / len

    // The perpendicular flips with travel direction, so a constant offset
    // puts the two arrows of an A↔B pair on opposite sides of the axis.
    const off = pair.length > 1 ? 16 : 0

    let [sx, sy] = exitPoint(from, tcx + px * off, tcy + py * off)
    let [ex, ey] = exitPoint(to, fcx + px * off, fcy + py * off)
    sx += px * off
    sy += py * off
    ex += px * off
    ey += py * off

    const obstacles: Rect[] = []
    for (const [key, r] of rects) {
      if (key === fromKey || key === toKey) continue
      if (segmentHitsRect(sx, sy, ex, ey, r, 18)) obstacles.push(r)
    }

    let waypoint: [number, number] | null = null
    if (obstacles.length) {
      const vertical = Math.abs(ey - sy) >= Math.abs(ex - sx)
      if (vertical) {
        const left = Math.min(...obstacles.map((o) => o.minX))
        const right = Math.max(...obstacles.map((o) => o.maxX))
        const mid = (sx + ex) / 2
        const channelX =
          Math.abs(mid - left) <= Math.abs(right - mid)
            ? left - 70
            : right + 70
        waypoint = [channelX, (sy + ey) / 2]
      } else {
        const top = Math.min(...obstacles.map((o) => o.minY))
        const bottom = Math.max(...obstacles.map((o) => o.maxY))
        const mid = (sy + ey) / 2
        const channelY =
          Math.abs(mid - top) <= Math.abs(bottom - mid)
            ? top - 60
            : bottom + 60
        waypoint = [(sx + ex) / 2, channelY]
      }
      ;[sx, sy] = exitPoint(from, waypoint[0], waypoint[1])
      ;[ex, ey] = exitPoint(to, waypoint[0], waypoint[1])
    }

    const pts: number[][] = [[0, 0]]
    if (waypoint) pts.push([waypoint[0] - sx, waypoint[1] - sy])
    pts.push([ex - sx, ey - sy])

    a.x = sx
    a.y = sy
    a.points = pts
    a.width = Math.max(...pts.map((p) => Math.abs(p[0])))
    a.height = Math.max(...pts.map((p) => Math.abs(p[1])))
    if (off !== 0) {
      const f = 0.25 * Math.sign(off)
      if (a.startBinding) a.startBinding.focus = f
      if (a.endBinding) a.endBinding.focus = -f
    }

    const label = a.id ? labelOf.get(a.id) : undefined
    if (label) {
      const mid = waypoint ?? [(sx + ex) / 2, (sy + ey) / 2]
      label.x = mid[0] - (label.width ?? 0) / 2
      label.y = mid[1] - (label.height ?? 0) / 2
    }
  }
}

export async function buildSceneElements(
  nodes: { id: string; label: string; type?: string; note?: string; tier?: number }[],
  edges: { from: string; to: string; label?: string; dashed?: boolean }[],
): Promise<readonly unknown[]> {
  const { convertToExcalidrawElements } = await excalidrawModule()

  const COL_GAP = 96
  const ROW_GAP = 150

  const seen = new Set<string>()
  const nodeList: PlacedNode[] = []
  for (const raw of nodes ?? []) {
    const id = String(raw.id ?? '').trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    nodeList.push({
      ...raw,
      id,
      label: String(raw.label ?? id),
      kind: kindOf(raw.type),
    })
  }
  if (nodeList.length === 0) return []

  const idSet = new Set(nodeList.map((n) => n.id))
  const byLabel = new Map(
    nodeList.map((n) => [n.label.trim().toLowerCase(), n.id]),
  )
  const resolve = (ref: unknown): string | undefined => {
    const r = String(ref ?? '').trim()
    return idSet.has(r) ? r : byLabel.get(r.toLowerCase())
  }

  const edgeList: SceneEdge[] = []
  const edgeSeen = new Set<string>()
  for (const e of edges ?? []) {
    const from = resolve(e.from)
    const to = resolve(e.to)
    if (!from || !to || from === to) continue
    const key = `${from}->${to}`
    if (edgeSeen.has(key)) continue
    edgeSeen.add(key)
    edgeList.push({ from, to, label: e.label, dashed: e.dashed })
  }

  const layer = computeLayers(nodeList, edgeList)
  const layers = new Map<number, PlacedNode[]>()
  for (const n of nodeList) {
    const l = layer.get(n.id)!
    if (!layers.has(l)) layers.set(l, [])
    layers.get(l)!.push(n)
  }
  const layerKeys = [...layers.keys()].sort((a, b) => a - b)

  const parentsOf = new Map<string, string[]>()
  for (const e of edgeList) {
    if (!parentsOf.has(e.to)) parentsOf.set(e.to, [])
    parentsOf.get(e.to)!.push(e.from)
  }

  // Order each row by barycenter of already-ranked parents (fewer crossings).
  const rank = new Map<string, number>()
  for (const lk of layerKeys) {
    const row = layers.get(lk)!
    const scored = row.map((n, i) => {
      const ps = (parentsOf.get(n.id) ?? []).filter((p) => rank.has(p))
      const score = ps.length
        ? ps.reduce((acc, p) => acc + rank.get(p)!, 0) / ps.length
        : 0.5
      return { n, i, score }
    })
    scored.sort((a, b) => a.score - b.score || a.i - b.i)
    layers.set(lk, scored.map((s) => s.n))
    scored.forEach((s, idx) => rank.set(s.n.id, (idx + 0.5) / scored.length))
  }

  const rows = layerKeys.map((lk) => {
    const sized = layers.get(lk)!.map((n) => ({ n, ...nodeSize(n) }))
    const totalW =
      sized.reduce((acc, s) => acc + s.w, 0) +
      COL_GAP * Math.max(0, sized.length - 1)
    const maxH = Math.max(...sized.map((s) => s.h))
    return { sized, totalW, maxH }
  })
  const canvasW = Math.max(...rows.map((r) => r.totalW))

  const box = new Map<string, Box>()
  let cursorY = 0
  for (const { sized, totalW, maxH } of rows) {
    let cursorX = (canvasW - totalW) / 2
    for (const s of sized) {
      box.set(s.n.id, {
        x: cursorX,
        y: cursorY + (maxH - s.h) / 2,
        w: s.w,
        h: s.h,
        fontSize: s.fontSize,
      })
      cursorX += s.w + COL_GAP
    }
    cursorY += maxH + ROW_GAP
  }

  const skeleton: Record<string, unknown>[] = []
  for (const lk of layerKeys) {
    for (const n of layers.get(lk)!) {
      const comp = getLibraryComponent(n.kind)
      skeleton.push(
        ...(comp
          ? stampSkeleton(n, box.get(n.id)!, comp)
          : nodeSkeleton(n, box.get(n.id)!)),
      )
    }
  }

  for (const e of edgeList) {
    const a = box.get(e.from)!
    const b = box.get(e.to)!
    const ra = { minX: a.x, minY: a.y, maxX: a.x + a.w, maxY: a.y + a.h }
    const rb = { minX: b.x, minY: b.y, maxX: b.x + b.w, maxY: b.y + b.h }
    const [sx, sy] = exitPoint(ra, b.x + b.w / 2, b.y + b.h / 2)
    const [ex, ey] = exitPoint(rb, a.x + a.w / 2, a.y + a.h / 2)
    skeleton.push({
      type: 'arrow',
      x: sx,
      y: sy,
      points: [
        [0, 0],
        [ex - sx, ey - sy],
      ],
      start: { id: e.from },
      end: { id: e.to },
      strokeColor: STROKE,
      strokeWidth: 2,
      roughness: 1,
      ...(e.dashed ? { strokeStyle: 'dashed' } : {}),
      ...(e.label ? { label: { text: e.label, fontSize: 12 } } : {}),
    })
  }

  const converted = convertToExcalidrawElements(
    skeleton as never,
  ) as readonly unknown[]
  routeArrows(converted)
  return converted
}

export function summarizeElements(elements: readonly unknown[]): string {
  const els = (elements as SceneEl[]).filter((e) => !e.isDeleted)
  if (els.length === 0) return 'O canvas está vazio — nada desenhado ainda.'

  const labelByContainer = new Map<string, string>()
  const looseTexts: { text: string; cx: number; cy: number }[] = []
  // Stamped library components carry a standalone title text sharing the
  // group id — treat it as the component label, not as a loose annotation.
  const groupTexts: { gid: string; text: string; cx: number; cy: number }[] = []
  for (const e of els) {
    if (e.type === 'text' && e.text?.trim()) {
      const txt = e.text.trim()
      const entry = {
        text: txt,
        cx: (e.x ?? 0) + (e.width ?? 0) / 2,
        cy: (e.y ?? 0) + (e.height ?? 0) / 2,
      }
      if (e.containerId) {
        labelByContainer.set(e.containerId, txt)
      } else if (e.groupIds?.[0]) {
        groupTexts.push({ gid: e.groupIds[0], ...entry })
      } else {
        looseTexts.push(entry)
      }
    }
  }

  // Composite nodes share groupIds — collapse each group into one component.
  type Comp = {
    label: string
    note?: string
    minX: number
    minY: number
    maxX: number
    maxY: number
    cx: number
    cy: number
  }
  const compByKey = new Map<string, Comp>()
  const compOfElement = new Map<string, Comp>()
  let anon = 0
  for (const e of els) {
    if (!['rectangle', 'ellipse', 'diamond'].includes(e.type ?? '')) continue
    const key = e.groupIds?.[0] ?? e.id ?? `anon-${anon++}`
    let c = compByKey.get(key)
    if (!c) {
      c = {
        label: '',
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        cx: 0,
        cy: 0,
      }
      compByKey.set(key, c)
    }
    c.minX = Math.min(c.minX, e.x ?? 0)
    c.minY = Math.min(c.minY, e.y ?? 0)
    c.maxX = Math.max(c.maxX, (e.x ?? 0) + (e.width ?? 0))
    c.maxY = Math.max(c.maxY, (e.y ?? 0) + (e.height ?? 0))
    if (e.id) compOfElement.set(e.id, c)
    const raw = e.id ? labelByContainer.get(e.id) : undefined
    if (raw && !c.label) {
      const [first, ...rest] = raw.split('\n')
      c.label = first.trim()
      const note = rest.join(' ').trim()
      if (note) c.note = note
    }
  }
  for (const t of groupTexts) {
    const c = compByKey.get(t.gid)
    if (!c) {
      looseTexts.push(t)
      continue
    }
    const [first, ...rest] = t.text.split('\n')
    if (!c.label) {
      c.label = first.trim()
      const note = rest.join(' ').trim()
      if (note) c.note = c.note ? `${c.note}; ${note}` : note
    } else {
      c.note = c.note ? `${c.note}; ${t.text}` : t.text
    }
  }

  const comps = [...compByKey.values()]
  for (const c of comps) {
    c.cx = (c.minX + c.maxX) / 2
    c.cy = (c.minY + c.maxY) / 2
    if (!c.label) c.label = 'componente'
  }

  const nearest = (x: number, y: number): Comp | null => {
    let best: Comp | null = null
    let bd = Infinity
    for (const c of comps) {
      const d = (c.cx - x) ** 2 + (c.cy - y) ** 2
      if (d < bd) {
        bd = d
        best = c
      }
    }
    return best && bd < 240 * 240 ? best : null
  }

  for (const t of looseTexts) {
    const c = nearest(t.cx, t.cy)
    if (c) c.note = c.note ? `${c.note}; ${t.text}` : t.text
  }

  const connections: string[] = []
  for (const e of els) {
    if (e.type !== 'arrow' && e.type !== 'line') continue
    if (e.groupIds?.[0] && compByKey.has(e.groupIds[0])) continue
    let from = e.startBinding?.elementId
      ? (compOfElement.get(e.startBinding.elementId) ?? null)
      : null
    let to = e.endBinding?.elementId
      ? (compOfElement.get(e.endBinding.elementId) ?? null)
      : null
    const pts = e.points ?? []
    if ((!from || !to) && pts.length >= 2) {
      const last = pts[pts.length - 1]
      from =
        from ??
        nearest((e.x ?? 0) + (pts[0][0] ?? 0), (e.y ?? 0) + (pts[0][1] ?? 0))
      to =
        to ??
        nearest((e.x ?? 0) + (last[0] ?? 0), (e.y ?? 0) + (last[1] ?? 0))
    }
    if (!from || !to || from === to) continue
    const lbl = e.id ? labelByContainer.get(e.id) : undefined
    connections.push(
      lbl
        ? `${from.label} →(${lbl}) ${to.label}`
        : `${from.label} → ${to.label}`,
    )
  }

  const nodesTxt = comps
    .map((c) => (c.note ? `${c.label} (${c.note})` : c.label))
    .join(', ')

  const lines = [
    `Elementos no canvas: ${els.length} (${comps.length} formas, ${connections.length} conexões).`,
    comps.length ? `Nós: ${nodesTxt}.` : 'Ainda não há formas com rótulo.',
  ]
  if (connections.length) {
    lines.push(`Conexões (setas): ${connections.join('; ')}.`)
  }
  return lines.join('\n')
}

export async function exportScenePng(api: ExcalidrawApi): Promise<string | null> {
  const { exportToBlob } = await excalidrawModule()
  const blob = await exportToBlob({
    elements: api.getSceneElements(),
    appState: {
      ...api.getAppState(),
      exportBackground: true,
      exportWithDarkMode: false,
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
