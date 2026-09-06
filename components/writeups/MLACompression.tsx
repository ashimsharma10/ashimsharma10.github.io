'use client'

import { DemoFrame, palette, useIsDark } from './quantum/shared'

// Everything on this figure is one token, at one layer, at BF16.
//
//   MHA equivalent : 2 x 128 heads x 128 dim x 2 B = 65,536 B
//   MLA (DeepSeek) : (512 latent + 64 rope)  x 2 B =  1,152 B
//
// Nothing here animates and nothing is random, so the first render is the only render.

const MHA_BYTES = 65536
const LATENT = 512
const ROPE = 64
const MLA_BYTES = (LATENT + ROPE) * 2

const X0 = 34
const FULL = 620

export default function MLACompression() {
  const isDark = useIsDark()
  const p = palette(isDark)

  const mlaWidth = (FULL * MLA_BYTES) / MHA_BYTES // ~10.9px, and that is the point
  const latentW = (FULL * LATENT) / (LATENT + ROPE)
  const ropeW = FULL - latentW

  const rowLabel = { fill: p.text, fontSize: 13, fontWeight: 600 } as const
  const sub = { fill: p.muted, fontSize: 11.5 } as const

  return (
    <DemoFrame
      title="One token, one layer, at BF16"
      isDark={isDark}
      caption={
        <>
          Both bars are drawn to the same scale. The whole of DeepSeek V3&apos;s per-token state is
          the sliver in the middle row, which is why the bottom row magnifies it.
        </>
      }
    >
      <svg viewBox="0 0 700 250" width="100%" role="img" aria-label="MLA compression figure">
        {/* Row A: what a 128-head MHA layer would store */}
        <text x={X0} y={18} style={rowLabel}>
          Multi-head attention
        </text>
        <text x={X0} y={34} style={sub}>
          128 heads, each keeping its own key and its own value
        </text>
        <rect
          x={X0}
          y={44}
          width={FULL}
          height={30}
          rx={4}
          fill={p.accentSoft}
          stroke={p.accent}
          strokeWidth={1.5}
        />
        {Array.from({ length: 15 }, (_, i) => (
          <line
            key={i}
            x1={X0 + (FULL / 16) * (i + 1)}
            y1={44}
            x2={X0 + (FULL / 16) * (i + 1)}
            y2={74}
            stroke={p.accent}
            strokeWidth={0.6}
            opacity={0.5}
          />
        ))}
        <text x={X0} y={90} style={sub}>
          32,768 numbers = <tspan fontWeight={700}>65,536 bytes</tspan>
        </text>

        {/* Row B: the same thing under MLA, same scale */}
        <text x={X0} y={126} style={rowLabel}>
          Multi-head latent attention
        </text>
        <text x={X0} y={142} style={sub}>
          one shared latent vector, plus a small shared positional tail
        </text>
        <rect
          x={X0}
          y={152}
          width={Math.max(mlaWidth, 3)}
          height={30}
          rx={2}
          fill={p.secondary}
          stroke={p.secondary}
          strokeWidth={1.5}
        />
        <text x={X0 + 20} y={172} style={{ ...sub, fill: p.text }}>
          576 numbers = <tspan fontWeight={700}>1,152 bytes</tspan>. That is the entire bar.
        </text>

        {/* Row C: the sliver, blown up so the split is readable */}
        <line
          x1={X0}
          y1={190}
          x2={X0}
          y2={202}
          stroke={p.muted}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <line
          x1={X0 + Math.max(mlaWidth, 3)}
          y1={190}
          x2={X0 + FULL}
          y2={202}
          stroke={p.muted}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <rect
          x={X0}
          y={202}
          width={latentW}
          height={26}
          rx={4}
          fill={p.secondarySoft}
          stroke={p.secondary}
          strokeWidth={1.5}
        />
        <rect
          x={X0 + latentW}
          y={202}
          width={ropeW}
          height={26}
          rx={4}
          fill={isDark ? '#334155' : '#e2e8f0'}
          stroke={p.muted}
          strokeWidth={1.5}
        />
        <text
          x={X0 + latentW / 2}
          y={219}
          textAnchor="middle"
          style={{ fill: p.text, fontSize: 12, fontWeight: 600 }}
        >
          512 compressed latent
        </text>
        <text
          x={X0 + latentW + ropeW / 2}
          y={219}
          textAnchor="middle"
          style={{ fill: p.text, fontSize: 11 }}
        >
          64 rope
        </text>
        <text x={X0} y={245} style={sub}>
          magnified 57x, the ratio between the two bars above
        </text>
      </svg>
    </DemoFrame>
  )
}
