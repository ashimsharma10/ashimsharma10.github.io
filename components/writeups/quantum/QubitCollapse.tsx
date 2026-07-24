'use client'

import { useId, useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './shared'

export default function QubitCollapse() {
  const sliderId = useId()
  const isDark = useIsDark()
  const p = palette(isDark)
  const [thetaDeg, setThetaDeg] = useState(90)
  const [count0, setCount0] = useState(0)
  const [count1, setCount1] = useState(0)
  const [last, setLast] = useState<0 | 1 | null>(null)

  const theta = (thetaDeg * Math.PI) / 180
  const prob0 = Math.cos(theta / 2) ** 2
  const prob1 = 1 - prob0
  const total = count0 + count1

  const measure = (n: number) => {
    let zeros = 0
    let final: 0 | 1 = 0
    for (let i = 0; i < n; i++) {
      const outcome: 0 | 1 = Math.random() < prob0 ? 0 : 1
      if (outcome === 0) zeros++
      final = outcome
    }
    setCount0((c) => c + zeros)
    setCount1((c) => c + (n - zeros))
    setLast(final)
  }

  const onSlider = (value: number) => {
    setThetaDeg(value)
    setCount0(0)
    setCount1(0)
    setLast(null)
  }

  // State arrow tip: |0> points up, |1> points down.
  const cx = 95
  const cy = 95
  const r = 68
  const tipX = cx + r * Math.sin(theta)
  const tipY = cy - r * Math.cos(theta)
  const collapsedY = last === 0 ? cy - r : cy + r

  const bar = (label: string, prob: number, count: number) => (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: p.text }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span>
          predicted {(prob * 100).toFixed(0)}%
          {total > 0 && (
            <span style={{ color: p.muted }}>
              {' '}
              · observed {((count / total) * 100).toFixed(1)}% ({count})
            </span>
          )}
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: p.panel, overflow: 'hidden' }}>
        <div
          style={{
            width: `${prob * 100}%`,
            height: '100%',
            background: p.accent,
            transition: 'width 120ms',
          }}
        />
      </div>
    </div>
  )

  return (
    <DemoFrame
      title="Superposition: measure a qubit"
      isDark={isDark}
      caption="Slide to mix the two states, then measure. Each measurement returns exactly one answer, never the mixture. Only the statistics of many measurements reveal the weights you dialed in. Moving the slider prepares a new state, so the tally resets."
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
        <svg width="190" height="190" viewBox="0 0 190 190" style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={p.border} strokeWidth="1.5" />
          <text x={cx} y={16} textAnchor="middle" fill={p.text} fontSize="13" fontWeight="600">
            state 0
          </text>
          <text x={cx} y={184} textAnchor="middle" fill={p.text} fontSize="13" fontWeight="600">
            state 1
          </text>
          {/* Prepared state arrow (ghosted once a measurement collapsed it) */}
          <line
            x1={cx}
            y1={cy}
            x2={tipX}
            y2={tipY}
            stroke={last === null ? p.accent : p.muted}
            strokeWidth="3"
            strokeDasharray={last === null ? undefined : '4 4'}
            strokeLinecap="round"
          />
          <circle cx={tipX} cy={tipY} r="5" fill={last === null ? p.accent : p.muted} />
          {last !== null && (
            <>
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={collapsedY}
                stroke={p.secondary}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx={cx} cy={collapsedY} r="6" fill={p.secondary} />
            </>
          )}
          <circle cx={cx} cy={cy} r="3" fill={p.text} />
        </svg>

        <div style={{ flex: '1 1 260px', minWidth: 240 }}>
          <label
            htmlFor={sliderId}
            style={{ fontSize: 12, color: p.muted, display: 'block', marginBottom: 4 }}
          >
            Mix the state: how much of each possibility
          </label>
          <input
            id={sliderId}
            type="range"
            min="0"
            max="180"
            value={thetaDeg}
            onChange={(e) => onSlider(Number(e.target.value))}
            style={{ width: '100%', accentColor: p.accent }}
          />
          <div style={{ margin: '10px 0 14px' }}>
            {bar('state 0', prob0, count0)}
            {bar('state 1', prob1, count1)}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <DemoButton isDark={isDark} primary onClick={() => measure(1)}>
              Measure
            </DemoButton>
            <DemoButton isDark={isDark} onClick={() => measure(100)}>
              Measure ×100
            </DemoButton>
            <DemoButton
              isDark={isDark}
              onClick={() => {
                setCount0(0)
                setCount1(0)
                setLast(null)
              }}
            >
              Reset
            </DemoButton>
            <span style={{ fontSize: 12, color: p.muted }}>
              {last === null ? 'not measured yet' : `last result: state ${last}`}
            </span>
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
