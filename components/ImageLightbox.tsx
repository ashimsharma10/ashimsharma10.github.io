'use client'

import { useEffect, useState } from 'react'

/**
 * Click/tap any content image inside an <article> to open it in a full-screen,
 * zoomed overlay (Medium-style). Click anywhere or press Esc to close.
 * Attaches via event delegation so it works for raw <img> tags in MDX too.
 */
export default function ImageLightbox() {
  const [src, setSrc] = useState<string | null>(null)
  const [alt, setAlt] = useState('')

  // Open on click of a reasonably-sized article image (skip tiny inline icons).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (
        t instanceof HTMLImageElement &&
        t.closest('article') &&
        !t.closest('a') &&
        (t.clientWidth || 0) >= 100
      ) {
        setSrc(t.currentSrc || t.src)
        setAlt(t.alt || '')
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Hint that content images are zoomable.
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll('article img').forEach((im) => {
        const el = im as HTMLElement
        if ((el.clientWidth || 0) >= 100) el.style.cursor = 'zoom-in'
      })
    }
    apply()
    // Re-apply after images finish loading in case they weren't sized on first run.
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
    if (!src) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSrc(null)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [src])

  if (!src) return null

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      onClick={() => setSrc(null)}
      className="fixed inset-0 z-[9999] flex cursor-zoom-out items-center justify-center bg-white p-8 dark:bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Zoomed image'}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[78vh] max-w-[78vw] rounded-lg object-contain shadow-md"
      />
    </div>
  )
}
