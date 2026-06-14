'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

interface MermaidChartProps {
  chart: string
}

export default function MermaidChart({ chart }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false

    const render = async () => {
      const mermaid = (await import('mermaid')).default
      if (cancelled) return

      const isDark = resolvedTheme === 'dark'
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence: { useMaxWidth: true },
      })

      let processed = chart
      if (isDark) {
        processed = processed
          .split('\n')
          .filter((line) => {
            const trimmed = line.trimStart()
            return !trimmed.startsWith('classDef ') && !trimmed.startsWith('style ')
          })
          .join('\n')
      }

      el.textContent = processed
      el.removeAttribute('data-processed')
      await mermaid.run({ nodes: [el] })
    }

    render().catch(() => {
      // Strict Mode runs effects twice; second run on an already-processed
      // element throws internally — safe to ignore since the first rendered fine.
    })

    return () => {
      cancelled = true
    }
  }, [chart, resolvedTheme])

  return (
    <div
      ref={containerRef}
      className="mermaid my-6 flex justify-center overflow-x-auto"
    />
  )
}
