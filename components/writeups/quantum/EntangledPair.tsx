'use client'

import { useEffect, useRef, useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './shared'

type Face = 'H' | 'T'

function Coin({
  face,
  spinning,
  isDark,
}: {
  face: Face | null
  spinning: boolean
  isDark: boolean
}) {
  const p = palette(isDark)
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        border: `2.5px solid ${face === null ? p.border : p.accent}`,
        background: face === null ? p.panel : p.accentSoft,
        color: p.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        fontWeight: 700,
        margin: '0 auto',
        opacity: spinning ? 0.35 : 1,
        transition: 'opacity 150ms',
      }}
    >
      {spinning ? '?' : (face ?? '?')}
    </div>
  )
}

export default function EntangledPair() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [history, setHistory] = useState<Face[]>([])
  const [spinning, setSpinning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const lastFace = history.length > 0 ? history[history.length - 1] : null
  const heads = history.filter((f) => f === 'H').length
  const pct = (n: number) => ((n / history.length) * 100).toFixed(0) + '%'

  const measureOnce = () => {
    if (spinning) return
    setSpinning(true)
    timerRef.current = setTimeout(() => {
      setHistory((h) => [...h, Math.random() < 0.5 ? 'H' : 'T'])
      setSpinning(false)
    }, 450)
  }

  const measureTwenty = () => {
    if (spinning) return
    const batch = Array.from({ length: 20 }, (): Face => (Math.random() < 0.5 ? 'H' : 'T'))
    setHistory((h) => [...h, ...batch])
  }

  const lab = (name: string, place: string) => (
    <div
      style={{
        flex: '1 1 160px',
        border: `1.5px solid ${p.border}`,
        borderRadius: 10,
        padding: '14px 12px',
        textAlign: 'center',
        background: p.panel,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: p.text }}>{name}</div>
      <div style={{ fontSize: 11, color: p.muted, marginBottom: 10 }}>{place}</div>
      <Coin face={lastFace} spinning={spinning} isDark={isDark} />
    </div>
  )

  const stat = (label: string, value: string) => (
    <div style={{ textAlign: 'center', minWidth: 86 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: p.text }}>{value}</div>
      <div style={{ fontSize: 11, color: p.muted }}>{label}</div>
    </div>
  )

  return (
    <DemoFrame
      title="Entanglement: one pair, two labs"
      isDark={isDark}
      caption="Each lab alone sees a fair coin: heads about half the time, in no predictable order. The 100% agreement only shows up when the labs compare notes afterward, by ordinary slower-than-light communication. That is why entanglement cannot be used to send a message."
    >
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        {lab('Lab A', 'Earth')}
        {lab('Lab B', '4 light-years away')}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <DemoButton isDark={isDark} primary onClick={measureOnce} disabled={spinning}>
          Measure the pair
        </DemoButton>
        <DemoButton isDark={isDark} onClick={measureTwenty} disabled={spinning}>
          Measure ×20
        </DemoButton>
        <DemoButton isDark={isDark} onClick={() => setHistory([])} disabled={spinning}>
          Reset
        </DemoButton>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          borderTop: `1px solid ${p.border}`,
          paddingTop: 12,
        }}
      >
        {stat('pairs measured', String(history.length))}
        {stat('Lab A heads', history.length ? pct(heads) : '·')}
        {stat('Lab B heads', history.length ? pct(heads) : '·')}
        {stat('labs agree', history.length ? '100%' : '·')}
      </div>
      {history.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: p.muted, lineHeight: 1.8 }}>
          last results:{' '}
          {history.slice(-12).map((f, i) => (
            <span
              key={history.length - 12 + i}
              style={{
                display: 'inline-block',
                padding: '1px 7px',
                marginRight: 4,
                borderRadius: 6,
                border: `1px solid ${p.border}`,
                color: f === 'H' ? p.accent : p.secondary,
                fontWeight: 600,
              }}
            >
              A:{f} B:{f}
            </span>
          ))}
        </div>
      )}
    </DemoFrame>
  )
}
