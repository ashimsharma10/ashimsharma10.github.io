'use client'

import { DemoFrame, palette, useIsDark } from './shared'

const FONT = 'system-ui, sans-serif'

const EVENTS: { year: string; text: string; sub?: string }[] = [
  {
    year: '1900',
    text: 'Planck: energy comes in packets.',
    sub: 'He calls his own idea "an act of desperation."',
  },
  {
    year: '1905',
    text: 'Einstein: light itself is packets, photons.',
    sub: 'This, not relativity, is what his Nobel Prize was for.',
  },
  {
    year: '1925',
    text: 'Heisenberg, 23, builds quantum mechanics on Helgoland.',
    sub: 'Two weeks of hay-fever exile, one 3 a.m. breakthrough.',
  },
  {
    year: '1926',
    text: 'Schrödinger writes the wave equation.',
  },
  {
    year: '1935',
    text: 'Einstein: entanglement is "spooky action," the theory must be incomplete.',
  },
  {
    year: '1964',
    text: 'Bell turns the philosophical argument into a lab experiment.',
    sub: 'The experiments run for decades. Quantum mechanics wins every time.',
  },
  {
    year: '1970s',
    text: 'The Standard Model is assembled, piece by piece.',
  },
  {
    year: '2012',
    text: 'The Higgs boson, the last missing part, is found at the LHC.',
  },
  {
    year: '2025',
    text: 'Quantum mechanics turns 100. Still undefeated.',
  },
]

export default function QuantumTimeline() {
  const isDark = useIsDark()
  const p = palette(isDark)
  return (
    <DemoFrame title="One century, nine steps" isDark={isDark}>
      <div style={{ fontFamily: FONT }}>
        {EVENTS.map((e, i) => {
          const last = i === EVENTS.length - 1
          return (
            <div key={e.year} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
              <div
                style={{
                  width: 52,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontSize: 13,
                  fontWeight: 800,
                  color: p.accent,
                  paddingTop: 1,
                }}
              >
                {e.year}
              </div>
              <div
                style={{
                  width: 14,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: last ? p.secondary : p.accent,
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                {!last && <div style={{ width: 2, flex: 1, background: p.border }} />}
              </div>
              <div style={{ paddingBottom: last ? 0 : 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: p.text, lineHeight: 1.45 }}>
                  {e.text}
                </div>
                {e.sub && (
                  <div style={{ fontSize: 12, color: p.muted, lineHeight: 1.45, marginTop: 1 }}>
                    {e.sub}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </DemoFrame>
  )
}
