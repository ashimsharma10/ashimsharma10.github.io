'use client'

import { useEffect, useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './quantum/shared'

// A toy MoE layer: 8 experts, top-2 routing. Every score is a pure function of the
// token index, computed once at module scope, so the first render is deterministic
// and Strict Mode's double effect cannot change what you see.
const N_EXPERTS = 8
const TOP_K = 2

const TOKENS = [
  'The',
  'router',
  'is',
  'one',
  'linear',
  'layer',
  '.',
  'It',
  'scores',
  'every',
  'expert',
  ',',
  'keeps',
  'the',
  'best',
  'two',
  ',',
  'and',
  'skips',
  'the',
  'rest',
  '.',
]

// Deterministic pseudo-random in [0, 1). Math.random would break the first render.
function noise(token: number, expert: number): number {
  const x = Math.sin(token * 127.1 + expert * 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Left alone, a couple of experts drift ahead and take a disproportionate share,
// while expert 0 never gets picked at all and so never learns anything.
const POPULARITY = [0.02, 0.08, 0.34, 0.12, 0.03, 0.28, 0.09, 0.02]

interface Step {
  scores: number[]
  chosen: number[]
}

// Replay the whole token stream once per mode. `balanced` adds the DeepSeek-V3 style
// bias: a per-expert number added to the routing score only, nudged down when an
// expert is busy and up when it is starving. No gradient, no extra loss term.
function schedule(balanced: boolean): Step[] {
  const bias = new Array(N_EXPERTS).fill(0)
  const counts = new Array(N_EXPERTS).fill(0)
  const steps: Step[] = []

  TOKENS.forEach((_, t) => {
    const base = Array.from(
      { length: N_EXPERTS },
      (_, e) => 0.6 * noise(t, e) + POPULARITY[e] + (balanced ? bias[e] : 0)
    )
    const chosen = base
      .map((s, e) => [s, e] as const)
      .sort((a, b) => b[0] - a[0])
      .slice(0, TOP_K)
      .map(([, e]) => e)

    steps.push({ scores: base, chosen })
    chosen.forEach((e) => (counts[e] += 1))

    if (balanced) {
      const fairShare = ((t + 1) * TOP_K) / N_EXPERTS
      for (let e = 0; e < N_EXPERTS; e++) {
        bias[e] += counts[e] > fairShare ? -0.05 : 0.05
      }
    }
  })

  return steps
}

const SCHEDULES = { raw: schedule(false), balanced: schedule(true) }

export default function MoERouterSim() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [balanced, setBalanced] = useState(false)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const steps = balanced ? SCHEDULES.balanced : SCHEDULES.raw
  const last = TOKENS.length - 1

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= last) {
          setPlaying(false)
          return s
        }
        return s + 1
      })
    }, 620)
    return () => clearInterval(id)
  }, [playing, last])

  const current = steps[step]
  const maxScore = Math.max(...current.scores)

  // Counters up to and including the current token.
  const counts = new Array(N_EXPERTS).fill(0)
  for (let s = 0; s <= step; s++) steps[s].chosen.forEach((e) => (counts[e] += 1))
  const touched = counts.filter((c) => c > 0).length
  const busiest = Math.max(...counts)
  const totalPicks = (step + 1) * TOP_K

  return (
    <DemoFrame
      title="A router picking 2 of 8 experts, token by token"
      isDark={isDark}
      caption={
        <>
          Two counters worth watching. Each token uses 2 experts out of 8, which is the saving
          everyone quotes. The batch touches nearly all 8 within a few tokens, which is why that
          saving mostly disappears once you serve real traffic. With balancing off, expert 2 ends up
          with about 39 percent of all the work and expert 0 is never picked at all, so it receives
          no gradient and learns nothing. Switch balancing on and the load flattens out.
        </>
      }
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '14px',
        }}
      >
        <DemoButton isDark={isDark} primary onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : step >= last ? 'Replay' : 'Play'}
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
        <DemoButton isDark={isDark} onClick={() => setBalanced((v) => !v)}>
          balancing: {balanced ? 'on' : 'off'}
        </DemoButton>
        <div style={{ fontSize: '11px', color: p.muted, marginLeft: 'auto' }}>
          token {step + 1} / {TOKENS.length}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: p.muted, marginBottom: '10px' }}>
        routing{' '}
        <span
          style={{
            color: p.text,
            fontWeight: 700,
            background: p.panel,
            border: `1px solid ${p.border}`,
            borderRadius: '4px',
            padding: '1px 6px',
          }}
        >
          {TOKENS[step]}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '5px', marginBottom: '14px' }}>
        {Array.from({ length: N_EXPERTS }, (_, e) => {
          const picked = current.chosen.includes(e)
          const width = `${Math.max(3, (current.scores[e] / maxScore) * 100)}%`
          return (
            <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  width: '58px',
                  color: picked ? p.accent : p.muted,
                }}
              >
                expert {e}
              </span>
              <div
                style={{
                  flex: 1,
                  height: '18px',
                  borderRadius: '4px',
                  background: p.panel,
                  border: `1px solid ${picked ? p.accent : p.border}`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width,
                    background: picked ? (isDark ? `${p.accent}55` : `${p.accent}33`) : p.border,
                    transition: 'width 0.35s',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '10px',
                  width: '92px',
                  textAlign: 'right',
                  color: picked ? p.accent : p.muted,
                  fontWeight: picked ? 700 : 400,
                }}
              >
                {picked ? 'chosen' : 'skipped'} · {counts[e]} tok
              </span>
            </div>
          )
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: p.text,
          padding: '8px 10px',
          background: p.panel,
          borderRadius: '8px',
        }}
      >
        <span>
          this token used{' '}
          <b>
            {TOP_K} of {N_EXPERTS}
          </b>{' '}
          experts
        </span>
        <span>
          the batch so far has touched{' '}
          <b style={{ color: touched === N_EXPERTS ? p.secondary : p.text }}>
            {touched} of {N_EXPERTS}
          </b>
        </span>
        <span>
          busiest expert holds{' '}
          <b style={{ color: busiest / totalPicks > 0.35 ? p.secondary : p.good }}>
            {Math.round((busiest / totalPicks) * 100)}%
          </b>{' '}
          of all picks
        </span>
      </div>
    </DemoFrame>
  )
}
