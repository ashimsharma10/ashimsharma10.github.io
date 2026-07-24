'use client'

import { AbsoluteFill, Sequence, interpolate, random, useCurrentFrame } from 'remotion'
import { palette } from './shared'
import {
  SPIN_HEIGHT,
  SPIN_SCENE_1 as SCENE_1,
  SPIN_SCENE_2 as SCENE_2,
  SPIN_SCENE_3 as SCENE_3,
  SPIN_WIDTH,
} from './spinConstants'

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
        bottom: 18,
        left: 24,
        right: 24,
        textAlign: 'center',
        fontFamily: FONT,
        fontSize: 16,
        fontWeight: 600,
        color,
        opacity,
      }}
    >
      {text}
    </div>
  )
}

/** Scene 1: the myth — a tiny ball, visibly rotating, then struck out. */
function MythScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const angle = frame * 6
  const orbitX = 320 + 46 * Math.cos((angle * Math.PI) / 180)
  const orbitY = 158 + 46 * Math.sin((angle * Math.PI) / 180)
  const xScale = interpolate(frame, [66, 78], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    // No fade-in: frame 0 doubles as the poster image when the player is paused.
    <AbsoluteFill>
      <svg width={SPIN_WIDTH} height={SPIN_HEIGHT}>
        <circle cx={320} cy={158} r={64} fill={p.accentSoft} stroke={p.accent} strokeWidth={2.5} />
        <circle cx={298} cy={136} r={18} fill={isDark ? '#334155' : '#ffffff'} opacity={0.55} />
        <circle cx={orbitX} cy={orbitY} r={7} fill={p.accent} />
        <path
          d="M 320 66 A 92 92 0 0 1 412 158"
          fill="none"
          stroke={p.muted}
          strokeWidth={3}
          strokeDasharray="6 7"
        />
        <path d="M 412 158 l -10 -14 l 14 -2 z" fill={p.muted} />
        <g
          style={{ opacity: xScale, transformOrigin: '320px 158px', transform: `scale(${xScale})` }}
        >
          <line
            x1={244}
            y1={82}
            x2={396}
            y2={234}
            stroke={p.secondary}
            strokeWidth={9}
            strokeLinecap="round"
          />
          <line
            x1={396}
            y1={82}
            x2={244}
            y2={234}
            stroke={p.secondary}
            strokeWidth={9}
            strokeLinecap="round"
          />
        </g>
      </svg>
      {frame < 66 ? (
        <Caption
          text="The picture in your head: a tiny ball, spinning."
          color={p.text}
          fadeAt={-10}
        />
      ) : (
        <Caption
          text="Wrong. Nothing is rotating. An electron has no surface to turn."
          color={p.secondary}
          fadeAt={68}
        />
      )}
    </AbsoluteFill>
  )
}

/** Scene 2: Stern-Gerlach — particles through a magnet, only two exits. */
function TwoAnswersScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
  const N = 10
  const particles = Array.from({ length: N }, (_, i) => {
    const life = frame - i * 10
    if (life < 0) return null
    const up = random(`sg-up-${i}`) < 0.5
    const jx = (random(`sg-jx-${i}`) - 0.5) * 14
    const jy = (random(`sg-jy-${i}`) - 0.5) * 22
    const targetY = up ? 96 : 250
    if (life <= 24) {
      const x = interpolate(life, [0, 24], [36, 300])
      return { x, y: 173, settled: false }
    }
    if (life <= 48) {
      const t = interpolate(life, [24, 48], [0, 1], { extrapolateRight: 'clamp' })
      const x = 300 + (556 - 300) * t
      const y = 173 + (targetY - 173) * t * t
      return { x, y, settled: false }
    }
    return { x: 556 + jx, y: targetY + jy, settled: true }
  })
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={SPIN_WIDTH} height={SPIN_HEIGHT}>
        <polygon
          points="270,96 330,96 300,140"
          fill={p.secondarySoft}
          stroke={p.secondary}
          strokeWidth={2}
        />
        <polygon
          points="270,250 330,250 300,206"
          fill={p.accentSoft}
          stroke={p.accent}
          strokeWidth={2}
        />
        <text
          x={300}
          y={88}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={13}
          fontWeight={700}
          fill={p.muted}
        >
          magnet
        </text>
        <line x1={584} y1={56} x2={584} y2={290} stroke={p.border} strokeWidth={3} />
        <text
          x={604}
          y={100}
          fontFamily={FONT}
          fontSize={13}
          fontWeight={700}
          fill={p.text}
          transform="rotate(90 604 100)"
        >
          up
        </text>
        <text
          x={604}
          y={242}
          fontFamily={FONT}
          fontSize={13}
          fontWeight={700}
          fill={p.text}
          transform="rotate(90 604 242)"
        >
          down
        </text>
        {particles.map(
          (pt, i) =>
            pt && (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={pt.settled ? 5 : 6}
                fill={pt.settled ? p.accent : p.text}
                opacity={pt.settled ? 0.85 : 1}
              />
            )
        )}
      </svg>
      <Caption
        text="Yet measure it, and spin gives exactly two answers: up or down. Never in between."
        color={p.text}
        fadeAt={12}
      />
    </AbsoluteFill>
  )
}

/** Scene 3: the 720° twist — one turn flips the state's sign, two turns restore it. */
function TwoTurnsScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
  const deg = interpolate(frame, [10, 55, 70, 115, 130, 140], [0, 360, 360, 720, 720, 720], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const flipped = deg >= 355 && deg < 715
  const phaseColor = flipped ? p.secondary : p.accent
  const caption =
    deg < 355
      ? 'Rotate the state one full turn…'
      : deg < 715
        ? '360°: it looks identical, but its sign has flipped.'
        : '720°: only after two full turns is it truly itself again.'
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={SPIN_WIDTH} height={SPIN_HEIGHT}>
        <g style={{ transformOrigin: '290px 168px', transform: `rotate(${deg}deg)` }}>
          <rect
            x={245}
            y={113}
            width={90}
            height={110}
            rx={12}
            fill={p.panel}
            stroke={phaseColor}
            strokeWidth={3}
          />
          <rect x={282} y={113} width={16} height={12} fill={phaseColor} />
          <text
            x={290}
            y={182}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={40}
            fontWeight={700}
            fill={p.text}
          >
            ψ
          </text>
        </g>
        <circle cx={460} cy={130} r={26} fill="none" stroke={phaseColor} strokeWidth={3} />
        <text
          x={460}
          y={141}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={30}
          fontWeight={800}
          fill={phaseColor}
        >
          {flipped ? '−' : '+'}
        </text>
        <text
          x={460}
          y={180}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={13}
          fontWeight={600}
          fill={p.muted}
        >
          hidden sign
        </text>
        <text
          x={460}
          y={228}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={15}
          fontWeight={700}
          fill={p.text}
        >
          {Math.round(deg)}°
        </text>
      </svg>
      <Caption text={caption} color={deg >= 355 && deg < 715 ? p.secondary : p.text} fadeAt={4} />
    </AbsoluteFill>
  )
}

export default function SpinComposition({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <Sequence from={0} durationInFrames={SCENE_1}>
        <MythScene isDark={isDark} />
      </Sequence>
      <Sequence from={SCENE_1} durationInFrames={SCENE_2}>
        <TwoAnswersScene isDark={isDark} />
      </Sequence>
      <Sequence from={SCENE_1 + SCENE_2} durationInFrames={SCENE_3}>
        <TwoTurnsScene isDark={isDark} />
      </Sequence>
    </AbsoluteFill>
  )
}
