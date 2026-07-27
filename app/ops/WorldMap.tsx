'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, Geometry } from 'geojson'
import worldTopo from 'world-atlas/countries-110m.json'
import usTopo from 'us-atlas/states-10m.json'
import iso from './iso-countries.json'

const { numericToA2, a2ToName } = iso as {
  numericToA2: Record<string, string>
  a2ToName: Record<string, string>
}

export type CountryCount = { country: string; count: number }
export type GeoPoint = { city: string; country: string; lat: number; lon: number; count: number }

// Build both base maps once at module load. World = Natural Earth for the global
// choropleth; US = Albers USA (with Alaska/Hawaii insets) for the zoomed view.
const W = 820
const H = 430
/* eslint-disable @typescript-eslint/no-explicit-any */
const worldFc = feature(worldTopo as any, (worldTopo as any).objects.countries) as unknown as {
  features: Feature<Geometry>[]
}
const usFc = feature(usTopo as any, (usTopo as any).objects.states) as unknown as {
  features: Feature<Geometry>[]
}
/* eslint-enable @typescript-eslint/no-explicit-any */
const worldProjection = geoNaturalEarth1().fitSize([W, H], worldFc as never)
const usProjection = geoAlbersUsa().fitSize([W, H], usFc as never)
const worldPath = geoPath(worldProjection)
const usPath = geoPath(usProjection)
// world-atlas ids are ISO-numeric strings, sometimes zero-padded ("076"); the
// generated code map is keyed by unpadded numbers, so normalise before lookup.
const WORLD_SHAPES = worldFc.features.map((f) => ({
  a2: numericToA2[String(parseInt(String(f.id), 10))],
  d: worldPath(f) || '',
}))
const US_SHAPES = usFc.features.map((f, i) => ({ key: i, d: usPath(f) || '' }))

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

type Hover = { x: number; y: number; title: string; count: number } | null

/**
 * "Where from" map with a World/US toggle. World mode shades countries by
 * `countries` (choropleth) and overlays city dots; US mode zooms to Albers USA
 * with the same dots. Dots come from `points` (approximate, city-level, IP-derived
 * — never exact). `label` names the metric in tooltips ("visits"/"invocations").
 */
export default function WorldMap({
  countries,
  points,
  label,
}: {
  countries: CountryCount[]
  points: GeoPoint[]
  label: string
}) {
  const dark = useIsDark()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'world' | 'us'>('us')
  const [hover, setHover] = useState<Hover>(null)

  const byA2 = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of countries) if (r.country && r.country !== 'XX') m.set(r.country, r.count)
    return m
  }, [countries])
  const maxCountry = useMemo(
    () => Math.max(1, ...countries.filter((d) => d.country !== 'XX').map((d) => d.count)),
    [countries]
  )

  // Project the city points with the active projection. In US mode we restrict to
  // US points (Albers USA can still place border-adjacent foreign cities, so filter
  // by country rather than rely on the projection returning null).
  const dots = useMemo(() => {
    const project = mode === 'world' ? worldProjection : usProjection
    const src = mode === 'us' ? points.filter((p) => p.country === 'US') : points
    return src
      .map((p) => {
        const xy = project([p.lon, p.lat])
        return xy ? { x: xy[0], y: xy[1], city: p.city, count: p.count } : null
      })
      .filter((d): d is { x: number; y: number; city: string; count: number } => d !== null)
  }, [points, mode])
  const maxDot = useMemo(() => Math.max(1, ...dots.map((d) => d.count)), [dots])
  const dotR = (count: number) => 2.5 + Math.sqrt(count / maxDot) * 7

  const base = dark ? '#1f2937' : '#e5e7eb'
  const stroke = dark ? '#0b1220' : '#ffffff'
  const accent = dark ? '#34D399' : '#047857'

  const at = (e: React.MouseEvent, title: string, count: number) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    setHover({ x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0), title, count })
  }

  const cityCount = new Set(dots.map((d) => d.city)).size
  const totalCountries = byA2.size

  return (
    <div>
      <div className="mb-2 flex items-center justify-end">
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 text-xs font-medium dark:border-gray-700">
          {(['world', 'us'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 ${
                mode === m
                  ? 'bg-[#047857] text-white dark:bg-[#34D399] dark:text-gray-900'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {m === 'world' ? 'World' : 'US'}
            </button>
          ))}
        </div>
      </div>
      <div ref={wrapRef} className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          onMouseLeave={() => setHover(null)}
        >
          {mode === 'world'
            ? WORLD_SHAPES.map((s, i) => {
                const count = s.a2 ? byA2.get(s.a2) : undefined
                const intensity = count ? 0.3 + 0.7 * (count / maxCountry) : 0
                return (
                  <path
                    key={i}
                    d={s.d}
                    fill={count ? accent : base}
                    fillOpacity={count ? intensity : 1}
                    stroke={stroke}
                    strokeWidth={0.4}
                    onMouseMove={(e) =>
                      at(e, (s.a2 && a2ToName[s.a2]) || 'Unknown', (s.a2 && byA2.get(s.a2)) || 0)
                    }
                  />
                )
              })
            : US_SHAPES.map((s) => (
                <path key={s.key} d={s.d} fill={base} stroke={stroke} strokeWidth={0.5} />
              ))}

          {dots.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={dotR(d.count)}
              fill={accent}
              fillOpacity={0.75}
              stroke={stroke}
              strokeWidth={0.6}
              onMouseMove={(e) => {
                e.stopPropagation()
                at(e, d.city, d.count)
              }}
            />
          ))}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            <span className="font-semibold">{hover.title}</span> · {hover.count.toLocaleString()}{' '}
            {label}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {mode === 'world' &&
          `${totalCountries} ${totalCountries === 1 ? 'country' : 'countries'} · `}
        {cityCount} {cityCount === 1 ? 'city' : 'cities'} · dots are approximate (city-level)
      </p>
    </div>
  )
}
