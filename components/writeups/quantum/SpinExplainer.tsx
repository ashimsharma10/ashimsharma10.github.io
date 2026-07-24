'use client'

import type { ReactNode } from 'react'
import { DemoFrame, palette, useIsDark, type DemoPalette } from './shared'

const FONT = 'system-ui, sans-serif'

function Panel({
  n,
  title,
  body,
  isDark,
  children,
}: {
  n: number
  title: string
  body: string
  isDark: boolean
  children: ReactNode
}) {
  const p = palette(isDark)
  return (
    <div
      style={{
        flex: '1 1 220px',
        border: `1.5px solid ${p.border}`,
        borderRadius: 10,
        padding: 12,
        background: p.panel,
        fontFamily: FONT,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: p.text, marginBottom: 8 }}>
        <span style={{ color: p.accent }}>{n}</span> · {title}
      </div>
      <div
        style={{
          height: 128,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
      <div style={{ fontSize: 12, color: p.muted, lineHeight: 1.45, marginTop: 8 }}>{body}</div>
    </div>
  )
}

// 1. The myth: a spinning ball, crossed out.
function BallMyth({ p, isDark }: { p: DemoPalette; isDark: boolean }) {
  return (
    <svg width="150" height="128" viewBox="0 0 150 128">
      <circle cx={70} cy={64} r={40} fill={p.accentSoft} stroke={p.accent} strokeWidth={2} />
      <circle cx={56} cy={50} r={11} fill={isDark ? '#334155' : '#ffffff'} opacity={0.5} />
      {/* rotation arrow around the ball */}
      <path
        d="M 70 16 A 48 48 0 0 1 118 64"
        fill="none"
        stroke={p.muted}
        strokeWidth={2.5}
        strokeDasharray="5 5"
      />
      <path d="M 118 64 l -9 -12 l 13 -1 z" fill={p.muted} />
      {/* big red cross */}
      <line
        x1={26}
        y1={20}
        x2={114}
        y2={108}
        stroke={p.secondary}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <line
        x1={114}
        y1={20}
        x2={26}
        y2={108}
        stroke={p.secondary}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  )
}

// 2. The real picture: a tilted angular-momentum arrow on a cone.
function RealArrow({ p }: { p: DemoPalette }) {
  return (
    <svg width="150" height="128" viewBox="0 0 150 128">
      <line
        x1={75}
        y1={12}
        x2={75}
        y2={116}
        stroke={p.border}
        strokeWidth={1.5}
        strokeDasharray="4 5"
      />
      <ellipse
        cx={75}
        cy={30}
        rx={34}
        ry={11}
        fill="none"
        stroke={p.muted}
        strokeWidth={1.5}
        strokeDasharray="3 5"
      />
      <circle cx={75} cy={78} r={16} fill={p.accentSoft} stroke={p.accent} strokeWidth={1.5} />
      {/* the spin arrow, tilted, tip on the cone rim */}
      <line
        x1={75}
        y1={78}
        x2={109}
        y2={30}
        stroke={p.secondary}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path d="M 109 30 l -12 1 l 4 -11 z" fill={p.secondary} />
      <text
        x={75}
        y={126}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={11}
        fontWeight={700}
        fill={p.muted}
      >
        it wobbles, like a top
      </text>
    </svg>
  )
}

// 3. Measurement: only two answers, up or down.
function TwoAnswers({ p }: { p: DemoPalette }) {
  return (
    <svg width="150" height="128" viewBox="0 0 150 128">
      <circle cx={45} cy={40} r={20} fill={p.accentSoft} stroke={p.accent} strokeWidth={2} />
      <line
        x1={45}
        y1={54}
        x2={45}
        y2={26}
        stroke={p.accent}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path d="M 45 26 l -5 8 l 10 0 z" fill={p.accent} />
      <text x={78} y={45} fontFamily={FONT} fontSize={13} fontWeight={700} fill={p.text}>
        up
      </text>
      <circle cx={45} cy={92} r={20} fill={p.accentSoft} stroke={p.accent} strokeWidth={2} />
      <line
        x1={45}
        y1={78}
        x2={45}
        y2={106}
        stroke={p.accent}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path d="M 45 106 l -5 -8 l 10 0 z" fill={p.accent} />
      <text x={78} y={97} fontFamily={FONT} fontSize={13} fontWeight={700} fill={p.text}>
        down
      </text>
      <text
        x={128}
        y={69}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={22}
        fontWeight={800}
        fill={p.muted}
      >
        {'}'}
      </text>
    </svg>
  )
}

// 4. The 720 twist: one turn flips the sign, two turns restore it.
function Twist({ p }: { p: DemoPalette }) {
  return (
    <svg width="160" height="128" viewBox="0 0 160 128">
      {/* 360: sign flipped */}
      <text
        x={44}
        y={30}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={11}
        fontWeight={700}
        fill={p.muted}
      >
        after 360°
      </text>
      <circle cx={44} cy={64} r={26} fill="none" stroke={p.secondary} strokeWidth={2.5} />
      <path d="M 44 38 A 26 26 0 1 1 20 56" fill="none" stroke={p.secondary} strokeWidth={2.5} />
      <path d="M 20 56 l 8 -3 l 0 10 z" fill={p.secondary} />
      <text
        x={44}
        y={72}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={26}
        fontWeight={800}
        fill={p.secondary}
      >
        −
      </text>
      {/* 720: back to itself */}
      <text
        x={120}
        y={30}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={11}
        fontWeight={700}
        fill={p.muted}
      >
        after 720°
      </text>
      <circle cx={120} cy={64} r={26} fill="none" stroke={p.accent} strokeWidth={2.5} />
      <text
        x={120}
        y={72}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={26}
        fontWeight={800}
        fill={p.accent}
      >
        +
      </text>
    </svg>
  )
}

export default function SpinExplainer() {
  const isDark = useIsDark()
  const p = palette(isDark)
  return (
    <DemoFrame
      title="Spin: what is actually rotating (nothing)"
      isDark={isDark}
      caption="Spin is real, measurable angular momentum, the same quantity a spinning top has, but the particle carrying it has no size and no surface, so nothing is actually turning. It behaves like rotation with two twists nothing in daily life shares: a measurement returns only two values, and it takes a double turn to bring the state back to itself."
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Panel
          n={1}
          title="The mental picture"
          body="Everyone imagines a tiny ball spinning on an axis. Natural, and wrong: an electron has no surface to spin."
          isDark={isDark}
        >
          <BallMyth p={p} isDark={isDark} />
        </Panel>
        <Panel
          n={2}
          title="What physicists draw"
          body="An arrow of angular momentum that wobbles around a magnetic field, like a tilted gyroscope. This part is real."
          isDark={isDark}
        >
          <RealArrow p={p} />
        </Panel>
        <Panel
          n={3}
          title="What a measurement gives"
          body="Never a range. Measure the spin and you get exactly two answers, up or down, and nothing in between."
          isDark={isDark}
        >
          <TwoAnswers p={p} />
        </Panel>
        <Panel
          n={4}
          title="The genuinely strange bit"
          body="Turn the state a full 360° and it comes back with its sign flipped. Only after 720°, two full turns, is it truly itself."
          isDark={isDark}
        >
          <Twist p={p} />
        </Panel>
      </div>
    </DemoFrame>
  )
}
