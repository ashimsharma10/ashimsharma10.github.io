'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './shared'

const W = 640
const H = 300
const SCREEN_TOP = 10
const SCREEN_BOTTOM = 206
const HIST_TOP = 220
const HIST_BOTTOM = 292
const BINS = 64
const CDF_RES = 512
const MAX_HITS = 4000
const DOTS_PER_FRAME = 14

// Arrival probability across the screen (u in 0..1). Detector off: two-slit
// interference fringes under a smooth envelope. Detector on: the fringes are
// gone, just two overlapping single-slit blobs.
function intensity(u: number, detectorOn: boolean): number {
  const c = u - 0.5
  if (detectorOn) {
    return Math.exp(-(((c + 0.08) / 0.16) ** 2)) + Math.exp(-(((c - 0.08) / 0.16) ** 2))
  }
  return Math.cos(2 * Math.PI * 3.2 * c) ** 2 * Math.exp(-((c / 0.28) ** 2))
}

function buildCdf(detectorOn: boolean): number[] {
  const cdf: number[] = new Array(CDF_RES)
  let total = 0
  for (let i = 0; i < CDF_RES; i++) {
    total += intensity((i + 0.5) / CDF_RES, detectorOn)
    cdf[i] = total
  }
  return cdf.map((v) => v / total)
}

function sampleX(cdf: number[]): number {
  const u = Math.random()
  let lo = 0
  let hi = CDF_RES - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cdf[mid] < u) lo = mid + 1
    else hi = mid
  }
  return (lo + Math.random()) / CDF_RES
}

export default function DoubleSlit() {
  const isDark = useIsDark()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hitsRef = useRef<{ x: number; y: number }[]>([])
  const binsRef = useRef<number[]>(new Array(BINS).fill(0))
  const cdfRef = useRef<number[] | null>(null)
  const rafRef = useRef(0)
  const [running, setRunning] = useState(false)
  const [detectorOn, setDetectorOn] = useState(false)
  const [hits, setHits] = useState(0)

  if (cdfRef.current === null) cdfRef.current = buildCdf(false)

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null

  const drawDot = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.fillStyle = palette(isDark).accent
      ctx.globalAlpha = 0.75
      ctx.beginPath()
      ctx.arc(x, y, 1.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    },
    [isDark]
  )

  const drawHistogram = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const p = palette(isDark)
      ctx.fillStyle = p.bg
      ctx.fillRect(0, HIST_TOP - 12, W, HIST_BOTTOM - HIST_TOP + 12)
      ctx.fillStyle = p.muted
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('arrival counts', 6, HIST_TOP - 2)
      const max = Math.max(1, ...binsRef.current)
      const barW = W / BINS
      ctx.fillStyle = p.accent
      for (let i = 0; i < BINS; i++) {
        const h = (binsRef.current[i] / max) * (HIST_BOTTOM - HIST_TOP)
        ctx.fillRect(i * barW + 1, HIST_BOTTOM - h, barW - 2, h)
      }
    },
    [isDark]
  )

  const repaintAll = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const p = palette(isDark)
      ctx.fillStyle = p.bg
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = p.panel
      ctx.fillRect(0, SCREEN_TOP, W, SCREEN_BOTTOM - SCREEN_TOP)
      ctx.strokeStyle = p.border
      ctx.strokeRect(0.5, SCREEN_TOP + 0.5, W - 1, SCREEN_BOTTOM - SCREEN_TOP - 1)
      ctx.fillStyle = p.muted
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('detection screen, face on · each dot is one particle', 6, SCREEN_TOP + 14)
      for (const hit of hitsRef.current) drawDot(ctx, hit.x, hit.y)
      drawHistogram(ctx)
    },
    [isDark, drawDot, drawHistogram]
  )

  const addHits = useCallback(
    (ctx: CanvasRenderingContext2D, n: number) => {
      const count = Math.min(n, MAX_HITS - hitsRef.current.length)
      for (let i = 0; i < count; i++) {
        const x = sampleX(cdfRef.current as number[]) * W
        const y = SCREEN_TOP + 22 + Math.random() * (SCREEN_BOTTOM - SCREEN_TOP - 30)
        hitsRef.current.push({ x, y })
        binsRef.current[Math.min(BINS - 1, Math.floor((x / W) * BINS))]++
        drawDot(ctx, x, y)
      }
      drawHistogram(ctx)
      setHits(hitsRef.current.length)
    },
    [drawDot, drawHistogram]
  )

  // Size the backing store and repaint everything (mount + theme change).
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)
    repaintAll(ctx)
  }, [repaintAll])

  // Animation loop.
  useEffect(() => {
    if (!running) return
    const ctx = getCtx()
    if (!ctx) return
    const tick = () => {
      addHits(ctx, DOTS_PER_FRAME)
      if (hitsRef.current.length >= MAX_HITS) {
        setRunning(false)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, addHits])

  const reset = (nextDetector = detectorOn) => {
    hitsRef.current = []
    binsRef.current = new Array(BINS).fill(0)
    cdfRef.current = buildCdf(nextDetector)
    setHits(0)
    const ctx = getCtx()
    if (ctx) repaintAll(ctx)
  }

  const toggleDetector = () => {
    const next = !detectorOn
    setDetectorOn(next)
    reset(next)
  }

  const isDone = hits >= MAX_HITS

  return (
    <DemoFrame
      title="Double slit: particles arriving one at a time"
      isDark={isDark}
      caption="Every particle lands as a single dot, yet the stripes only appear when nobody checks which slit it went through. Turn the detector on and the same experiment gives two plain bands: recording the path destroys the interference. The pattern resets because it is a genuinely different experiment."
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block', borderRadius: 6 }}
        role="img"
        aria-label="Simulated double-slit detection screen"
      />
      <div
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}
      >
        <DemoButton isDark={isDark} primary onClick={() => setRunning((r) => !r)} disabled={isDone}>
          {running ? 'Pause' : 'Start'}
        </DemoButton>
        <DemoButton
          isDark={isDark}
          onClick={() => {
            const ctx = getCtx()
            if (ctx) addHits(ctx, 500)
          }}
          disabled={isDone}
        >
          Add 500
        </DemoButton>
        <DemoButton isDark={isDark} onClick={toggleDetector}>
          {detectorOn ? 'Which-slit detector: ON' : 'Which-slit detector: OFF'}
        </DemoButton>
        <DemoButton isDark={isDark} onClick={() => reset()}>
          Reset
        </DemoButton>
        <span style={{ fontSize: 12, color: palette(isDark).muted }}>
          {hits} particles{isDone ? ' · screen full' : ''}
        </span>
      </div>
    </DemoFrame>
  )
}
