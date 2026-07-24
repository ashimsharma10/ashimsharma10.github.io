'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import type { PlayerRef } from '@remotion/player'
import { DemoFrame, palette, useIsDark } from './shared'
import { WAVE_DURATION, WAVE_FPS, WAVE_HEIGHT, WAVE_WIDTH } from './waveConstants'

type WaveProps = { isDark: boolean }

interface Loaded {
  Player: (typeof import('@remotion/player'))['Player']
  Composition: ComponentType<WaveProps>
}

export default function WaveParticleAnimation() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const playerRef = useRef<PlayerRef>(null)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    let cancelled = false
    Promise.all([import('@remotion/player'), import('./WaveParticleComposition')]).then(
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

  // autoPlay is a one-shot attempt; if the tab was hidden at mount it never
  // engages. Retry when the page becomes visible, until playback first starts.
  useEffect(() => {
    if (!loaded || reducedMotion) return
    const tryPlay = () => {
      const player = playerRef.current
      if (!player) return
      if (player.isPlaying()) {
        document.removeEventListener('visibilitychange', tryPlay)
        return
      }
      if (document.visibilityState === 'visible') player.play()
    }
    const timer = setTimeout(tryPlay, 300)
    document.addEventListener('visibilitychange', tryPlay)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', tryPlay)
    }
  }, [loaded, reducedMotion])

  return (
    <DemoFrame
      title="Light: wave or particle? Yes."
      isDark={isDark}
      caption="Three experiments in one loop: ripples that overlap into stripes, energy packets that either free an electron or never will, and the compromise nature actually runs on. Scrub the timeline to compare."
    >
      {loaded ? (
        <loaded.Player
          ref={playerRef}
          component={loaded.Composition}
          inputProps={{ isDark }}
          durationInFrames={WAVE_DURATION}
          fps={WAVE_FPS}
          compositionWidth={WAVE_WIDTH}
          compositionHeight={WAVE_HEIGHT}
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
            aspectRatio: `${WAVE_WIDTH} / ${WAVE_HEIGHT}`,
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
