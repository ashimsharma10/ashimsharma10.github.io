// Renders the Excalidraw-style element JSON in scripts/sketches/*.json to inline SVG,
// using rough.js (the same sketchy renderer Excalidraw is built on). Output is a
// generated TS module the <Sketch> component reads from.
//
//   node scripts/render-sketches.mjs
//
// Strokes default to currentColor and fills are semi-transparent tints, so one SVG
// reads correctly in both the light and dark themes.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const rough = require('roughjs/bundled/rough.cjs.js')

const SRC = join(process.cwd(), 'scripts', 'sketches')
const OUT = join(process.cwd(), 'components', 'writeups', 'sketches.generated.ts')
const HAND_FONT = "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', system-ui, sans-serif"
// A sketch whose first element is {"type":"settings","style":"clean"} is drawn with straight
// SVG primitives (rect, polygon, ellipse, polyline) and a plain sans font instead of rough.js.
const CLEAN_FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
let FONT = HAND_FONT
let CLEAN = false
const DEFAULT_STROKE = '#1e1e1e'
const PAD = 16

const gen = rough.generator()

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const color = (c) => (!c || c === DEFAULT_STROKE ? 'currentColor' : c)

function roundedRectPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  return (
    `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} ` +
    `a${r},${r} 0 0 1 -${r},${r} h-${w - 2 * r} a${r},${r} 0 0 1 -${r},-${r} ` +
    `v-${h - 2 * r} a${r},${r} 0 0 1 ${r},-${r} z`
  )
}

function drawableToSvg(drawable, stroke, strokeWidth, fill) {
  return gen
    .toPaths(drawable)
    .map((p) => {
      const isFill = p.fill && p.fill !== 'none'
      // One decimal is far below what a hand-drawn line needs, and it halves the file.
      const d = p.d.replace(/-?\d+\.\d+/g, (n) => Number(n).toFixed(1))
      if (isFill) {
        return `<path d="${d}" fill="${fill}" fill-opacity="0.45" stroke="none"/>`
      }
      return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
    })
    .join('')
}

function text(x, y, str, size, fill, anchor = 'start') {
  const lines = str.split('\n')
  const lh = size * 1.25
  const y0 = y - ((lines.length - 1) * lh) / 2
  return lines
    .map(
      (l, i) =>
        `<text x="${x}" y="${y0 + i * lh}" font-size="${size}" font-family="${FONT}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="middle">${esc(l)}</text>`
    )
    .join('')
}

function arrowhead(x, y, angle, stroke, seed) {
  const len = 12
  const parts = []
  for (const a of [angle + Math.PI * 0.8, angle - Math.PI * 0.8]) {
    const d = gen.line(x, y, x + len * Math.cos(a), y + len * Math.sin(a), {
      roughness: 0.8,
      seed,
    })
    parts.push(drawableToSvg(d, stroke, 2))
  }
  return parts.join('')
}

const f1 = (n) => Number(n).toFixed(1)

function cleanPath(d, stroke, sw, fill) {
  const fillAttr = fill === 'none' ? 'fill="none"' : `fill="${fill}" fill-opacity="0.45"`
  return `<path d="${d}" ${fillAttr} stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`
}

function cleanArrowhead(x, y, angle, stroke) {
  const len = 12
  const pts = [
    [x, y],
    [x + len * Math.cos(angle + Math.PI * 0.82), y + len * Math.sin(angle + Math.PI * 0.82)],
    [x + len * Math.cos(angle - Math.PI * 0.82), y + len * Math.sin(angle - Math.PI * 0.82)],
  ]
  return `<polygon points="${pts.map(([a, b]) => `${f1(a)},${f1(b)}`).join(' ')}" fill="${stroke}" stroke="none"/>`
}

function diamondPath(x, y, w, h) {
  return `M${x + w / 2},${y} L${x + w},${y + h / 2} L${x + w / 2},${y + h} L${x},${y + h / 2} Z`
}

function render(elements) {
  const settings = elements[0] && elements[0].type === 'settings' ? elements[0] : null
  CLEAN = !!settings && settings.style === 'clean'
  FONT = CLEAN ? CLEAN_FONT : HAND_FONT
  const SW = CLEAN ? 1.6 : 2
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  const parts = []
  elements.forEach((el, i) => {
    const seed = i + 1
    if (el.type === 'settings') {
      return
    }
    if (el.type === 'rectangle' || el.type === 'diamond' || el.type === 'ellipse') {
      const { x, y, width: w, height: h } = el
      const stroke = color(el.strokeColor)
      const fill =
        el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : 'none'
      const sw = el.strokeWidth ?? SW
      if (CLEAN) {
        if (el.type === 'ellipse') {
          const fillAttr = fill === 'none' ? 'fill="none"' : `fill="${fill}" fill-opacity="0.45"`
          parts.push(
            `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" ${fillAttr} stroke="${stroke}" stroke-width="${sw}"/>`
          )
        } else {
          const d =
            el.type === 'diamond'
              ? diamondPath(x, y, w, h)
              : roundedRectPath(x, y, w, h, el.roundness ? 10 : 0)
          parts.push(cleanPath(d, stroke, sw, fill))
        }
      } else {
        const opts = {
          roughness: 1,
          seed,
          fill: fill === 'none' ? undefined : fill,
          fillStyle: 'solid',
        }
        const d =
          el.type === 'ellipse'
            ? gen.ellipse(x + w / 2, y + h / 2, w, h, opts)
            : el.type === 'diamond'
              ? gen.path(diamondPath(x, y, w, h), opts)
              : gen.path(roundedRectPath(x, y, w, h, el.roundness ? 12 : 0), opts)
        parts.push(drawableToSvg(d, stroke, sw, fill))
      }
      if (el.label) {
        parts.push(
          text(
            x + w / 2,
            y + h / 2,
            el.label.text,
            el.label.fontSize ?? 16,
            'currentColor',
            'middle'
          )
        )
      }
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + w)
      maxY = Math.max(maxY, y + h)
    } else if (el.type === 'arrow') {
      const pts = el.points.map(([dx, dy]) => [el.x + dx, el.y + dy])
      const stroke = color(el.strokeColor)
      const sw = el.strokeWidth ?? SW
      const [ax, ay] = pts[pts.length - 1]
      const [bx, by] = pts[pts.length - 2]
      const angle = Math.atan2(ay - by, ax - bx)
      if (CLEAN) {
        parts.push(
          `<polyline points="${pts.map(([a, b]) => `${f1(a)},${f1(b)}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`
        )
        if (el.endArrowhead !== null) parts.push(cleanArrowhead(ax, ay, angle, stroke))
      } else {
        const d = gen.linearPath(pts, { roughness: 0.8, seed })
        parts.push(drawableToSvg(d, stroke, sw))
        if (el.endArrowhead !== null) parts.push(arrowhead(ax, ay, angle, stroke, seed))
      }
      if (el.label) {
        // Label sits beside the midpoint, offset perpendicular to the segment.
        const [mx, my] = [(pts[0][0] + ax) / 2, (pts[0][1] + ay) / 2]
        const vertical = Math.abs(ax - pts[0][0]) < Math.abs(ay - pts[0][1])
        parts.push(
          text(
            vertical ? mx + 10 : mx,
            vertical ? my : my - 12,
            el.label.text,
            el.label.fontSize ?? 14,
            'currentColor',
            vertical ? 'start' : 'middle'
          )
        )
      }
      for (const [px, py] of pts) {
        minX = Math.min(minX, px)
        minY = Math.min(minY, py)
        maxX = Math.max(maxX, px)
        maxY = Math.max(maxY, py)
      }
    } else if (el.type === 'text') {
      const size = el.fontSize ?? 16
      const muted = el.strokeColor === '#757575'
      const fill = muted ? 'currentColor' : color(el.strokeColor)
      const lines = el.text.split('\n')
      const approxW = Math.max(...lines.map((l) => l.length)) * size * 0.5
      parts.push(
        `<g${muted ? ' opacity="0.65"' : ''}>` +
          text(el.x, el.y + (size * 1.25 * lines.length) / 2, el.text, size, fill) +
          '</g>'
      )
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + approxW)
      maxY = Math.max(maxY, el.y + size * 1.25 * lines.length)
    }
  })
  const vb = [minX - PAD, minY - PAD, maxX - minX + 2 * PAD, maxY - minY + 2 * PAD].map((n) =>
    Math.round(n)
  )
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="100%" role="img">${parts.join('')}</svg>`
}

const out = {}
for (const f of readdirSync(SRC)
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  const name = f.replace(/\.json$/, '')
  out[name] = render(JSON.parse(readFileSync(join(SRC, f), 'utf8')))
  console.log(`${name}: ${out[name].length} bytes`)
}
writeFileSync(
  OUT,
  '// Generated by scripts/render-sketches.mjs from scripts/sketches/*.json. Do not edit.\n' +
    '// prettier-ignore\n' +
    'export const SKETCHES: Record<string, string> = ' +
    JSON.stringify(out, null, 0) +
    '\n'
)
console.log(`wrote ${OUT}`)
