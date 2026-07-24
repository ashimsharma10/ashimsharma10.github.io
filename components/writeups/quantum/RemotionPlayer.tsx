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
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Autoplay once the player scrolls into view (and the tab is visible). A bare
  // autoPlay never engages if the demo is below the fold or the page loaded
  // hidden, so drive play() from an IntersectionObserver instead.
  useEffect(() => {
    if (!loaded || reducedMotion) return
    const el = containerRef.current
    if (!el) return
    let started = false
    const tryPlay = () => {
      const player = playerRef.current
      if (!player || started) return
      if (
        document.visibilityState === 'visible' &&
        el.getBoundingClientRect().top < window.innerHeight
      ) {
        player.play()
        started = true
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) tryPlay()
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    document.addEventListener('visibilitychange', tryPlay)
    const timer = setTimeout(tryPlay, 300)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', tryPlay)
      clearTimeout(timer)
    }
  }, [loaded, reducedMotion])

  return (
    <DemoFrame title={title} caption={caption} isDark={isDark}>
      <div ref={containerRef}>
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
      </div>
    </DemoFrame>
  )
}
