'use client'

import { useEffect, useRef, useState } from 'react'
import { SKETCHES } from './sketches.generated'

// Figure rendered ahead of time from an Excalidraw-style element list by
// scripts/render-sketches.mjs. Strokes use currentColor so the same SVG works in both
// themes; the pastel fills are semi-transparent tints for the same reason.
// Clicking the figure opens it enlarged in a pop-up; Escape, a click outside, or the
// close button dismisses it.
export default function Sketch({ name, alt }: { name: string; alt?: string }) {
  const svg = SKETCHES[name]
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.animate(
      [
        { transform: 'scale(0.9)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 200, easing: 'ease-out' }
    )
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!svg) return null
  return (
    <>
      <figure
        className="not-prose my-6 flex justify-center text-gray-900 dark:text-gray-100"
        aria-label={alt}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={alt ? `Enlarge figure: ${alt}` : 'Enlarge figure'}
          title="Click to enlarge"
          className="w-full max-w-[720px] cursor-zoom-in rounded-lg transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </figure>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt ?? 'Enlarged figure'}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[1100px] rounded-2xl bg-white p-6 text-gray-900 shadow-2xl dark:bg-gray-900 dark:text-gray-100"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full px-2 text-2xl leading-none text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              &times;
            </button>
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
        </div>
      )}
    </>
  )
}
