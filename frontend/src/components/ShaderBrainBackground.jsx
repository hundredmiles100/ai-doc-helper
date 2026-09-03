import { useEffect, useRef, useState } from 'react'

// Shader + Brain Video background
// - brain video: looping, muted, slow, blended with shader canvas
// - shader: WebGL fragment shader for liquid neural flow
const BRAIN_VIDEO = 'https://cdn.pixabay.com/video/2024/03/30/206173_large.mp4'
const FALLBACK_VIDEO = 'https://cdn.pixabay.com/video/2023/04/15/159049-818026306_large.mp4'

const VERT = `
attribute vec2 position;
void main(){ gl_Position = vec4(position,0.0,1.0); }
`

const FRAG = `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv*2.0 - 1.0;
  float a = uRes.x/uRes.y;
  p.x *= a;
  float t = uTime * 0.07;
  // flowing fields
  float d = length(p);
  float w1 = sin(p.x*0.85 + t) * cos(p.y*0.65 - t*0.55) * 0.5 + 0.5;
  float w2 = sin(d*2.0 - t*1.0) * 0.5 + 0.5;
  float w3 = sin(p.y*1.2 + p.x*0.5 + t*0.8) * 0.5 + 0.5;
  // palette: indigo -> cyan -> violet -> soft white
  vec3 c1 = vec3(0.31,0.27,0.89);
  vec3 c2 = vec3(0.02,0.71,0.83);
  vec3 c3 = vec3(0.66,0.33,0.96);
  vec3 col = mix(c1,c2,w1);
  col = mix(col,c3,w2*0.42);
  col = mix(col, vec3(0.97,0.97,1.0), w3*0.07);
  // vignette
  float vig = smoothstep(1.8, 0.25, d);
  col *= 0.90 + vig*0.10;
  // subtle pulse
  col += sin(t*1.3 + d*3.0)*0.015;
  // grain
  float g = fract(sin(dot(uv, vec2(12.9898,78.233)))*43758.5453)*0.012;
  col += g;
  gl_FragColor = vec4(col, 0.88);
}
`

function createShader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s))
    return null
  }
  return s
}

export default function ShaderBrainBackground() {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const [videoOk, setVideoOk] = useState(true)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true)
    }
  }, [])

  // shader
  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
    if (!gl) return

    const vs = createShader(gl, gl.VERTEX_SHADER, VERT)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uRes = gl.getUniformLocation(prog, 'uRes')

    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6)
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    let start = performance.now()
    const render = () => {
      const t = (performance.now() - start) / 1000
      gl.uniform1f(uTime, t)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [reduced])

  // video fallback
  const onVideoError = () => setVideoOk(false)

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: '#f8fafc',
        pointerEvents: 'none',
      }}
    >
      {/* brain video — center, slow, blended */}
      {videoOk ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={onVideoError}
          poster=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 42%',
            opacity: 0.34,
            filter: 'contrast(1.08) brightness(1.06) saturate(1.05) blur(0.4px)',
            transform: 'scale(1.04)',
          }}
        >
          <source src={BRAIN_VIDEO} type="video/mp4" />
          <source src={FALLBACK_VIDEO} type="video/mp4" />
        </video>
      ) : null}

      {/* shader canvas — on top of video, soft light blend */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: reduced ? 0.72 : 0.58,
          mixBlendMode: 'soft-light',
        }}
      />

      {/* readability wash — top light, bottom fade */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(820px 520px at 50% 0%, rgba(255,255,255,0.72), transparent 68%),
            linear-gradient(180deg, rgba(248,250,252,0.82) 0%, rgba(248,250,252,0.46) 22%, rgba(248,250,252,0.18) 42%, rgba(248,250,252,0.62) 88%, rgba(241,245,249,0.92) 100%)
          `,
        }}
      />

      {/* subtle vignette for glass depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(1100px 700px at 50% 50%, transparent 62%, rgba(15,23,42,0.06) 100%)',
          opacity: 0.5,
        }}
      />

      {/* grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.028,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      {/* bottom safe for content */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 180,
          background: 'linear-gradient(180deg, transparent, rgba(248,250,252,0.88) 70%)',
        }}
      />
    </div>
  )
}
