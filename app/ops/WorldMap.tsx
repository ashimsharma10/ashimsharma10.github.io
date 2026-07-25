'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, Geometry } from 'geojson'
import topo from 'world-atlas/countries-110m.json'
import iso from './iso-countries.json'

const { numericToA2, a2ToName } = iso as {
  numericToA2: Record<string, string>
  a2ToName: Record<string, string>
}

export type CountryCount = { country: string; count: number }

// Build the country outlines once at module load — the geometry never changes,
// only the data coloring it does. Natural Earth projection fitted to a fixed
// viewBox that the SVG then scales responsively.
const W = 820
const H = 420
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fc = feature(topo as any, (topo as any).objects.countries) as unknown as {
  features: Feature<Geometry>[]
}
const projection = geoNaturalEarth1().fitSize([W, H], fc as never)
const pathGen = geoPath(projection)
// world-atlas ids are ISO-numeric strings, sometimes zero-padded ("076"); the
// generated map is keyed by unpadded numbers, so normalise before the lookup.
const SHAPES = fc.features.map((f) => ({
  a2: numericToA2[String(parseInt(String(f.id), 10))],
  d: pathGen(f) || '',
}))

/** Track next-themes' `dark` class on <html> so SVG fills match the theme. */
function useIsDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const update = () => setDark(el.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

/**
 * Choropleth of `data` (ISO alpha-2 → count). Countries with traffic are shaded
 * emerald by intensity; the rest are a muted base. Hovering shows country + count.
 * `label` names the metric in the tooltip ("visits" / "invocations").
 */
export default function WorldMap({ data, label }: { data: CountryCount[]; label: string }) {
  const dark = useIsDark()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ x: number; y: number; name: string; count: number } | null>(
    null
  )

  const byA2 = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of data) if (r.country && r.country !== 'XX') m.set(r.country, r.count)
    return m
  }, [data])
  const max = useMemo(
    () => Math.max(1, ...data.filter((d) => d.country !== 'XX').map((d) => d.count)),
    [data]
  )
  const unknown = data.find((d) => d.country === 'XX')?.count ?? 0
  const totalCountries = byA2.size

  const base = dark ? '#1f2937' : '#e5e7eb'
  const stroke = dark ? '#0b1220' : '#ffffff'
  const accent = dark ? '#34D399' : '#047857'

  const onMove = (e: React.MouseEvent, a2?: string) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    setHover({
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
      name: (a2 && a2ToName[a2]) || 'Unknown',
      count: (a2 && byA2.get(a2)) || 0,
    })
  }

  return (
    <div>
      <div ref={wrapRef} className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          onMouseLeave={() => setHover(null)}
        >
          {SHAPES.map((s, i) => {
            const count = s.a2 ? byA2.get(s.a2) : undefined
            const intensity = count ? 0.3 + 0.7 * (count / max) : 0
            return (
              <path
                key={i}
                d={s.d}
                fill={count ? accent : base}
                fillOpacity={count ? intensity : 1}
                stroke={stroke}
                strokeWidth={0.4}
                onMouseMove={(e) => onMove(e, s.a2)}
              />
            )
          })}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            <span className="font-semibold">{hover.name}</span> · {hover.count.toLocaleString()}{' '}
            {label}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {totalCountries} {totalCountries === 1 ? 'country' : 'countries'} · darker = more {label}
        {unknown > 0 && ` · ${unknown.toLocaleString()} from an unknown location`}
      </p>
    </div>
  )
}
