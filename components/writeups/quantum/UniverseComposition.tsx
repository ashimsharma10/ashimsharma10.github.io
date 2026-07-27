'use client'

import { DemoFrame, palette, useIsDark } from './shared'

// The universe's mass-energy budget. Dark energy is the dominant, mysterious
// slice, so it gets a soft near-black; the two matter slices use the demo
// palette accents.
const SEGMENTS = [
  { label: 'Dark energy', value: 68, light: '#3f3f46', dark: '#52525b' },
  { label: 'Dark matter', value: 27, light: '#1d4ed8', dark: '#93c5fd' },
  { label: 'Ordinary matter', value: 5, light: '#b45309', dark: '#fcd34d' },
]

const SIZE = 190
const R = 78
const STROKE = 30
const C = 2 * Math.PI * R

export default function UniverseComposition() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const cx = SIZE / 2
  const cy = SIZE / 2

  let offset = 0
  const arcs = SEGMENTS.map((s) => {
    const len = (s.value / 100) * C
    const arc = {
      color: isDark ? s.dark : s.light,
      dash: `${len} ${C - len}`,
      // Start each arc where the previous ended; -90deg puts the first at 12 o'clock.
      offset: -offset,
      label: s.label,
      value: s.value,
    }
    offset += len
    return arc
  })

  return (
    <DemoFrame
      title="What the universe is made of"
      isDark={isDark}
      caption="The Standard Model describes only ordinary matter, about 5% of the total. The rest is dark matter and dark energy, whose nature remains unknown."
    >
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Donut chart: dark energy 68 percent, dark matter 27 percent, ordinary matter 5 percent"
        >
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {arcs.map((a) => (
              <circle
                key={a.label}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth={STROKE}
                strokeDasharray={a.dash}
                strokeDashoffset={a.offset}
              />
            ))}
          </g>
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            style={{ fontSize: 22, fontWeight: 700, fill: p.text }}
          >
            95%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fill: p.muted }}>
            unknown
          </text>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
          {SEGMENTS.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: isDark ? s.dark : s.light,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: p.text, fontWeight: 600 }}>{s.value}%</span>
              <span style={{ color: p.muted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DemoFrame>
  )
}
