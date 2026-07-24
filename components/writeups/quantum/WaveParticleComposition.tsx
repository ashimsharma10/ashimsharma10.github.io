'use client'

import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion'
import { palette } from './shared'
import {
  WAVE_HEIGHT,
  WAVE_SCENE_DUALITY,
  WAVE_SCENE_PHOTONS,
  WAVE_SCENE_RIPPLES,
  WAVE_WIDTH,
} from './waveConstants'

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

/** Scene 1: light as ripples — two openings, overlapping rings, stripes on the wall. */
function RipplesScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const slitX = 250
  const slitYs = [130, 220]
  const rings = [0, 1, 2, 3]
  const stripesIn = interpolate(frame, [45, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  // Bright interference bands on the wall (cos^2 spacing around the center).
  const bands = [55, 105, 155, 205, 255].map((y, i) => ({ y, strong: i % 2 === 0 }))
  return (
    // No fade-in: frame 0 is the poster.
    <AbsoluteFill>
      <svg width={WAVE_WIDTH} height={WAVE_HEIGHT}>
        <defs>
          <clipPath id="wp-left">
            <rect x={0} y={0} width={slitX} height={WAVE_HEIGHT} />
          </clipPath>
          <clipPath id="wp-right">
            <rect x={slitX} y={0} width={WAVE_WIDTH - slitX} height={WAVE_HEIGHT} />
          </clipPath>
        </defs>
        {/* source rings, left of the barrier */}
        <g clipPath="url(#wp-left)">
          <circle cx={70} cy={175} r={7} fill={p.secondary} />
          {rings.map((k) => {
            const radius = ((frame * 2.4 + k * 46) % 190) + 6
            const op = 1 - radius / 200
            return (
              <circle
                key={k}
                cx={70}
                cy={175}
                r={radius}
                fill="none"
                stroke={p.accent}
                strokeWidth={2.5}
                opacity={Math.max(0, op)}
              />
            )
          })}
        </g>
        {/* barrier with two slits */}
        <rect x={slitX - 4} y={0} width={8} height={110} fill={p.border} />
        <rect x={slitX - 4} y={150} width={8} height={50} fill={p.border} />
        <rect x={slitX - 4} y={240} width={8} height={WAVE_HEIGHT - 240} fill={p.border} />
        {/* rings re-emerging from each slit */}
        <g clipPath="url(#wp-right)">
          {slitYs.map((sy) =>
            rings.map((k) => {
              const radius = ((frame * 2.4 + k * 46) % 190) + 6
              const op = 0.8 - radius / 220
              return (
                <circle
                  key={`${sy}-${k}`}
                  cx={slitX}
                  cy={sy}
                  r={radius}
                  fill="none"
                  stroke={p.accent}
                  strokeWidth={2}
                  opacity={Math.max(0, op)}
                />
              )
            })
          )}
        </g>
        {/* wall with interference bands */}
        <line x1={560} y1={30} x2={560} y2={290} stroke={p.border} strokeWidth={3} />
        {bands.map((b) => (
          <rect
            key={b.y}
            x={566}
            y={b.y}
            width={16}
            height={34}
            rx={3}
            fill={p.accent}
            opacity={stripesIn * (b.strong ? 0.95 : 0.3)}
          />
        ))}
      </svg>
      <Caption
        text="Light spreads like ripples. Two openings make two sets of ripples: where they meet crest-on-crest the wall glows, crest-on-trough stays dark. Stripes."
        color={p.text}
        fadeAt={-10}
      />
    </AbsoluteFill>
  )
}

/** Scene 2: light as packets — violet photons eject electrons, red ones never do. */
function PhotonsScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
  const plateX = 440
  const violetPhase = frame < 85
  // One photon launched every 22 frames, 26 frames of travel.
  const photons = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const born = i * 22
    const life = frame - born
    if (life < 0 || life > 60) return null
    const violet = born < 85
    const lane = 110 + (i % 3) * 55
    if (life <= 26) {
      return { x: 40 + (plateX - 60 - 40) * (life / 26), y: lane, violet, hit: false, life }
    }
    return { x: plateX - 60 + 20, y: lane, violet, hit: true, life }
  })
  const freed = [0, 1, 2, 3].filter((i) => frame >= i * 22 + 26).length
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={WAVE_WIDTH} height={WAVE_HEIGHT}>
        <rect
          x={plateX}
          y={70}
          width={34}
          height={220}
          rx={5}
          fill={p.panel}
          stroke={p.border}
          strokeWidth={2}
        />
        <text
          x={plateX + 17}
          y={58}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={13}
          fontWeight={700}
          fill={p.muted}
        >
          metal
        </text>
        {photons.map(
          (ph, i) =>
            ph && (
              <g key={i}>
                {!ph.hit && (
                  <g>
                    <circle
                      cx={ph.x}
                      cy={ph.y}
                      r={ph.violet ? 6 : 8}
                      fill={ph.violet ? p.accent : p.secondary}
                    />
                    <path
                      d={`M ${ph.x - 22} ${ph.y} q 5 -7 11 0 t 11 0`}
                      fill="none"
                      stroke={ph.violet ? p.accent : p.secondary}
                      strokeWidth={2}
                      opacity={0.7}
                    />
                  </g>
                )}
                {ph.hit && ph.violet && (
                  <circle
                    cx={plateX + 17 + (ph.life - 26) * 4}
                    cy={ph.y - 30 - (ph.life - 26) * 3}
                    r={5}
                    fill={p.good}
                    opacity={Math.max(0, 1 - (ph.life - 26) / 30)}
                  />
                )}
                {ph.hit && !ph.violet && ph.life < 34 && (
                  <circle
                    cx={plateX - 8}
                    cy={ph.y}
                    r={4 + (ph.life - 26)}
                    fill="none"
                    stroke={p.secondary}
                    strokeWidth={1.5}
                    opacity={Math.max(0, 0.8 - (ph.life - 26) / 8)}
                  />
                )}
              </g>
            )
        )}
        <text
          x={40}
          y={52}
          fontFamily={FONT}
          fontSize={14}
          fontWeight={700}
          fill={violetPhase ? p.accent : p.secondary}
        >
          {violetPhase ? 'violet photons: high energy each' : 'red photons: low energy each'}
        </text>
        <text
          x={plateX + 60}
          y={100}
          fontFamily={FONT}
          fontSize={13}
          fontWeight={600}
          fill={p.good}
        >
          {`electrons freed: ${freed}`}
        </text>
      </svg>
      <Caption
        text={
          violetPhase
            ? 'But energy arrives in whole packets: photons. Each violet packet has enough punch to knock one electron out.'
            : 'Each red packet carries too little punch, and punches do not pool. A million of them: still nothing. This is why UV sunburns you and red light never will.'
        }
        color={p.text}
        fadeAt={violetPhase ? 6 : 87}
      />
    </AbsoluteFill>
  )
}

/** Scene 3: the deal nature actually runs on — travel as a wave, land as a dot. */
function DualityScene({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  const frame = useCurrentFrame()
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
  const CYCLE = 34
  const landYs = [150, 215, 118, 250]
  const cycle = Math.min(3, Math.floor(frame / CYCLE))
  const tIn = frame - cycle * CYCLE
  const landed = landYs.slice(0, cycle + (tIn >= 28 ? 1 : 0))
  const rings = [0, 1, 2]
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={WAVE_WIDTH} height={WAVE_HEIGHT}>
        <circle cx={80} cy={180} r={7} fill={p.secondary} />
        {tIn < 28 &&
          rings.map((k) => {
            const radius = (tIn / 28) * 470 - k * 55
            if (radius <= 0) return null
            return (
              <circle
                key={k}
                cx={80}
                cy={180}
                r={radius}
                fill="none"
                stroke={p.accent}
                strokeWidth={2.5}
                opacity={Math.max(0, 0.9 - radius / 520)}
              />
            )
          })}
        <line x1={556} y1={40} x2={556} y2={320} stroke={p.border} strokeWidth={3} />
        {landed.map((y, i) => {
          const isNew = i === landed.length - 1 && tIn >= 28 && tIn < 34
          return <circle key={i} cx={556} cy={y} r={isNew ? 8 : 5} fill={p.accent} />
        })}
      </svg>
      <Caption
        text="The deal nature actually runs on: travel as a wave, everywhere at once. Land as a particle, one dot at a time. Both halves are true. That is wave-particle duality."
        color={p.text}
        fadeAt={10}
      />
    </AbsoluteFill>
  )
}

export default function WaveParticleComposition({ isDark }: { isDark: boolean }) {
  const p = palette(isDark)
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <Sequence from={0} durationInFrames={WAVE_SCENE_RIPPLES}>
        <RipplesScene isDark={isDark} />
      </Sequence>
      <Sequence from={WAVE_SCENE_RIPPLES} durationInFrames={WAVE_SCENE_PHOTONS}>
        <PhotonsScene isDark={isDark} />
      </Sequence>
      <Sequence
        from={WAVE_SCENE_RIPPLES + WAVE_SCENE_PHOTONS}
        durationInFrames={WAVE_SCENE_DUALITY}
      >
        <DualityScene isDark={isDark} />
      </Sequence>
    </AbsoluteFill>
  )
}
