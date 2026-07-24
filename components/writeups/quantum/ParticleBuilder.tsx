'use client'

import { useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './shared'

const FONT = 'system-ui, sans-serif'

type Fam = 'quark' | 'lepton' | 'neutrino' | 'force' | 'higgs'

const FAM_COLORS: Record<
  Fam,
  { light: { bg: string; text: string }; dark: { bg: string; text: string } }
> = {
  quark: { light: { bg: '#f3e8ff', text: '#7c3aed' }, dark: { bg: '#3b0764', text: '#d8b4fe' } },
  lepton: { light: { bg: '#ccfbf1', text: '#0f766e' }, dark: { bg: '#042f2e', text: '#5eead4' } },
  neutrino: { light: { bg: '#f1f5f9', text: '#475569' }, dark: { bg: '#1e293b', text: '#94a3b8' } },
  force: { light: { bg: '#fef3c7', text: '#b45309' }, dark: { bg: '#451a03', text: '#fcd34d' } },
  higgs: { light: { bg: '#ffe4e6', text: '#be123c' }, dark: { bg: '#4c0519', text: '#fda4af' } },
}

interface RosterTile {
  sym: string
  name: string
  fam: Fam
}

const ROSTER: { label: string; tiles: RosterTile[] }[] = [
  {
    label: 'quarks · pieces of protons and neutrons',
    tiles: [
      { sym: 'u', name: 'up', fam: 'quark' },
      { sym: 'd', name: 'down', fam: 'quark' },
      { sym: 'c', name: 'charm', fam: 'quark' },
      { sym: 's', name: 'strange', fam: 'quark' },
      { sym: 't', name: 'top', fam: 'quark' },
      { sym: 'b', name: 'bottom', fam: 'quark' },
    ],
  },
  {
    label: 'leptons · loners, no combining needed',
    tiles: [
      { sym: 'e', name: 'electron', fam: 'lepton' },
      { sym: 'μ', name: 'muon', fam: 'lepton' },
      { sym: 'τ', name: 'tau', fam: 'lepton' },
      { sym: 'νe', name: 'neutrino', fam: 'neutrino' },
      { sym: 'νμ', name: 'neutrino', fam: 'neutrino' },
      { sym: 'ντ', name: 'neutrino', fam: 'neutrino' },
    ],
  },
  {
    label: 'force carriers · the glue, not the bricks',
    tiles: [
      { sym: 'γ', name: 'photon', fam: 'force' },
      { sym: 'g', name: 'gluon', fam: 'force' },
      { sym: 'W', name: 'weak force', fam: 'force' },
      { sym: 'Z', name: 'weak force', fam: 'force' },
      { sym: 'H', name: 'Higgs', fam: 'higgs' },
    ],
  },
]

type Quark = 'u' | 'd'

interface BuildResult {
  name: string
  detail: string
  bonus?: string
}

const RESULTS: Record<string, BuildResult> = {
  uud: {
    name: 'a proton!',
    detail:
      'Two ups and a down. The heart of every atom, and as stable as anything in the universe.',
    bonus: 'Add one electron around it and you have hydrogen, the most common atom there is.',
  },
  udd: {
    name: 'a neutron!',
    detail:
      'One up and two downs. Perfectly happy inside a nucleus; on its own it decays in about 15 minutes.',
  },
  uuu: {
    name: 'a delta-plus-plus',
    detail:
      'Three ups. A real particle, made in colliders, but it falls apart in about a trillionth of a trillionth of a second.',
  },
  ddd: {
    name: 'a delta-minus',
    detail:
      'Three downs. Also real, also gone almost instantly. Nature keeps the exotic stuff brief.',
  },
}

// Charge in thirds: up = +2/3, down = -1/3.
function chargeLabel(thirds: number): string {
  const sign = thirds > 0 ? '+' : thirds < 0 ? '−' : ''
  const abs = Math.abs(thirds)
  if (abs % 3 === 0) return `${sign}${abs / 3}`
  return `${sign}${abs}/3`
}

export default function ParticleBuilder() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [picked, setPicked] = useState<Quark[]>([])

  const quarkColor = (isDark ? FAM_COLORS.quark.dark : FAM_COLORS.quark.light).text
  const quarkBg = (isDark ? FAM_COLORS.quark.dark : FAM_COLORS.quark.light).bg

  const thirds = picked.reduce((sum, q) => sum + (q === 'u' ? 2 : -1), 0)
  const key = [...picked].sort().reverse().join('') // u before d
  const result = picked.length === 3 ? RESULTS[key] : null

  const addQuark = (q: Quark) => {
    setPicked((prev) => (prev.length < 3 ? [...prev, q] : prev))
  }

  const tile = (t: RosterTile) => {
    const c = isDark ? FAM_COLORS[t.fam].dark : FAM_COLORS[t.fam].light
    return (
      <div
        key={t.sym + t.name}
        style={{
          background: c.bg,
          color: c.text,
          borderRadius: 8,
          padding: '6px 0 5px',
          textAlign: 'center',
          minWidth: 58,
          flex: '1 1 58px',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1 }}>{t.sym}</div>
        <div style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.85 }}>{t.name}</div>
      </div>
    )
  }

  const slot = (i: number) => {
    const q = picked[i]
    return (
      <div
        key={i}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: q ? `2.5px solid ${quarkColor}` : `2px dashed ${p.border}`,
          background: q ? quarkBg : 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: q ? quarkColor : p.muted,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{q ?? '?'}</div>
        {q && <div style={{ fontSize: 10, fontWeight: 700 }}>{q === 'u' ? '+2/3' : '−1/3'}</div>}
      </div>
    )
  }

  return (
    <DemoFrame
      title="The 17 particles, and how to build with them"
      isDark={isDark}
      caption="Quarks carry charges in thirds, which looks bizarre until you combine them: three at a time, the thirds always add up to a whole number. That is not a coincidence, it is why atoms work. (Why always three? Quarks are never found alone: pull two apart and the strong force snaps a new pair into existence first. Physicists call it confinement.)"
    >
      {/* Part 1: the roster */}
      <div style={{ fontFamily: FONT }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: p.text, marginBottom: 8 }}>
          1 · THE PARTS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {ROSTER.map((row) => (
            <div key={row.label}>
              <div style={{ fontSize: 10.5, color: p.muted, fontWeight: 600, marginBottom: 4 }}>
                {row.label}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{row.tiles.map(tile)}</div>
            </div>
          ))}
        </div>

        {/* Part 2: the builder */}
        <div style={{ fontSize: 12, fontWeight: 800, color: p.text, marginBottom: 8 }}>
          2 · COMBINE THEM · pick any three quarks
        </div>
        <div
          style={{
            border: `1.5px solid ${p.border}`,
            borderRadius: 10,
            padding: 14,
            background: p.panel,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <DemoButton
              isDark={isDark}
              primary
              onClick={() => addQuark('u')}
              disabled={picked.length >= 3}
            >
              + up quark (+2/3)
            </DemoButton>
            <DemoButton
              isDark={isDark}
              primary
              onClick={() => addQuark('d')}
              disabled={picked.length >= 3}
            >
              + down quark (−1/3)
            </DemoButton>
            <DemoButton isDark={isDark} onClick={() => setPicked([])}>
              Reset
            </DemoButton>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginTop: 14,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>{[0, 1, 2].map(slot)}</div>
            <div style={{ fontSize: 14, color: p.text, fontWeight: 700 }}>
              charge so far: <span style={{ color: quarkColor }}>{chargeLabel(thirds)}</span>
            </div>
          </div>
          <div style={{ marginTop: 12, minHeight: 40 }}>
            {result ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: p.good }}>
                  You built {result.name} · charge {chargeLabel(thirds)}
                </div>
                <div style={{ fontSize: 13, color: p.text, marginTop: 3, lineHeight: 1.5 }}>
                  {result.detail}
                </div>
                {result.bonus && (
                  <div style={{ fontSize: 13, color: p.muted, marginTop: 3, lineHeight: 1.5 }}>
                    {result.bonus}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: p.muted, lineHeight: 1.5 }}>
                {picked.length === 0
                  ? 'Try two ups and a down first.'
                  : `Keep going: quarks are never found alone. ${3 - picked.length} more to make something real.`}
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
