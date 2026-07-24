'use client'

import type { CSSProperties, ReactNode } from 'react'
import { DemoFrame, palette, useIsDark } from './shared'

type Family = 'quark' | 'lepton' | 'neutrino' | 'force' | 'higgs'

const FAMILY_COLORS: Record<
  Family,
  {
    light: { bg: string; edge: string; text: string }
    dark: { bg: string; edge: string; text: string }
  }
> = {
  quark: {
    light: { bg: '#faf5ff', edge: '#a855f7', text: '#6d28d9' },
    dark: { bg: '#2e1065', edge: '#a855f7', text: '#d8b4fe' },
  },
  lepton: {
    light: { bg: '#f0fdfa', edge: '#14b8a6', text: '#0f766e' },
    dark: { bg: '#042f2e', edge: '#14b8a6', text: '#5eead4' },
  },
  neutrino: {
    light: { bg: '#f8fafc', edge: '#94a3b8', text: '#475569' },
    dark: { bg: '#1e293b', edge: '#64748b', text: '#94a3b8' },
  },
  force: {
    light: { bg: '#fffbeb', edge: '#f59e0b', text: '#b45309' },
    dark: { bg: '#451a03', edge: '#f59e0b', text: '#fcd34d' },
  },
  higgs: {
    light: { bg: '#fff1f2', edge: '#f43f5e', text: '#be123c' },
    dark: { bg: '#4c0519', edge: '#f43f5e', text: '#fda4af' },
  },
}

interface Tile {
  symbol: string
  name: string
  hook: string
  family: Family
}

const MATTER_ROWS: { label: string; tiles: Tile[] }[] = [
  {
    label: 'quarks',
    tiles: [
      { symbol: 'u', name: 'up', hook: '2 in every proton', family: 'quark' },
      { symbol: 'c', name: 'charm', hook: 'heavier up', family: 'quark' },
      { symbol: 't', name: 'top', hook: 'heavy as a gold atom', family: 'quark' },
    ],
  },
  {
    label: '',
    tiles: [
      { symbol: 'd', name: 'down', hook: '1 in every proton', family: 'quark' },
      { symbol: 's', name: 'strange', hook: 'heavier down', family: 'quark' },
      { symbol: 'b', name: 'bottom', hook: 'heavier still', family: 'quark' },
    ],
  },
  {
    label: 'leptons',
    tiles: [
      { symbol: 'e', name: 'electron', hook: 'all of chemistry', family: 'lepton' },
      { symbol: 'μ', name: 'muon', hook: 'who ordered that?', family: 'lepton' },
      { symbol: 'τ', name: 'tau', hook: 'heavier again', family: 'lepton' },
    ],
  },
  {
    label: '',
    tiles: [
      { symbol: 'νe', name: 'e-neutrino', hook: 'ghosts from the Sun', family: 'neutrino' },
      { symbol: 'νμ', name: 'μ-neutrino', hook: 'ghost, gen 2', family: 'neutrino' },
      { symbol: 'ντ', name: 'τ-neutrino', hook: 'ghost, gen 3', family: 'neutrino' },
    ],
  },
]

const BOSON_TILES: Tile[] = [
  { symbol: 'γ', name: 'photon', hook: 'light + electricity', family: 'force' },
  { symbol: 'g', name: 'gluon', hook: 'nuclear glue', family: 'force' },
  { symbol: 'W Z', name: 'W and Z', hook: 'radioactive decay', family: 'force' },
  { symbol: 'H', name: 'Higgs', hook: 'hands out mass', family: 'higgs' },
]

function TileBox({ tile, isDark }: { tile: Tile; isDark: boolean }) {
  const c = isDark ? FAMILY_COLORS[tile.family].dark : FAMILY_COLORS[tile.family].light
  return (
    <div
      style={{
        background: c.bg,
        border: `1.5px solid ${c.edge}`,
        borderRadius: 10,
        padding: '8px 6px 7px',
        textAlign: 'center',
        minWidth: 86,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, color: c.text }}>
        {tile.symbol}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 2, color: c.text }}>
        {tile.name}
      </div>
      <div style={{ fontSize: 10, marginTop: 1, color: c.text, opacity: 0.85 }}>{tile.hook}</div>
    </div>
  )
}

export default function StandardModelChart() {
  const isDark = useIsDark()
  const p = palette(isDark)

  const colHeader = (text: string, highlight: boolean): ReactNode => (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textAlign: 'center',
        color: highlight ? p.accent : p.muted,
        padding: '2px 0 6px',
      }}
    >
      {text}
    </div>
  )

  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  }

  return (
    <DemoFrame
      title="The Standard Model: all 17 particles on one card"
      isDark={isDark}
      caption="Everything ever detected is on this card, plus gravity. The highlighted column builds you: two quarks make protons and neutrons, electrons do the chemistry, neutrinos fly through uninvited. Columns 2 and 3 are heavier photocopies that decay in a blink; nobody knows why nature ordered three. The amber column carries the forces, and the Higgs hands out mass."
    >
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 14, minWidth: 520, alignItems: 'stretch' }}>
          {/* Matter block */}
          <div style={{ flex: '3 1 0' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: p.text,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              MATTER · fermions
            </div>
            <div style={grid}>
              {colHeader('Gen 1 · you', true)}
              {colHeader('Gen 2', false)}
              {colHeader('Gen 3', false)}
            </div>
            <div style={{ position: 'relative' }}>
              {/* Gen-1 highlight frame */}
              <div
                style={{
                  position: 'absolute',
                  left: -5,
                  top: -4,
                  width: 'calc(33.333% - 1px)',
                  height: 'calc(100% + 8px)',
                  border: `2px dashed ${p.accent}`,
                  borderRadius: 12,
                  pointerEvents: 'none',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MATTER_ROWS.map((row, i) => (
                  <div key={i} style={grid}>
                    {row.tiles.map((tile) => (
                      <TileBox key={tile.symbol} tile={tile} isDark={isDark} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Forces block */}
          <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: p.text,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              FORCES
            </div>
            <div style={{ fontSize: 11, height: 21 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {BOSON_TILES.map((tile) => (
                <TileBox key={tile.symbol} tile={tile} isDark={isDark} />
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: p.muted,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          missing from the card: gravity. Nobody has found its particle.
        </div>
      </div>
    </DemoFrame>
  )
}
