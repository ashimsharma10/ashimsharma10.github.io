'use client'

import { useEffect, useState, type ComponentType } from 'react'
import { DemoFrame, palette, useIsDark } from './shared'
import { SPIN_DURATION, SPIN_FPS, SPIN_HEIGHT, SPIN_WIDTH } from './spinConstants'

type SpinProps = { isDark: boolean }

interface Loaded {
  Player: (typeof import('@remotion/player'))['Player']
  Composition: ComponentType<SpinProps>
}

export default function SpinAnimation() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    let cancelled = false
    Promise.all([import('@remotion/player'), import('./SpinComposition')]).then(
      ([player, composition]) => {
        if (cancelled) return
        setLoaded({
          Player: player.Player,
          Composition: composition.default,
        })
      }
    )
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <DemoFrame
      title="Spin: what is actually rotating (nothing)"
      isDark={isDark}
      caption="Spin is an intrinsic label with rotation-like consequences and no rotating parts: measurements return only two values, and the state needs 720° of rotation to come back to itself. Scrub the timeline to compare the three pictures."
    >
      {loaded ? (
        <loaded.Player
          component={loaded.Composition}
          inputProps={{ isDark }}
          durationInFrames={SPIN_DURATION}
          fps={SPIN_FPS}
          compositionWidth={SPIN_WIDTH}
          compositionHeight={SPIN_HEIGHT}
          style={{ width: '100%', borderRadius: 8, border: `1px solid ${p.border}` }}
          autoPlay={!reducedMotion}
          loop
          controls
          clickToPlay
          allowFullscreen={false}
          showVolumeControls={false}
        />
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: `${SPIN_WIDTH} / ${SPIN_HEIGHT}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${p.border}`,
            borderRadius: 8,
            background: p.panel,
            color: p.muted,
            fontSize: 13,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          loading animation…
        </div>
      )}
    </DemoFrame>
  )
}
