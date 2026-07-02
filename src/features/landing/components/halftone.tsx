'use client'

import * as React from 'react'

export type Painter = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) => void

type HalftoneProps = {
  draw: Painter
  active?: boolean
  ambient?: boolean
  mode?: 'dots' | 'dashes'
  spacing?: number
  flow?: number
  interactive?: boolean
  color?: string
  className?: string
}

export function glyph(text: string, widthFactor: number): Painter {
  return (ctx, w, h) => {
    const size = Math.min(h * 0.85, w / widthFactor)
    ctx.font = `700 ${size}px ui-monospace, Menlo, Consolas, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)
  }
}

export const paintArchitecture: Painter = (ctx, w, h) => {
  const s = Math.min(w, h * 2.6) / 560
  ctx.translate(w / 2, h / 2)
  ctx.scale(s, s)
  const box = (x: number, y: number) => {
    ctx.beginPath()
    ctx.roundRect(x, y, 120, 70, 12)
    ctx.fill()
  }
  box(-270, -110)
  box(-270, 40)
  box(-60, -35)
  ctx.beginPath()
  ctx.ellipse(200, -55, 55, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(145, -55, 110, 110)
  ctx.beginPath()
  ctx.ellipse(200, 55, 55, 22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.moveTo(-150, -75)
  ctx.lineTo(-60, -10)
  ctx.moveTo(-150, 75)
  ctx.lineTo(-60, 10)
  ctx.moveTo(60, 0)
  ctx.lineTo(145, 0)
  ctx.stroke()
}

function hash(x: number, y: number) {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

function smoothstep(v: number) {
  const t = Math.min(1, Math.max(0, v))
  return t * t * (3 - 2 * t)
}

export function Halftone({
  draw,
  active = false,
  ambient = false,
  mode = 'dots',
  spacing = 8,
  flow = 12,
  interactive = false,
  color,
  className,
}: HalftoneProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const maskRef = React.useRef<{
    data: Uint8ClampedArray
    w: number
    h: number
    scale: number
  } | null>(null)
  const sizeRef = React.useRef({ w: 0, h: 0, dpr: 1 })
  const activeRef = React.useRef(active)
  const ambientRef = React.useRef(ambient)
  const activeSinceRef = React.useRef(0)
  const lastFrameRef = React.useRef(0)
  const rafRef = React.useRef(0)
  const reducedRef = React.useRef(false)
  const colorRef = React.useRef(color ?? '#1b1916')
  const visibleRef = React.useRef(true)
  const offRef = React.useRef<HTMLCanvasElement | null>(null)
  const mouseRef = React.useRef({ tx: -9999, ty: -9999, x: -9999, y: -9999 })

  const sample = React.useCallback((sx: number, sy: number) => {
    const mask = maskRef.current!
    const { w, h } = sizeRef.current
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return 0
    const mx = Math.floor((sx / w) * mask.w)
    const my = Math.floor((sy / h) * mask.h)
    return mask.data[(my * mask.w + mx) * 4 + 3] / 255
  }, [])

  const render = React.useCallback(
    (t: number) => {
      const canvas = canvasRef.current
      if (!canvas || !maskRef.current) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { w, h, dpr } = sizeRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = colorRef.current

      const isActive = activeRef.current
      const isAmbient = !isActive && ambientRef.current
      const since = isActive ? (t - activeSinceRef.current) / 900 : 1
      const cw = mode === 'dashes' ? Math.max(4, spacing * 0.55) : spacing

      const m = mouseRef.current
      if (interactive) {
        m.x += (m.tx - m.x) * 0.14
        m.y += (m.ty - m.y) * 0.14
      }

      for (let y = spacing / 2; y < h; y += spacing) {
        for (let x = cw / 2; x < w; x += cw) {
          const rnd = hash(Math.round(x / cw), Math.round(y / spacing))
          if (rnd < 0.06) continue

          let sx = x
          let sy = y
          let boost = 1

          if (!reducedRef.current && (isActive || isAmbient)) {
            const amp = isActive ? flow : flow * 0.45
            const speed = isActive ? 1 : 0.5
            sx += Math.sin(t * 0.0011 * speed + y * 0.016 + x * 0.004) * amp
            sy +=
              Math.cos(t * 0.00085 * speed + x * 0.012 - y * 0.007) *
              amp *
              0.8

            if (interactive && isActive) {
              const dx = x - m.x
              const dy = y - m.y
              const d = Math.hypot(dx, dy)
              const inf = Math.max(0, 1 - d / 170)
              if (inf > 0) {
                const push = inf * inf * 30
                sx += (dx / (d || 1)) * push
                sy += (dy / (d || 1)) * push
                boost = 1 + inf * 0.8
              }
            }
          }

          const a = sample(sx, sy)
          if (a < 0.05) continue

          const wave = isActive
            ? 0.8 + 0.2 * Math.sin(t / 1300 - (x + y) / 210)
            : isAmbient
              ? 0.84 + 0.1 * Math.sin(t / 2100 - (x + y) / 240)
              : 0.9
          const reveal = isActive
            ? 0.7 + 0.3 * smoothstep(since * 2.4 - (x / w) * 1.3 - rnd * 0.15)
            : 1
          const v = a * wave * reveal * boost
          if (v <= 0.02) continue

          if (mode === 'dashes') {
            const dh = Math.min(spacing * 0.78, v * spacing * 0.85)
            ctx.fillRect(x - cw / 2, y - dh / 2, cw * 0.96, dh)
          } else {
            const r = Math.min(spacing * 0.62, v * spacing * 0.48)
            ctx.beginPath()
            ctx.ellipse(x, y, r * 0.68, r, 0, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    },
    [color, flow, interactive, mode, sample, spacing],
  )

  const loop = React.useCallback(
    (t: number) => {
      if (
        !visibleRef.current ||
        reducedRef.current ||
        !(activeRef.current || ambientRef.current)
      ) {
        return
      }
      const ambientOnly = !activeRef.current && ambientRef.current
      if (!ambientOnly || t - lastFrameRef.current >= 40) {
        render(t)
        lastFrameRef.current = t
      }
      rafRef.current = requestAnimationFrame(loop)
    },
    [render],
  )

  // Cancel-then-schedule so an instance never runs two loops at once.
  const startLoop = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (!visibleRef.current || reducedRef.current) return
    if (!(activeRef.current || ambientRef.current)) return
    rafRef.current = requestAnimationFrame(loop)
  }, [loop])

  React.useEffect(() => {
    reducedRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
  }, [])

  React.useEffect(() => {
    if (color) {
      colorRef.current = color
      return
    }
    const resolve = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--ink')
        .trim()
      colorRef.current = v || '#1b1916'
      render(performance.now())
    }
    resolve()
    const mo = new MutationObserver(resolve)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => mo.disconnect()
  }, [color, render])

  React.useEffect(() => {
    if (!interactive) return
    const onMove = (e: PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.tx = e.clientX - rect.left
      mouseRef.current.ty = e.clientY - rect.top
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [interactive])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let debounce = 0

    // Cheap: track the parent size every tick so the art follows layout
    // transitions smoothly (the dots sample the mask with normalized
    // coordinates, so a briefly stale mask just stretches).
    const resize = (): boolean => {
      const parent = canvas.parentElement
      if (!parent) return false
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (!w || !h) return false
      if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        sizeRef.current = { w, h, dpr }
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
      }
      return true
    }

    // Expensive (offscreen draw + getImageData): debounced after resizes.
    const rebuildMask = () => {
      const { w, h } = sizeRef.current
      if (!w || !h) return
      const scale = 0.5
      const off = (offRef.current ??= document.createElement('canvas'))
      off.width = Math.max(1, Math.floor(w * scale))
      off.height = Math.max(1, Math.floor(h * scale))
      const octx = off.getContext('2d')
      if (!octx) return
      octx.setTransform(scale, 0, 0, scale, 0, 0)
      draw(octx, w, h)
      maskRef.current = {
        data: octx.getImageData(0, 0, off.width, off.height).data,
        w: off.width,
        h: off.height,
        scale,
      }
      render(performance.now())
    }

    if (resize()) rebuildMask()
    const ro = new ResizeObserver(() => {
      if (!resize()) return
      if (!maskRef.current) {
        rebuildMask()
        return
      }
      render(performance.now())
      window.clearTimeout(debounce)
      debounce = window.setTimeout(rebuildMask, 140)
    })
    ro.observe(canvas.parentElement!)
    return () => {
      window.clearTimeout(debounce)
      ro.disconnect()
    }
  }, [draw, render])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
        if (entry.isIntersecting) startLoop()
        else cancelAnimationFrame(rafRef.current)
      },
      { rootMargin: '80px' },
    )
    io.observe(canvas)
    return () => io.disconnect()
  }, [startLoop])

  React.useEffect(() => {
    activeRef.current = active
    ambientRef.current = ambient
    cancelAnimationFrame(rafRef.current)
    if (active) activeSinceRef.current = performance.now()
    if ((active || ambient) && !reducedRef.current) {
      startLoop()
    } else {
      render(performance.now())
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, ambient, startLoop, render])

  return <canvas ref={canvasRef} aria-hidden className={className} />
}
