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
// Raw per-visit row for the last 30 days (from the Worker). Kept on the client
// so the map's date filter (3/7/30d) can re-aggregate without another round-trip
// and dot hovers can show the latest visit time.
export type RawGeoVisit = {
  ts: number
  city: string | null
  country: string
  lat: number | null
  lon: number | null
}

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

type Hover = { x: number; y: number; title: string; count: number; latestTs?: number } | null

const DAY_MS = 86_400_000
const RANGE_OPTIONS = [
  { days: 3, label: '3d' },
  { days: 7, label: '7d' },
] as const
type FilterDays = (typeof RANGE_OPTIONS)[number]['days']

/**
 * "Where from" map with a World/US toggle plus a 3/7-day date filter. World
 * mode shades countries by `countries` (choropleth) and overlays city dots; US
 * mode zooms to Albers USA with the same dots. When `recent` (raw per-visit
 * rows for the last 30 days) is provided, the filter re-aggregates dots and the
 * choropleth client-side, and a table underneath lists individual rows in the
 * window (time, city, country). Points are approximate (city-level, IP-derived)
 * — never exact. `label` names the metric ("visits"/"invocations").
 */
export default function WorldMap({
  countries,
  points,
  recent = [],
  label,
}: {
  countries: CountryCount[]
  points: GeoPoint[]
  recent?: RawGeoVisit[]
  label: string
}) {
  const dark = useIsDark()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'world' | 'us'>('us')
  const [filterDays, setFilterDays] = useState<FilterDays>(7)
  const [hover, setHover] = useState<Hover>(null)
  const [hoverKey, setHoverKey] = useState<string | null>(null)

  // Rows inside the selected window. Only used when `recent` is populated —
  // otherwise we fall back to the pre-aggregated `points`/`countries` from
  // the API (older Worker builds without the raw feed).
  const hasRecent = recent.length > 0
  const filteredRecent = useMemo(() => {
    if (!hasRecent) return []
    const cutoff = Date.now() - filterDays * DAY_MS
    return recent.filter((r) => r.ts >= cutoff)
  }, [recent, filterDays, hasRecent])

  // Country counts: aggregate from raw rows when available (so the filter
  // actually shifts the choropleth), otherwise use the server-provided range.
  const byA2 = useMemo(() => {
    const m = new Map<string, number>()
    if (hasRecent) {
      for (const r of filteredRecent) {
        if (!r.country || r.country === 'XX') continue
        m.set(r.country, (m.get(r.country) ?? 0) + 1)
      }
    } else {
      for (const r of countries) if (r.country && r.country !== 'XX') m.set(r.country, r.count)
    }
    return m
  }, [filteredRecent, countries, hasRecent])
  const maxCountry = useMemo(() => Math.max(1, ...byA2.values()), [byA2])

  // City-level dots. When raw rows are present, aggregate per city (with
  // count + latest ts + averaged lat/lon). Otherwise use the server points.
  type Aggregated = {
    key: string
    city: string
    country: string
    lat: number
    lon: number
    count: number
    latestTs: number
  }
  const aggregated = useMemo<Aggregated[]>(() => {
    if (!hasRecent) {
      return points
        .filter((p) => p.lat != null && p.lon != null && p.city)
        .map((p) => ({
          key: `${p.country}|${p.city}`,
          city: p.city,
          country: p.country,
          lat: p.lat,
          lon: p.lon,
          count: p.count,
          latestTs: 0,
        }))
    }
    const acc = new Map<
      string,
      {
        city: string
        country: string
        latSum: number
        lonSum: number
        count: number
        latest: number
      }
    >()
    for (const r of filteredRecent) {
      if (r.lat == null || r.lon == null || !r.city) continue
      const key = `${r.country}|${r.city}`
      const cur = acc.get(key)
      if (cur) {
        cur.latSum += r.lat
        cur.lonSum += r.lon
        cur.count += 1
        if (r.ts > cur.latest) cur.latest = r.ts
      } else {
        acc.set(key, {
          city: r.city,
          country: r.country,
          latSum: r.lat,
          lonSum: r.lon,
          count: 1,
          latest: r.ts,
        })
      }
    }
    return Array.from(acc.entries()).map(([key, v]) => ({
      key,
      city: v.city,
      country: v.country,
      lat: v.latSum / v.count,
      lon: v.lonSum / v.count,
      count: v.count,
      latestTs: v.latest,
    }))
  }, [points, filteredRecent, hasRecent])

  // Project city points with the active projection. In US mode we restrict to
  // US points (Albers USA can still place border-adjacent foreign cities, so
  // filter by country rather than rely on the projection returning null).
  const dots = useMemo(() => {
    const project = mode === 'world' ? worldProjection : usProjection
    const src = mode === 'us' ? aggregated.filter((p) => p.country === 'US') : aggregated
    return src
      .map((p) => {
        const xy = project([p.lon, p.lat])
        return xy
          ? {
              x: xy[0],
              y: xy[1],
              key: p.key,
              city: p.city,
              country: p.country,
              count: p.count,
              latestTs: p.latestTs,
            }
          : null
      })
      .filter(
        (
          d
        ): d is {
          x: number
          y: number
          key: string
          city: string
          country: string
          count: number
          latestTs: number
        } => d !== null
      )
  }, [aggregated, mode])
  const maxDot = useMemo(() => Math.max(1, ...dots.map((d) => d.count)), [dots])
  const dotR = (count: number) => 2.5 + Math.sqrt(count / maxDot) * 7

  const base = dark ? '#1f2937' : '#e5e7eb'
  const stroke = dark ? '#0b1220' : '#ffffff'
  const hoverStroke = dark ? '#f9fafb' : '#0b1220'
  const accent = dark ? '#34D399' : '#047857'

  const at = (
    e: React.MouseEvent,
    title: string,
    count: number,
    latestTs?: number,
    key?: string
  ) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    setHover({
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
      title,
      count,
      latestTs,
    })
    if (key !== undefined) setHoverKey(key)
  }
  const clearDot = () => setHoverKey(null)

  const cityCount = new Set(dots.map((d) => `${d.country}|${d.city}`)).size
  const totalCountries = byA2.size
  const rangeLabel = filterDays === 7 ? 'last 7 days' : 'last 3 days'
  const isDotHover = hover?.latestTs !== undefined
  const listLabel = label[0].toUpperCase() + label.slice(1)

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
          onMouseLeave={() => {
            setHover(null)
            clearDot()
          }}
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
                    onMouseMove={(e) => {
                      clearDot()
                      at(e, (s.a2 && a2ToName[s.a2]) || 'Unknown', (s.a2 && byA2.get(s.a2)) || 0)
                    }}
                  />
                )
              })
            : US_SHAPES.map((s) => (
                <path key={s.key} d={s.d} fill={base} stroke={stroke} strokeWidth={0.5} />
              ))}

          {dots.map((d) => {
            const isHover = hoverKey === d.key
            const r = dotR(d.count)
            return (
              <circle
                key={d.key}
                cx={d.x}
                cy={d.y}
                r={isHover ? r * 1.5 : r}
                fill={accent}
                fillOpacity={isHover ? 0.95 : 0.75}
                stroke={isHover ? hoverStroke : stroke}
                strokeWidth={isHover ? 1.2 : 0.6}
                className="cursor-pointer transition-all"
                onMouseMove={(e) => {
                  e.stopPropagation()
                  const title = d.city + (d.country ? `, ${d.country}` : '')
                  at(e, title, d.count, d.latestTs || undefined, d.key)
                }}
                onMouseLeave={clearDot}
              />
            )
          })}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
            style={{ left: hover.x, top: hover.y - 8 }}
          >
            <div className="font-semibold">{hover.title}</div>
            <div className="mt-0.5 text-[11px] opacity-90">
              {hover.count.toLocaleString()} {label} · {rangeLabel}
            </div>
            {isDotHover && hover.latestTs ? (
              <div className="mt-0.5 text-[11px] opacity-75">
                Latest: {new Date(hover.latestTs).toLocaleString()}
              </div>
            ) : null}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {mode === 'world' &&
            `${totalCountries} ${totalCountries === 1 ? 'country' : 'countries'} · `}
          {cityCount} {cityCount === 1 ? 'city' : 'cities'} · {rangeLabel} · dots are approximate
          (city-level)
        </p>
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 text-xs font-medium dark:border-gray-700">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setFilterDays(opt.days)}
              className={`px-3 py-1 ${
                filterDays === opt.days
                  ? 'bg-[#047857] text-white dark:bg-[#34D399] dark:text-gray-900'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              title={`Filter to the last ${opt.days} days`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Recent {label} · {rangeLabel}{' '}
          <span className="ml-1 font-normal text-gray-400 normal-case">
            ({filteredRecent.length})
          </span>
        </h3>
        {hasRecent ? (
          filteredRecent.length > 0 ? (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 text-[10px] tracking-wide text-gray-500 uppercase dark:bg-gray-900 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">When</th>
                    <th className="px-3 py-2 font-medium">City</th>
                    <th className="px-3 py-2 font-medium">Country</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  {filteredRecent.slice(0, 200).map((r, i) => (
                    <tr
                      key={`${r.ts}-${i}`}
                      className="border-t border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-3 py-1.5 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {new Date(r.ts).toLocaleString()}
                      </td>
                      <td className="px-3 py-1.5">{r.city ?? '—'}</td>
                      <td className="px-3 py-1.5">
                        {r.country && r.country !== 'XX' ? r.country : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecent.length > 200 && (
                <p className="border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Showing latest 200 of {filteredRecent.length}.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No {label} in the {rangeLabel.replace('last ', '')}.
            </p>
          )
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Per-{listLabel.toLowerCase()} details appear once the Worker returns raw recent rows.
          </p>
        )}
      </div>
    </div>
  )
}
