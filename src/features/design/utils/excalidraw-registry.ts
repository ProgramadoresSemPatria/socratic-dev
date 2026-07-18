// The Excalidraw package may only enter the bundle through the ssr:false
// dynamic() loader in design-canvas.tsx — that loader target is the one thing
// the SSR compilation excludes. A bare import('@excalidraw/excalidraw')
// anywhere else drags ~2.8MB of Excalidraw (+ mermaid + cytoscape) into the
// server bundle, where it never executes.
//
// The loader registers the loaded module here; helpers await it. The promise
// only resolves after a canvas has mounted — the only situation in which the
// helpers are meaningful (building elements for / exporting from a canvas).
type ExcalidrawModule = typeof import('@excalidraw/excalidraw')

let resolveModule: (m: ExcalidrawModule) => void
const modulePromise = new Promise<ExcalidrawModule>((resolve) => {
  resolveModule = resolve
})

export function registerExcalidrawModule(m: ExcalidrawModule): void {
  resolveModule(m)
}

export function excalidrawModule(): Promise<ExcalidrawModule> {
  return modulePromise
}
