'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  float t = u_time;

  vec2 c = uv - vec2(0.72, 0.50);
  c.x *= ar;
  float ang = radians(57.0);
  float ca = cos(ang), sa = sin(ang);
  float across = c.x * ca - c.y * sa;
  float along  = c.x * sa + c.y * ca;

  float width = 0.16 + 0.12 * (along + 0.7);
  float env = exp(-pow(across / max(width, 0.04), 2.0));
  env *= smoothstep(-1.2, -0.55, along);
  env *= smoothstep(1.35, 0.45, along);

  float n = vnoise(vec2(along * 1.6 - t * 0.10, across * 2.2 + t * 0.05)) * 0.6
          + vnoise(vec2(along * 3.2 + t * 0.07, across * 4.0)) * 0.4;
  float band = env * smoothstep(0.22, 0.85, n + 0.30);

  float rows = 120.0;
  float ry = uv.y * rows;
  float row = floor(ry);
  float rowGap = smoothstep(0.22, 0.5, fract(ry)) * smoothstep(0.78, 0.5, fract(ry));
  float xx = uv.x * 32.0 + vnoise(vec2(row * 0.6, t * 0.18)) * 5.0 - t * 0.4;
  float dashLen = 0.28 + 0.42 * vnoise(vec2(floor(xx) * 0.5, row * 0.8 + t * 0.08));
  float dash = smoothstep(dashLen, dashLen - 0.12, fract(xx));
  float strokes = dash * rowGap * band;

  float coreMask = exp(-pow((along - 0.12) / 0.40, 2.0))
                 * exp(-pow(across / 0.17, 2.0));
  float pulse = 0.6 + 0.4 * sin(t * 0.45 + along * 1.5);
  float core = coreMask * pulse;

  vec3 white  = vec3(1.0);
  vec3 gray   = vec3(0.78, 0.79, 0.81);
  vec3 purple = vec3(0.43, 0.34, 0.81);
  vec3 lilac  = vec3(0.66, 0.58, 0.93);

  vec3 col = white;
  col = mix(col, lilac, clamp(core * 0.35, 0.0, 1.0));
  col = mix(col, gray, clamp(strokes * 0.85, 0.0, 1.0));
  col = mix(col, purple, clamp(strokes * core * 2.4, 0.0, 1.0));
  col = mix(col, purple, clamp(core * core * 0.5, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('HeroScene shader error:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function HeroScene({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let gl: WebGLRenderingContext | null = null
    let prog: WebGLProgram | null = null
    let vs: WebGLShader | null = null
    let fs: WebGLShader | null = null
    let buf: WebGLBuffer | null = null
    let uRes: WebGLUniformLocation | null = null
    let uTime: WebGLUniformLocation | null = null
    let raf = 0
    let start = performance.now()
    let disposed = false

    const resize = () => {
      if (!gl) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    const render = (now: number) => {
      if (!gl || disposed) return
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(render)
    }

    const init = () => {
      gl = canvas.getContext('webgl', {
        antialias: true,
        premultipliedAlpha: false,
      })
      if (!gl) return false
      vs = compile(gl, gl.VERTEX_SHADER, VERT)
      fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
      if (!vs || !fs) return false
      prog = gl.createProgram()!
      gl.attachShader(prog, vs)
      gl.attachShader(prog, fs)
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false
      gl.useProgram(prog)
      buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      )
      const aPos = gl.getAttribLocation(prog, 'a_pos')
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      uRes = gl.getUniformLocation(prog, 'u_res')
      uTime = gl.getUniformLocation(prog, 'u_time')
      return true
    }

    const startLoop = () => {
      resize()
      if (reduce) {
        gl!.uniform1f(uTime, 0)
        gl!.drawArrays(gl!.TRIANGLES, 0, 3)
      } else {
        start = performance.now()
        raf = requestAnimationFrame(render)
      }
    }

    const onLost = (e: Event) => {
      e.preventDefault()
      cancelAnimationFrame(raf)
    }
    const onRestored = () => {
      if (!disposed && init()) startLoop()
    }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    const ro = new ResizeObserver(resize)

    if (init()) {
      ro.observe(canvas)
      startLoop()
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none block h-full w-full', className)}
    />
  )
}
