import { describe, expect, it } from 'vitest'
import { countGraph } from './count'

const scene = (g: unknown) => JSON.stringify(g)

const THREE_NODES = {
  nodes: [
    { id: 'c', kind: 'client', label: 'App', x: 0, y: 0 },
    { id: 's', kind: 'service', label: 'API', x: 1, y: 0 },
    { id: 'd', kind: 'database', label: 'DB', x: 2, y: 0 },
  ],
  edges: [
    { id: 'e1', source: 'c', target: 's' },
    { id: 'e2', source: 's', target: 'd' },
  ],
}

describe('countGraph', () => {
  it('counts a diagram the canvas produced', () => {
    expect(countGraph(scene(THREE_NODES))).toEqual({ nodes: 3, edges: 2 })
  })

  it('accepts from/to as well, which is how an AI graph arrives', () => {
    expect(
      countGraph(
        scene({
          nodes: THREE_NODES.nodes,
          edges: [{ from: 'c', to: 's' }],
        }),
      ),
    ).toEqual({ nodes: 3, edges: 1 })
  })

  it('refuses an edge whose ends do not exist — the forged-scene case', () => {
    // Three real nodes plus an edge between names nobody drew: the node floor
    // would pass, the edge floor must not.
    const forged = {
      nodes: THREE_NODES.nodes,
      edges: [{ id: 'x', source: 'ghost-a', target: 'ghost-b' }],
    }
    expect(countGraph(scene(forged))).toEqual({ nodes: 3, edges: 0 })
  })

  it('refuses a self-loop as an edge', () => {
    expect(
      countGraph(
        scene({ nodes: THREE_NODES.nodes, edges: [{ source: 'c', target: 'c' }] }),
      ),
    ).toEqual({ nodes: 3, edges: 0 })
  })

  it('ignores nodes without an id and does not count duplicates twice', () => {
    expect(
      countGraph(
        scene({
          nodes: [
            { id: 'a', label: 'A' },
            { id: 'a', label: 'A again' },
            { label: 'no id' },
            { id: '   ' },
          ],
          edges: [],
        }),
      ),
    ).toEqual({ nodes: 1, edges: 0 })
  })

  it('returns null for anything that is not a graph', () => {
    // 10 of the 12 scored design sessions predate the `scene` field and stored
    // the text summary instead; those must count as no evidence, not as zero.
    expect(countGraph('Cliente -> API -> Banco (resumo em texto)')).toBeNull()
    expect(countGraph(undefined)).toBeNull()
    expect(countGraph(null)).toBeNull()
    expect(countGraph('')).toBeNull()
    expect(countGraph('{]')).toBeNull()
    expect(countGraph(scene({ edges: [] }))).toBeNull()
    expect(countGraph(scene([1, 2, 3]))).toBeNull()
    expect(countGraph(scene(42))).toBeNull()
  })

  it('counts an empty canvas as zero, not null', () => {
    expect(countGraph(scene({ nodes: [], edges: [] }))).toEqual({
      nodes: 0,
      edges: 0,
    })
  })

  it('survives edges that are not objects', () => {
    expect(
      countGraph(scene({ nodes: THREE_NODES.nodes, edges: [null, 7, 'x', {}] })),
    ).toEqual({ nodes: 3, edges: 0 })
  })

  it('the floor the award uses: 3 nodes and 1 edge', () => {
    const pass = countGraph(scene(THREE_NODES))!
    expect(pass.nodes >= 3 && pass.edges >= 1).toBe(true)
    // One box, which used to score a whole challenge.
    const oneBox = countGraph(
      scene({ nodes: [{ id: 'a', label: 'A' }], edges: [] }),
    )!
    expect(oneBox.nodes >= 3 && oneBox.edges >= 1).toBe(false)
  })
})
