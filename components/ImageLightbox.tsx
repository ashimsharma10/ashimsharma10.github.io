'use client'

import { useEffect, useState } from 'react'

type View = { kind: 'img'; src: string; alt: string } | { kind: 'svg'; html: string }

/**
 * Click/tap any content image or diagram inside an <article> to open it in a
 * full-screen, zoomed overlay (Medium-style). Click anywhere or press Esc to
 * close. Attaches via event delegation so it works for raw <img> tags in MDX,
 * small logo marks (inside .logo-row), and inline Mermaid SVG diagrams too.
 */
export default function ImageLightbox() {
  const [view, setView] = useState<View | null>(null)

  // Is this an image we want to make zoomable? Content images (>= 100px) plus
  // the small brand logos that live inside a .logo-row.
  const isZoomableImg = (el: HTMLElement) =>
    (el.clientWidth || 0) >= 100 || !!el.closest('.logo-row')

  // Open on click of an eligible image or a Mermaid diagram.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || !t.closest('article')) return

      // Mermaid diagrams render as inline <svg>; clone and show it as-is so
      // HTML labels and embedded styles keep rendering (unlike an <img> data URL).
      const mermaid = t.closest('.mermaid') as HTMLElement | null
      if (mermaid) {
        const svg = mermaid.querySelector('svg')
        if (svg) {
          const clone = svg.cloneNode(true) as SVGElement
          clone.removeAttribute('width')
          clone.removeAttribute('height')
          // Fill whichever screen dimension is the tighter fit so wide and tall
          // diagrams both scale up without distortion or letterboxing.
          const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number)
          const aspect = vb.length === 4 && vb[3] ? vb[2] / vb[3] : 1
          const vpAspect = (window.innerWidth * 0.9) / (window.innerHeight * 0.85)
          clone.setAttribute(
            'style',
            aspect >= vpAspect
              ? 'width:90vw;height:auto;max-width:90vw;'
              : 'height:85vh;width:auto;max-height:85vh;'
          )
          setView({ kind: 'svg', html: clone.outerHTML })
        }
        return
      }

      if (t instanceof HTMLImageElement && !t.closest('a') && isZoomableImg(t)) {
        setView({ kind: 'img', src: t.currentSrc || t.src, alt: t.alt || '' })
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Hint that content images, logos, and diagrams are zoomable.
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll('article img').forEach((im) => {
        const el = im as HTMLElement
        if (isZoomableImg(el)) el.style.cursor = 'zoom-in'
      })
      document.querySelectorAll('article .mermaid svg').forEach((el) => {
        ;(el as HTMLElement).style.cursor = 'zoom-in'
      })
    }
    apply()
    // Re-apply after images/diagrams finish rendering in case they weren't sized on first run.
    window.addEventListener('load', apply)
    const mo = new MutationObserver(apply)
    const art = document.querySelector('article')
    if (art) mo.observe(art, { childList: true, subtree: true })
    return () => {
      window.removeEventListener('load', apply)
      mo.disconnect()
    }
  }, [])

  // Lock scroll + Esc-to-close while open.
  useEffect(() => {
    if (!view) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView(null)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [view])

  if (!view) return null

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      onClick={() => setView(null)}
      className="fixed inset-0 z-[9999] flex cursor-zoom-out items-center justify-center bg-white p-8 dark:bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={view.kind === 'img' ? view.alt || 'Zoomed image' : 'Zoomed diagram'}
    >
      {view.kind === 'img' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={view.src}
          alt={view.alt}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-md"
        />
      ) : (
        <div
          className="flex max-h-[88vh] max-w-[92vw] items-center justify-center overflow-auto"
          dangerouslySetInnerHTML={{ __html: view.html }}
        />
      )}
    </div>
  )
}
