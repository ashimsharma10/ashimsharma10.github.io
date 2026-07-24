'use client'

import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { palette } from './shared'
import {
  ENT_HEIGHT,
  ENT_SCENE_CATCH,
  ENT_SCENE_MEASURE,
  ENT_SCENE_PAIR,
  ENT_WIDTH,
} from './entanglementConstants'

const FONT = 'system-ui, sans-serif'
const MID_Y = 150

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
        bottom: 14,
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

function Orb({
  x,
  y,
  face,
  color,
  border,
  soft,
  text,
}: {
  x: number
  y: number
  face: string
  color: string
  border: string
  soft: string
  text: string
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={26} fill={soft} stroke={border} strokeWidth={2.5} />
      <text
        x={x}
        y={y + 9}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={26}
        fontWeight={800}
        fill={face === '?' ? text : color}
      >
        {face}
      </text>
    </g>
  )
}

/** Scene 1: one event makes a linked pair; the two halves fly apart. */
function PairScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const spread = interpolate(frame, [30, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const aliceX = 320 - 200 * spread
  const bobX = 320 + 200 * spread
  const burst = interpolate(frame, [0, 26], [0, 1], { extrapolateRight: 'clamp' })
  const labelOp = interpolate(frame, [95, 115], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    // No fade-in: frame 0 is the poster.
    <AbsoluteFill>
      <svg width={ENT_WIDTH} height={ENT_HEIGHT}>
        {/* birth burst */}
        {burst < 1 && (
          <circle
            cx={320}
            cy={MID_Y}
            r={10 + burst * 60}
            fill="none"
            stroke={p.secondary}
            strokeWidth={2.5}
            opacity={1 - burst}
          />
        )}
        {/* link between the two halves */}
        <line
          x1={aliceX}
          y1={MID_Y}
          x2={bobX}
          y2={MID_Y}
          stroke={p.accent}
          strokeWidth={2}
          strokeDasharray="5 7"
          opacity={0.6}
        />
        <Orb
          x={aliceX}
          y={MID_Y}
          face="?"
          color={p.accent}
          border={p.accent}
          soft={p.accentSoft}
          text={p.text}
        />
        <Orb
          x={bobX}
          y={MID_Y}
          face="?"
          color={p.accent}
          border={p.accent}
          soft={p.accentSoft}
          text={p.text}
        />
        <text
          x={aliceX}
          y={MID_Y + 52}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={13}
          fontWeight={700}
          fill={p.text}
          opacity={labelOp}
        >
          Alice · Earth
        </text>
        <text
          x={bobX}
          y={MID_Y + 52}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={13}
          fontWeight={700}
          fill={p.text}
          opacity={labelOp}
        >
          Bob · far away
        </text>
      </svg>
      <Caption
        text="One event makes two linked particles and sends them far apart. Neither has chosen up or down yet."
        color={p.text}
        fadeAt={-10}
      />
    </AbsoluteFill>
  )
}

/** Scene 2: Alice looks, gets a random result, and Bob's is fixed to match. */
function MeasureScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
  const aliceX = 120
  const bobX = 520
  const aliceLooked = frame >= 18
  const bobFixed = frame >= 26
  const aliceFace = aliceLooked ? '↑' : '?'
  const bobFace = bobFixed ? '↑' : '?'
  const flash = (at: number) =>
    interpolate(frame, [at, at + 10], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={ENT_WIDTH} height={ENT_HEIGHT}>
        <line
          x1={aliceX}
          y1={MID_Y}
          x2={bobX}
          y2={MID_Y}
          stroke={bobFixed ? p.good : p.accent}
          strokeWidth={2}
          strokeDasharray="5 7"
          opacity={bobFixed ? 0.4 : 0.6}
        />
        {aliceLooked && flash(18) > 0 && (
          <circle
            cx={aliceX}
            cy={MID_Y}
            r={26 + (1 - flash(18)) * 34}
            fill="none"
            stroke={p.secondary}
            strokeWidth={2}
            opacity={flash(18)}
          />
        )}
        {bobFixed && flash(26) > 0 && (
          <circle
            cx={bobX}
            cy={MID_Y}
            r={26 + (1 - flash(26)) * 34}
            fill="none"
            stroke={p.good}
            strokeWidth={2}
            opacity={flash(26)}
          />
        )}
        <Orb
          x={aliceX}
          y={MID_Y}
          face={aliceFace}
          color={p.accent}
          border={aliceLooked ? p.accent : p.border}
          soft={p.accentSoft}
          text={p.text}
        />
        <Orb
          x={bobX}
          y={MID_Y}
          face={bobFace}
          color={p.good}
          border={bobFixed ? p.good : p.border}
          soft={p.accentSoft}
          text={p.text}
        />
        <text
          x={aliceX}
          y={MID_Y + 52}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={13}
          fontWeight={700}
          fill={p.text}
        >
          Alice · Earth
        </text>
        <text
          x={bobX}
          y={MID_Y + 52}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={13}
          fontWeight={700}
          fill={p.text}
        >
          Bob · far away
        </text>
      </svg>
      <Caption
        text="Alice looks. Her result is random: up. The same instant, Bob's is fixed to match: up, no matter how far away he is."
        color={p.text}
        fadeAt={30}
      />
    </AbsoluteFill>
  )
}

/** Scene 3: the catch — random alone, matching only when they compare notes. */
function CatchScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
  const rounds = ['↑', '↓', '↑']
  const rowOpacity = (i: number) =>
    interpolate(frame, [8 + i * 20, 22 + i * 20], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  const col = (label: string, x: number) => (
    <>
      <text
        x={x}
        y={44}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={14}
        fontWeight={800}
        fill={p.text}
      >
        {label}
      </text>
      {rounds.map((face, i) => (
        <text
          key={i}
          x={x}
          y={92 + i * 44}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={26}
          fontWeight={800}
          fill={p.accent}
          opacity={rowOpacity(i)}
        >
          {face}
        </text>
      ))}
    </>
  )
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={ENT_WIDTH} height={ENT_HEIGHT}>
        {col('Alice', 190)}
        {col('Bob', 450)}
        {rounds.map((_, i) => (
          <text
            key={i}
            x={320}
            y={98 + i * 44}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill={p.good}
            opacity={rowOpacity(i)}
          >
            match
          </text>
        ))}
      </svg>
      <Caption
        text="Alone, each result is a coin toss. They only discover they always matched by comparing notes later, at ordinary speed. No message is ever sent faster than light."
        color={p.text}
        fadeAt={70}
      />
    </AbsoluteFill>
  )
}

export default function EntanglementComposition({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <Sequence from={0} durationInFrames={ENT_SCENE_PAIR}>
        <PairScene isDark={isDark} />
      </Sequence>
      <Sequence from={ENT_SCENE_PAIR} durationInFrames={ENT_SCENE_MEASURE}>
        <MeasureScene isDark={isDark} />
      </Sequence>
      <Sequence from={ENT_SCENE_PAIR + ENT_SCENE_MEASURE} durationInFrames={ENT_SCENE_CATCH}>
        <CatchScene isDark={isDark} />
      </Sequence>
    </AbsoluteFill>
  )
}
