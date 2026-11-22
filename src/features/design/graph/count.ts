// LABS01-219 — counting a diagram on the server.
//
// The design track had no correctness signal: submitDesign only refused an
// empty canvas, so a single box scored the whole challenge. This is the one
// piece of evidence the server can establish on its own, because
// /api/design-review already stores the scene it was sent.
//
// It is a floor, not a grade. The grade arrives with the rubric of
// LABS01-211, and the award should derive from it then.

export type GraphCount = { nodes: number; edges: number }

type Loose = Record<string, unknown>

function idsOf(value: unknown): Set<string> {
  const ids = new Set<string>()
  if (!Array.isArray(value)) return ids
  for (const item of value) {
    const id = (item as Loose)?.id
    if (typeof id === 'string' && id.trim()) ids.add(id)
  }
  return ids
}

/**
 * Nodes with an id, and edges whose two ends both point at one of those nodes.
 * Requiring the endpoints to resolve is what stops a hand-written scene from
 * passing with three nodes and a made-up edge between names that do not
 * exist.
 *
 * Returns null when there is no scene to read, or it is not a graph —
 * callers store null, and a null count never satisfies the award.
 */
export function countGraph(scene: string | undefined | null): GraphCount | null {
  if (!scene || typeof scene !== 'string') return null
  let parsed: unknown
  try {
    parsed = JSON.parse(scene)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null

  const graph = parsed as Loose
  if (!Array.isArray(graph.nodes)) return null

  const ids = idsOf(graph.nodes)
  let edges = 0
  if (Array.isArray(graph.edges)) {
    for (const item of graph.edges) {
      const e = item as Loose
      // The canvas writes source/target; an AI-generated graph arrives as
      // from/to before layoutAiGraph converts it. Accept both.
      const a = typeof e?.source === 'string' ? e.source : e?.from
      const b = typeof e?.target === 'string' ? e.target : e?.to
      if (typeof a === 'string' && typeof b === 'string' && a !== b) {
        if (ids.has(a) && ids.has(b)) edges++
      }
    }
  }
  return { nodes: ids.size, edges }
}
