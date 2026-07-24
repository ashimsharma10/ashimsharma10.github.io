'use client'

import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { palette } from './shared'
import {
  SM_HEIGHT,
  SM_SCENE_ATOM,
  SM_SCENE_PROTON,
  SM_SCENE_ROSTER,
  SM_WIDTH,
} from './standardModelConstants'

const FONT = 'system-ui, sans-serif'

function Caption({ text, color, fadeAt = 0 }: { text: string; color: string; fadeAt?: number }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [fadeAt, fadeAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 24,
        right: 24,
        textAlign: 'center',
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 600,
        color,
        opacity,
        lineHeight: 1.35,
      }}
    >
      {text}
    </div>
  )
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function Quark({
  x,
  y,
  letter,
  color,
  r = 17,
}: {
  x: number
  y: number
  letter: string
  color: string
  r?: number
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      <text
        x={x}
        y={y + r * 0.35}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={r * 1.1}
        fontWeight={800}
        fill="#ffffff"
      >
        {letter}
      </text>
    </g>
  )
}

/** Scene 1: three quarks fly together into a proton. */
function ProtonScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const quarkColor = isDark ? '#a855f7' : '#7c3aed'
  const downColor = isDark ? '#c084fc' : '#9333ea'
  const t = interpolate(frame, [0, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  // Final triangular slots inside the proton (center 320,168).
  const slots = [
    { x: 320, y: 148 },
    { x: 300, y: 186 },
    { x: 340, y: 186 },
  ]
  const starts = [
    { x: 60, y: 60 },
    { x: 60, y: 300 },
    { x: 585, y: 300 },
  ]
  const letters = ['u', 'u', 'd']
  const colors = [quarkColor, quarkColor, downColor]
  const merged = interpolate(frame, [52, 66], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    // No fade-in: frame 0 is the poster.
    <AbsoluteFill>
      <svg width={SM_WIDTH} height={SM_HEIGHT}>
        <circle
          cx={320}
          cy={168}
          r={54}
          fill={p.accentSoft}
          stroke={p.accent}
          strokeWidth={2.5}
          opacity={merged * 0.9}
        />
        {slots.map((slot, i) => (
          <Quark
            key={i}
            x={lerp(starts[i].x, slot.x, t)}
            y={lerp(starts[i].y, slot.y, t)}
            letter={letters[i]}
            color={colors[i]}
          />
        ))}
        <text
          x={320}
          y={252}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={15}
          fontWeight={700}
          fill={p.text}
          opacity={merged}
        >
          proton
        </text>
      </svg>
      <Caption
        text="Start with quarks. Two 'up' quarks and one 'down' quark stick together and make a proton."
        color={p.text}
        fadeAt={-10}
      />
    </AbsoluteFill>
  )
}

/** Scene 2: proton + neutrons form a nucleus, electrons orbit: an atom. */
function AtomScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })
  const quarkColor = isDark ? '#a855f7' : '#7c3aed'
  const neutronColor = isDark ? '#64748b' : '#94a3b8'
  const cx = 322
  const cy = 172
  const nucleons = [
    { dx: -12, dy: -8, color: quarkColor },
    { dx: 12, dy: -6, color: neutronColor },
    { dx: -6, dy: 12, color: quarkColor },
    { dx: 14, dy: 14, color: neutronColor },
  ]
  const eFade = interpolate(frame, [24, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const angle = frame * 0.09
  const rx = 150
  const ry = 74
  const electrons = [0, Math.PI].map((phase) => ({
    x: cx + rx * Math.cos(angle + phase),
    y: cy + ry * Math.sin(angle + phase),
  }))
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={SM_WIDTH} height={SM_HEIGHT}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={p.border}
          strokeWidth={1.5}
          strokeDasharray="4 6"
          opacity={eFade}
        />
        {nucleons.map((n, i) => (
          <circle key={i} cx={cx + n.dx} cy={cy + n.dy} r={13} fill={n.color} />
        ))}
        {electrons.map((e, i) => (
          <g key={i} opacity={eFade}>
            <circle cx={e.x} cy={e.y} r={8} fill={p.accent} />
            <text
              x={e.x}
              y={e.y + 4}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={11}
              fontWeight={800}
              fill={isDark ? '#111827' : '#ffffff'}
            >
              e
            </text>
          </g>
        ))}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={12}
          fontWeight={700}
          fill={p.text}
          opacity={0}
        >
          .
        </text>
      </svg>
      <Caption
        text="Bunch protons and neutrons into a nucleus, wrap electrons around it, and you have an atom. Everything you are made of is built from just these."
        color={p.text}
        fadeAt={14}
      />
    </AbsoluteFill>
  )
}

type Fam = 'quark' | 'lepton' | 'neutrino' | 'force' | 'higgs'

function famColor(fam: Fam, isDark: boolean) {
  const map: Record<Fam, { light: string; dark: string; text: string; textDark: string }> = {
    quark: { light: '#f3e8ff', dark: '#3b0764', text: '#7c3aed', textDark: '#d8b4fe' },
    lepton: { light: '#ccfbf1', dark: '#042f2e', text: '#0f766e', textDark: '#5eead4' },
    neutrino: { light: '#f1f5f9', dark: '#1e293b', text: '#475569', textDark: '#94a3b8' },
    force: { light: '#fef3c7', dark: '#451a03', text: '#b45309', textDark: '#fcd34d' },
    higgs: { light: '#ffe4e6', dark: '#4c0519', text: '#be123c', textDark: '#fda4af' },
  }
  const c = map[fam]
  return { bg: isDark ? c.dark : c.light, text: isDark ? c.textDark : c.text }
}

function Tile({
  sym,
  fam,
  isDark,
  opacity,
  w = 62,
}: {
  sym: string
  fam: Fam
  isDark: boolean
  opacity: number
  w?: number
}) {
  const c = famColor(fam, isDark)
  return (
    <div
      style={{
        width: w,
        height: 40,
        borderRadius: 8,
        background: c.bg,
        color: c.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 17,
        fontWeight: 800,
        opacity,
        fontFamily: FONT,
      }}
    >
      {sym}
    </div>
  )
}

/** Scene 3: the full roster fades in, gen 1 first. */
function RosterScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })
  const reveal = (at: number) =>
    interpolate(frame, [at, at + 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  const genOpacity = [reveal(6), reveal(34), reveal(52)]
  const forceOpacity = reveal(74)

  const rows: { fam: Fam; syms: [string, string, string] }[] = [
    { fam: 'quark', syms: ['u', 'c', 't'] },
    { fam: 'quark', syms: ['d', 's', 'b'] },
    { fam: 'lepton', syms: ['e', 'μ', 'τ'] },
    { fam: 'neutrino', syms: ['νe', 'νμ', 'ντ'] },
  ]
  const forces: { sym: string; fam: Fam }[] = [
    { sym: 'γ', fam: 'force' },
    { sym: 'g', fam: 'force' },
    { sym: 'WZ', fam: 'force' },
    { sym: 'H', fam: 'higgs' },
  ]

  const label = (text: string, opacity: number, color: string) => (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        textAlign: 'center',
        color,
        opacity,
        fontFamily: FONT,
        width: 62,
      }}
    >
      {text}
    </div>
  )

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          gap: 26,
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 54,
          fontFamily: FONT,
        }}
      >
        {/* matter block */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: p.text,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            MATTER
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {label('you', genOpacity[0], p.accent)}
            {label('heavier', genOpacity[1], p.muted)}
            {label('heaviest', genOpacity[2], p.muted)}
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                position: 'absolute',
                left: -5,
                top: -4,
                width: 72,
                height: 'calc(100% + 8px)',
                border: `2px dashed ${p.accent}`,
                borderRadius: 10,
                opacity: genOpacity[0],
              }}
            />
            {rows.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 8 }}>
                {row.syms.map((sym, ci) => (
                  <Tile key={ci} sym={sym} fam={row.fam} isDark={isDark} opacity={genOpacity[ci]} />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* forces block */}
        <div style={{ opacity: forceOpacity }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: p.text,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            FORCES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
            {forces.map((f, i) => (
              <Tile key={i} sym={f.sym} fam={f.fam} isDark={isDark} opacity={forceOpacity} w={62} />
            ))}
          </div>
        </div>
      </div>
      <Caption
        text="All 17 particles. The dashed column builds you; the rest are heavier copies plus the four force-carriers. Gravity is the one thing still missing."
        color={p.text}
        fadeAt={88}
      />
    </AbsoluteFill>
  )
}

export default function StandardModelComposition({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <Sequence from={0} durationInFrames={SM_SCENE_PROTON}>
        <ProtonScene isDark={isDark} />
      </Sequence>
      <Sequence from={SM_SCENE_PROTON} durationInFrames={SM_SCENE_ATOM}>
        <AtomScene isDark={isDark} />
      </Sequence>
      <Sequence from={SM_SCENE_PROTON + SM_SCENE_ATOM} durationInFrames={SM_SCENE_ROSTER}>
        <RosterScene isDark={isDark} />
      </Sequence>
    </AbsoluteFill>
  )
}
