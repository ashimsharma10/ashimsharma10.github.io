import { SKETCHES } from './sketches.generated'

// Hand-drawn figure, rendered ahead of time from an Excalidraw-style element list by
// scripts/render-sketches.mjs. Strokes use currentColor so the same SVG works in both
// themes; the pastel fills are semi-transparent tints for the same reason.
export default function Sketch({ name, alt }: { name: string; alt?: string }) {
  const svg = SKETCHES[name]
  if (!svg) return null
  return (
    <figure
      className="not-prose my-6 flex justify-center text-gray-900 dark:text-gray-100"
      aria-label={alt}
    >
      <div style={{ width: '100%', maxWidth: '720px' }} dangerouslySetInnerHTML={{ __html: svg }} />
    </figure>
  )
}
