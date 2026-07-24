'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import type { PlayerRef } from '@remotion/player'
import { DemoFrame, palette, useIsDark } from './shared'

type CompProps = { isDark: boolean }

interface Loaded {
  Player: (typeof import('@remotion/player'))['Player']
  Composition: ComponentType<CompProps>
}

/**
 * Shared chrome for the quantum Remotion demos: lazy-loads the player and
 * composition (keeps remotion out of the page bundle), plays theme-aware, and
 * retries autoplay once the tab is visible (autoPlay is a one-shot that never
 * engages if the page loaded hidden). Pass a module-level `load` so its
 * reference stays stable across renders.
 */
export default function RemotionPlayer({
  title,
  caption,
  load,
  durationInFrames,
  fps,
  width,
  height,
}: {
  title: string
  caption: string
  load: () => Promise<{ default: ComponentType<CompProps> }>
  durationInFrames: number
  fps: number
  width: number
  height: number
}) {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const playerRef = useRef<PlayerRef>(null)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    let cancelled = false
    Promise.all([import('@remotion/player'), load()]).then(([player, composition]) => {
      if (cancelled) return
      setLoaded({ Player: player.Player, Composition: composition.default })
    })
    return () => {
      cancelled = true
    }
  }, [load])

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
    <DemoFrame title={title} caption={caption} isDark={isDark}>
      {loaded ? (
        <loaded.Player
          ref={playerRef}
          component={loaded.Composition}
          inputProps={{ isDark }}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionWidth={width}
          compositionHeight={height}
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
            aspectRatio: `${width} / ${height}`,
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
