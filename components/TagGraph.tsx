'use client'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { slug } from 'github-slugger'
import { useEffect, useMemo, useRef, useState } from 'react'

// A 3D, wiki-style force-directed knowledge graph for the /tags page.
// - Write-up nodes (light orange) sit on the outer shell — the "leaves".
// - Tag nodes (green) form the central concept core, sized by post count.
// - Edges connect each write-up to its tags.
// Interactions: drag the background to orbit, scroll to zoom, drag a node to
// move it in 3D (it pins where you drop it), hover to highlight, click to open.
// A small custom 3D engine (spherical layout + perspective projection) — no deps.

export interface GraphPost {
  title: string
  path: string
  tags: string[]
}

interface Node {
  id: string
  label: string
  url: string
  type: 'post' | 'tag'
  count: number
  r: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  fixed: boolean
  px: number // projected screen x
  py: number // projected screen y
  pz: number // rotated depth
  pr: number // projected radius
  pa: number // depth alpha
}

interface Edge {
  s: Node
  t: Node
}

const TAU = Math.PI * 2

// Shorten a post title for a node label: prefer the part before a colon, then
// hard-truncate. Robust for future posts (no hardcoded labels).
function shortLabel(title: string): string {
  let s = title.includes(':') ? title.split(':')[0] : title
  s = s.trim()
  return s.length > 28 ? s.slice(0, 27).trimEnd() + '…' : s
}

// Two-colour categorical scheme: write-ups → light orange, tags → green.
const palette = {
  light: {
    surface: '#f7f8fa',
    edge: 'rgba(100,116,139,0.30)',
    edgeHi: 'rgba(15,157,88,0.75)',
    post: '#ef9a4f',
    postRing: '#d97b2e',
    tag: '#0f9d58',
    tagRing: '#0a7d43',
    inkPrimary: '#0f172a',
    inkSecondary: '#5b6472',
    inkHi: '#0b0b0b',
    pin: '#0f172a',
    dim: 0.14,
  },
  dark: {
    surface: '#0e1117',
    edge: 'rgba(148,163,184,0.26)',
    edgeHi: 'rgba(52,211,153,0.7)',
    post: '#e6924a',
    postRing: '#c9762f',
    tag: '#1aa06e',
    tagRing: '#0f7d52',
    inkPrimary: '#e6eaf0',
    inkSecondary: '#98a2b3',
    inkHi: '#f8fafc',
    pin: '#e6eaf0',
    dim: 0.14,
  },
}

// Reference radius the graph is framed to (graph units). The layout keeps the
// tag core near the centre and pushes write-ups out toward this shell.
const R0 = 240

// Evenly distribute point i of n on a sphere of the given radius (Fibonacci).
function spherePoint(i: number, n: number, radius: number): [number, number, number] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const y = 1 - (i / Math.max(n - 1, 1)) * 2
  const rad = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = golden * i
  return [Math.cos(theta) * rad * radius, y * radius, Math.sin(theta) * rad * radius]
}

export default function TagGraph({ posts }: { posts: GraphPost[] }) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const { nodes, edges, adj, textList } = useMemo(() => {
    const tagCount: Record<string, number> = {}
    posts.forEach((p) => p.tags.forEach((t) => (tagCount[t] = (tagCount[t] || 0) + 1)))

    const nodeById: Record<string, Node> = {}
    const nodes: Node[] = []

    const mk = (
      id: string,
      label: string,
      url: string,
      type: 'post' | 'tag',
      count: number,
      r: number,
      pos: [number, number, number]
    ): Node => {
      const n: Node = {
        id,
        label,
        url,
        type,
        count,
        r,
        x: pos[0],
        y: pos[1],
        z: pos[2],
        vx: 0,
        vy: 0,
        vz: 0,
        fixed: false,
        px: 0,
        py: 0,
        pz: 0,
        pr: 0,
        pa: 1,
      }
      nodeById[id] = n
      nodes.push(n)
      return n
    }

    posts.forEach((p, i) =>
      mk(
        p.path,
        shortLabel(p.title),
        `/${p.path}`,
        'post',
        p.tags.length,
        11,
        spherePoint(i, posts.length, 210)
      )
    )

    const tagKeys = Object.keys(tagCount)
    tagKeys.forEach((t, i) =>
      mk(
        'tag:' + t,
        t,
        `/tags/${slug(t)}`,
        'tag',
        tagCount[t],
        6 + tagCount[t] * 2.6,
        spherePoint(i, tagKeys.length, 70)
      )
    )

    const edges: Edge[] = []
    const adj: Record<string, Set<string>> = {}
    nodes.forEach((n) => (adj[n.id] = new Set()))
    posts.forEach((p) => {
      p.tags.forEach((t) => {
        const s = nodeById[p.path]
        const tg = nodeById['tag:' + t]
        if (!s || !tg) return
        edges.push({ s, t: tg })
        adj[s.id].add(tg.id)
        adj[tg.id].add(s.id)
      })
    })

    const textList = {
      posts: posts.map((p) => ({ title: p.title, url: `/${p.path}` })),
      tags: tagKeys
        .sort((a, b) => tagCount[b] - tagCount[a])
        .map((t) => ({ text: t, url: `/tags/${slug(t)}`, count: tagCount[t] })),
    }

    return { nodes, edges, adj, textList }
  }, [posts])

  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const tip = tipRef.current
    if (!canvas || !wrap || !tip) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0
    let H = 0
    let S = 1 // graph-units → screen-px scale
    const col = () => (resolvedTheme === 'dark' ? palette.dark : palette.light)

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      W = rect.width
      H = rect.height
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Divide by the near-hemisphere magnification (~1.7×) so the whole
      // rotating sphere stays inside the frame at any orientation.
      S = (Math.min(W, H) / 2 - 46) / (R0 * 1.62)
    }
    resize()

    // Camera + interaction state.
    let ry = 0.6 // yaw
    let rx = -0.35 // pitch
    let zoom = 1.35 // default: framed a little tighter so the graph fills the canvas
    let autoRotate = true
    let hover: Node | null = null
    let drag: Node | null = null
    let orbit: { x: number; y: number } | null = null
    let moved = false
    // The spherical seed is already a good layout, so start with low energy —
    // the graph settles quickly (less initial motion, easier to grab a node).
    let alpha = 0.5
    let raf = 0
    let pinnedAny = false // once the user drops a node, stop auto-recentering
    let last: { x: number; y: number } = { x: 0, y: 0 }
    const FOCAL = R0 * 2.4
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) autoRotate = false

    // Perspective projection of a node with the current camera.
    let cy = 1
    let sy = 0
    let cx = 1
    let sx = 0
    const project = (n: Node) => {
      const x1 = n.x * cy - n.z * sy
      const z1 = n.x * sy + n.z * cy
      const y1 = n.y * cx - z1 * sx
      const z2 = n.y * sx + z1 * cx
      const factor = FOCAL / (FOCAL + z2)
      n.px = W / 2 + x1 * factor * S * zoom
      n.py = H / 2 + y1 * factor * S * zoom
      n.pz = z2
      n.pr = n.r * factor * S * zoom
      n.pa = 0.55 + 0.45 * (1 - Math.min(1, Math.max(0, (z2 + R0) / (2 * R0))))
    }

    const step = () => {
      if (alpha > 0.02) {
        // Many-body repulsion (3D).
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i]
            const b = nodes[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const dz = a.z - b.z
            const d2 = dx * dx + dy * dy + dz * dz || 0.01
            const charge = a.type === 'post' && b.type === 'post' ? 9000 : 4200
            const d = Math.sqrt(d2)
            const f = charge / d2 / d
            a.vx += dx * f
            a.vy += dy * f
            a.vz += dz * f
            b.vx -= dx * f
            b.vy -= dy * f
            b.vz -= dz * f
          }
        }
        // Springs along edges.
        edges.forEach((e) => {
          const a = e.s
          const b = e.t
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dz = b.z - a.z
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
          const f = ((d - 120) * 0.02) / d
          a.vx += dx * f
          a.vy += dy * f
          a.vz += dz * f
          b.vx -= dx * f
          b.vy -= dy * f
          b.vz -= dz * f
        })
        // Radial: tags to the core, write-ups out to the shell.
        nodes.forEach((n) => {
          const dist = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z) || 1
          if (n.type === 'tag') {
            const f = -0.012
            n.vx += n.x * f
            n.vy += n.y * f
            n.vz += n.z * f
          } else {
            const f = ((210 - dist) * 0.01) / dist
            n.vx += n.x * f
            n.vy += n.y * f
            n.vz += n.z * f
          }
          n.vx += -n.x * 0.002
          n.vy += -n.y * 0.002
          n.vz += -n.z * 0.002
          if (n.fixed || n === drag) return
          n.vx *= 0.82
          n.vy *= 0.82
          n.vz *= 0.82
          n.x += n.vx * alpha
          n.y += n.vy * alpha
          n.z += n.vz * alpha
        })
        // Recenter on the origin so the graph doesn't drift out of frame while
        // it settles. Skipped during a drag, and once the user has pinned a
        // node, so grabbed/pinned nodes stay where they were dropped.
        if (!drag && !pinnedAny) {
          let cxs = 0
          let cys = 0
          let czs = 0
          nodes.forEach((n) => {
            cxs += n.x
            cys += n.y
            czs += n.z
          })
          cxs /= nodes.length
          cys /= nodes.length
          czs /= nodes.length
          nodes.forEach((n) => {
            n.x -= cxs
            n.y -= cys
            n.z -= czs
          })
        }
        alpha *= 0.99
      }

      if (autoRotate && !hover && !drag && !orbit) ry += 0.0025
      cy = Math.cos(ry)
      sy = Math.sin(ry)
      cx = Math.cos(rx)
      sx = Math.sin(rx)
      draw()
      raf = requestAnimationFrame(step)
    }

    const draw = () => {
      const c = col()
      ctx.clearRect(0, 0, W, H)
      nodes.forEach(project)
      const active = hover ? adj[hover.id] : null

      // Edges first, faded by average depth.
      edges.forEach((e) => {
        const on = hover && (e.s === hover || e.t === hover)
        const depthA = (e.s.pa + e.t.pa) / 2
        ctx.beginPath()
        ctx.moveTo(e.s.px, e.s.py)
        ctx.lineTo(e.t.px, e.t.py)
        ctx.strokeStyle = on ? c.edgeHi : c.edge
        ctx.globalAlpha = hover && !on ? c.dim : depthA
        ctx.lineWidth = on ? 1.8 : 1
        ctx.stroke()
      })
      ctx.globalAlpha = 1

      // Nodes back-to-front (painter's algorithm).
      const order = nodes.slice().sort((a, b) => b.pz - a.pz)
      ctx.textAlign = 'center'
      ctx.lineJoin = 'round'
      order.forEach((n) => {
        const isPost = n.type === 'post'
        const isHover = n === hover
        const hi = isHover || (active !== null && active.has(n.id))
        const lit = !hover || hi
        const base = (lit ? 1 : c.dim) * n.pa
        const fill = isPost ? c.post : c.tag
        const ring = isPost ? c.postRing : c.tagRing
        const r = Math.max(2, n.pr + (isHover ? 3 : 0))

        if (isHover) {
          ctx.globalAlpha = base * 0.18
          ctx.beginPath()
          ctx.arc(n.px, n.py, r + 7, 0, TAU)
          ctx.fillStyle = fill
          ctx.fill()
        }

        ctx.globalAlpha = base
        ctx.beginPath()
        ctx.arc(n.px, n.py, r, 0, TAU)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = ring
        ctx.stroke()

        // Pinned indicator.
        if (n.fixed) {
          ctx.globalAlpha = base
          ctx.beginPath()
          ctx.arc(n.px, n.py, r + 3, 0, TAU)
          ctx.lineWidth = 1
          ctx.strokeStyle = c.pin
          ctx.setLineDash([2, 2])
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Labels: write-ups always; tags only when highlighted (keeps 3D clean).
        const showLabel = isPost || hi
        if (showLabel) {
          ctx.font =
            (isPost || hi ? '600 ' : '400 ') +
            (isPost ? '11' : '10') +
            'px ui-sans-serif, system-ui, -apple-system, sans-serif'
          ctx.textBaseline = 'top'
          const ly = n.py + r + 4
          ctx.globalAlpha = lit ? n.pa : c.dim
          ctx.lineWidth = 3
          ctx.strokeStyle = c.surface
          ctx.strokeText(n.label, n.px, ly)
          ctx.fillStyle = isPost ? c.inkPrimary : hi ? c.inkHi : c.inkSecondary
          ctx.fillText(n.label, n.px, ly)
        }
      })
      ctx.globalAlpha = 1
    }

    const localXY = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    // Nearest projected node under the pointer (favours nearer nodes).
    const pick = (sxp: number, syp: number): Node | null => {
      let best: Node | null = null
      let bestPz = Infinity
      nodes.forEach((n) => {
        const dx = n.px - sxp
        const dy = n.py - syp
        const hit = Math.max(n.pr, 9) + 8
        if (dx * dx + dy * dy <= hit * hit && n.pz < bestPz) {
          bestPz = n.pz
          best = n
        }
      })
      return best
    }
    // Camera basis vectors in graph space (for dragging a node in the view plane).
    const camRight = (): [number, number, number] => [cy, 0, -sy]
    const camUp = (): [number, number, number] => [-sx * sy, cx, -sx * cy]

    const onDown = (e: PointerEvent) => {
      const p = localXY(e)
      const n = pick(p.x, p.y)
      moved = false
      last = { x: e.clientX, y: e.clientY }
      if (n) drag = n
      else orbit = { x: e.clientX, y: e.clientY }
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* no-op */
      }
      canvas.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      const p = localXY(e)
      if (drag) {
        const ddx = e.clientX - last.x
        const ddy = e.clientY - last.y
        last = { x: e.clientX, y: e.clientY }
        const factor = FOCAL / (FOCAL + drag.pz)
        const sc = S * zoom * factor || 1
        const gx = ddx / sc
        const gy = -ddy / sc
        const rt = camRight()
        const up = camUp()
        const dgx = rt[0] * gx + up[0] * gy
        const dgy = rt[1] * gx + up[1] * gy
        const dgz = rt[2] * gx + up[2] * gy
        drag.x += dgx
        drag.y += dgy
        drag.z += dgz
        drag.vx = drag.vy = drag.vz = 0
        // Connected nodes follow the grabbed node, then the springs relax them.
        const nb = adj[drag.id]
        nodes.forEach((m) => {
          if (m === drag || m.fixed || !nb.has(m.id)) return
          m.x += dgx * 0.55
          m.y += dgy * 0.55
          m.z += dgz * 0.55
        })
        alpha = Math.max(alpha, 0.25)
        if (Math.abs(ddx) + Math.abs(ddy) > 1) moved = true
        return
      }
      if (orbit) {
        ry += (e.clientX - last.x) * 0.008
        rx += (e.clientY - last.y) * 0.008
        rx = Math.max(-1.35, Math.min(1.35, rx))
        last = { x: e.clientX, y: e.clientY }
        moved = true
        autoRotate = false
        return
      }
      const n = pick(p.x, p.y)
      hover = n
      canvas.style.cursor = n ? 'pointer' : 'grab'
      if (n) {
        tip.style.opacity = '1'
        tip.style.left = p.x + 'px'
        tip.style.top = p.y + 'px'
        const meta =
          n.type === 'post' ? 'write-up' : n.count + ' write-up' + (n.count > 1 ? 's' : '')
        tip.innerHTML =
          '<span style="font-weight:600">' +
          n.label +
          '</span> · ' +
          meta +
          '<br><span style="opacity:.6">' +
          n.url +
          '</span>'
      } else {
        tip.style.opacity = '0'
      }
    }
    const onUp = (e: PointerEvent) => {
      if (drag) {
        if (!moved) router.push(drag.url)
        else {
          drag.fixed = true // pin where dropped
          pinnedAny = true
        }
      }
      drag = null
      orbit = null
      canvas.style.cursor = 'grab'
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* no-op */
      }
    }
    const onLeave = () => {
      if (!drag && !orbit) {
        hover = null
        tip.style.opacity = '0'
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      zoom = Math.min(3, Math.max(0.4, zoom * factor))
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    raf = requestAnimationFrame(step)

    const resetBtn = wrap.querySelector<HTMLButtonElement>('[data-graph-reset]')
    const onReset = () => {
      ry = 0.6
      rx = -0.35
      zoom = 1.35
      autoRotate = !reducedMotion
      pinnedAny = false
      nodes.forEach((n, i) => {
        const total = nodes.length
        const pos = spherePoint(i, total, n.type === 'post' ? 210 : 70)
        n.x = pos[0]
        n.y = pos[1]
        n.z = pos[2]
        n.vx = n.vy = n.vz = 0
        n.fixed = false
      })
      alpha = 1
    }
    resetBtn?.addEventListener('click', onReset)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
      resetBtn?.removeEventListener('click', onReset)
    }
  }, [mounted, resolvedTheme, nodes, edges, adj, router])

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-[#ef9a4f] dark:bg-[#e6924a]" />
          write-up — opens the post
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-[#0f9d58] dark:bg-[#1aa06e]" />
          tag — opens the tag page
        </span>
      </div>

      <div
        ref={wrapRef}
        className="relative h-[82vh] max-h-[820px] min-h-[480px] w-full overflow-hidden rounded-xl border border-gray-200 bg-[#f7f8fa] dark:border-gray-700 dark:bg-[#0e1117]"
      >
        <canvas ref={canvasRef} className="block h-full w-full cursor-grab touch-none" />
        <div
          ref={tipRef}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[140%] rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs whitespace-nowrap text-gray-900 opacity-0 shadow-sm transition-opacity dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <button
          type="button"
          data-graph-reset
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-700 backdrop-blur hover:bg-white dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          reset
        </button>
      </div>

      {/* Accessible / no-JS / SEO fallback: real links to every destination. */}
      <div className="sr-only">
        <h2>Write-ups</h2>
        <ul>
          {textList.posts.map((p) => (
            <li key={p.url}>
              <a href={p.url}>{p.title}</a>
            </li>
          ))}
        </ul>
        <h2>Tags</h2>
        <ul>
          {textList.tags.map((t) => (
            <li key={t.url}>
              <a href={t.url}>
                {t.text} ({t.count})
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
