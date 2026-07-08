'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import 'katex/dist/katex.css'
import renderMathInElement from 'katex/contrib/auto-render'
import { initRiemann } from './riemann-engine'
import { css, prose } from './riemann-content'

// Native React version of the interactive Riemann write-up.
// - Prose is server-rendered (good for search, no blank flash).
// - The CSS is confined to `.riemann-root` via @scope, so it can't leak into
//   the rest of the site.
// - The canvas/plot engine (necessarily imperative) runs once on mount, then
//   KaTeX typesets the math in place.
export default function RiemannZeta() {
  const proseRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const root = proseRef.current
    if (!root) return
    let cancelled = false

    const run = () => {
      if (cancelled) return
      try {
        initRiemann(root, resolvedTheme === 'dark')
      } catch (e) {
        console.error('initRiemann failed:', e)
      }
      renderMathInElement(root, {
        delimiters: [
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
      })
    }
    run()

    // Belt-and-suspenders: a pre-existing, unrelated hydration mismatch
    // elsewhere on the page (a headlessui portal in the mobile nav) makes
    // React redo hydration differently depending on the starting theme,
    // which can race with the cleanup below and leave the figures empty
    // on a cold load that starts in dark mode. If that happens, one retry
    // after paint reliably fixes it; harmless no-op otherwise.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return
      const emptyFigure = root.querySelector('figure.fig:empty')
      if (emptyFigure) run()
    })

    // React 18 StrictMode (dev only) runs this effect twice on the same DOM
    // node to surface missing-cleanup bugs. initRiemann() builds each figure
    // by appending a fresh plot into it, so without this it'd append twice
    // and every graph would render doubled. Emptying each figure back to its
    // pre-init state makes a second run (StrictMode's, a real remount, or a
    // theme toggle re-run below) rebuild cleanly instead of stacking on top
    // of the first.
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      root.querySelectorAll('figure.fig').forEach((fig) => {
        fig.innerHTML = ''
      })
    }
  }, [resolvedTheme])

  return (
    <div className="riemann-root not-prose">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div ref={proseRef} dangerouslySetInnerHTML={{ __html: prose }} />
    </div>
  )
}
