'use client'

import { useEffect, useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './quantum/shared'

// Static vs continuous batching, animated. Fully scripted (no randomness) so
// the first render is deterministic; the clock only advances via play/step.
const TOTAL = 100 // one run = 100 engine steps

interface Seg {
  start: number
  end: number
  label: string
  kind: 'work' | 'idle'
}

// Three GPU slots each. Same three requests arrive at step 0 in both worlds:
// A runs the full 100 steps, B and C finish at step 10.
const STATIC_LANES: { name: string; segs: Seg[] }[] = [
  { name: 'slot 1', segs: [{ start: 0, end: 100, label: 'request A', kind: 'work' }] },
  {
    name: 'slot 2',
    segs: [
      { start: 0, end: 10, label: 'B', kind: 'work' },
      { start: 10, end: 100, label: 'idle, memory held', kind: 'idle' },
    ],
  },
  {
    name: 'slot 3',
    segs: [
      { start: 0, end: 10, label: 'C', kind: 'work' },
      { start: 10, end: 100, label: 'idle, memory held', kind: 'idle' },
    ],
  },
]

const CONT_LANES: { name: string; segs: Seg[] }[] = [
  { name: 'slot 1', segs: [{ start: 0, end: 100, label: 'request A', kind: 'work' }] },
  {
    name: 'slot 2',
    segs: [
      { start: 0, end: 10, label: 'B', kind: 'work' },
      { start: 10, end: 70, label: 'request D admitted', kind: 'work' },
      { start: 70, end: 100, label: 'request F', kind: 'work' },
    ],
  },
  {
    name: 'slot 3',
    segs: [
      { start: 0, end: 10, label: 'C', kind: 'work' },
      { start: 10, end: 80, label: 'request E admitted', kind: 'work' },
      { start: 80, end: 100, label: 'request G', kind: 'work' },
    ],
  },
]

function tokensDone(lanes: { segs: Seg[] }[], step: number): number {
  let total = 0
  for (const lane of lanes) {
    for (const seg of lane.segs) {
      if (seg.kind !== 'work') continue
      total += Math.max(0, Math.min(step, seg.end) - seg.start)
    }
  }
  return total
}

function Lane({
  name,
  segs,
  step,
  isDark,
}: {
  name: string
  segs: Seg[]
  step: number
  isDark: boolean
}) {
  const p = palette(isDark)
  const idleBg = isDark ? '#7f1d1d' : '#fee2e2'
  const idleText = isDark ? '#fecaca' : '#b91c1c'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <div style={{ width: '42px', fontSize: '11px', color: p.muted, flexShrink: 0 }}>{name}</div>
      <div
        style={{
          position: 'relative',
          flex: 1,
          height: '22px',
          background: p.panel,
          borderRadius: '5px',
          overflow: 'hidden',
        }}
      >
        {segs.map((seg) => {
          const visible = Math.max(0, Math.min(step, seg.end) - seg.start)
          if (visible <= 0) return null
          const grown = visible / (seg.end - seg.start)
          return (
            <div
              key={`${seg.start}-${seg.label}`}
              style={{
                position: 'absolute',
                left: `${seg.start}%`,
                width: `${(seg.end - seg.start) * grown}%`,
                top: '2px',
                bottom: '2px',
                borderRadius: '4px',
                background: seg.kind === 'work' ? p.accentSoft : idleBg,
                border: `1px solid ${seg.kind === 'work' ? p.accent : idleText}`,
                color: seg.kind === 'work' ? p.accent : idleText,
                fontSize: '10px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {grown > 0.35 ? seg.label : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function BatchingSim() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= TOTAL) {
          setPlaying(false)
          return s
        }
        return s + 1
      })
    }, 45)
    return () => clearInterval(id)
  }, [playing])

  const staticTokens = tokensDone(STATIC_LANES, step)
  const contTokens = tokensDone(CONT_LANES, step)
  const gain = staticTokens > 0 ? (contTokens / staticTokens).toFixed(1) : '1.0'

  return (
    <DemoFrame
      title="Static vs continuous batching, same GPU, same requests"
      isDark={isDark}
      caption={
        <>
          B and C finish at step 10. A static batch keeps their slots locked until A drains at step
          100; continuous batching admits D, E, F and G the moment a slot frees. Same wall clock,{' '}
          {gain}x the finished tokens.
        </>
      }
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
        <DemoButton isDark={isDark} primary onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : step >= TOTAL ? 'Replay' : 'Play'}
        </DemoButton>
        <DemoButton
          isDark={isDark}
          onClick={() => {
            setPlaying(false)
            setStep(0)
          }}
        >
          Reset
        </DemoButton>
        <div style={{ fontSize: '11px', color: p.muted, marginLeft: 'auto' }}>
          engine step {step} / {TOTAL}
        </div>
      </div>

      <div style={{ fontSize: '12px', fontWeight: 700, color: p.text, marginBottom: '6px' }}>
        Static batching{' '}
        <span style={{ fontWeight: 400, color: p.muted }}>
          {staticTokens} tokens of useful work
        </span>
      </div>
      {STATIC_LANES.map((l) => (
        <Lane key={l.name} name={l.name} segs={l.segs} step={step} isDark={isDark} />
      ))}

      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: p.text,
          margin: '14px 0 6px',
        }}
      >
        Continuous batching{' '}
        <span style={{ fontWeight: 400, color: p.muted }}>{contTokens} tokens of useful work</span>
      </div>
      {CONT_LANES.map((l) => (
        <Lane key={l.name} name={l.name} segs={l.segs} step={step} isDark={isDark} />
      ))}

      {(playing || step > 0) && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: p.muted }}>
          {step < 10
            ? 'All three requests are decoding in both worlds. No difference yet.'
            : step < 100
              ? 'B and C are done. Watch the red: the static batch is paying for slots that do nothing until A finishes.'
              : 'The run is over. The static GPU spent most of its slot-time idle; the continuous one never stopped working.'}
        </div>
      )}
    </DemoFrame>
  )
}
