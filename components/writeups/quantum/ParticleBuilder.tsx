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
  charge: string
  fact: string
}

const ROSTER: { label: string; tiles: RosterTile[] }[] = [
  {
    label: 'quarks · pieces of protons and neutrons',
    tiles: [
      {
        sym: 'u',
        name: 'up',
        fam: 'quark',
        charge: '+2/3',
        fact: 'Two of these live in every proton. Featherweight: most of a proton’s mass is not its quarks at all.',
      },
      {
        sym: 'd',
        name: 'down',
        fam: 'quark',
        charge: '−1/3',
        fact: 'One in every proton, two in every neutron. With up and the electron, it builds all lasting matter.',
      },
      {
        sym: 'c',
        name: 'charm',
        fam: 'quark',
        charge: '+2/3',
        fact: 'A heavier up, about 1.4× a whole proton. Its 1974 discovery shocked physics into accepting quarks.',
      },
      {
        sym: 's',
        name: 'strange',
        fam: 'quark',
        charge: '−1/3',
        fact: 'A heavier down. Cosmic-ray particles containing it lived “strangely” long, hence the name.',
      },
      {
        sym: 't',
        name: 'top',
        fam: 'quark',
        charge: '+2/3',
        fact: 'Heavy as an entire gold atom, gone in 10⁻²⁵ seconds: it decays before it can even bind to anything.',
      },
      {
        sym: 'b',
        name: 'bottom',
        fam: 'quark',
        charge: '−1/3',
        fact: 'Heavier still. The LHC studies its particles for tiny cracks in the Standard Model.',
      },
    ],
  },
  {
    label: 'leptons · loners, no combining needed',
    tiles: [
      {
        sym: 'e',
        name: 'electron',
        fam: 'lepton',
        charge: '−1',
        fact: 'Does all of chemistry, carries all your electricity, and never decays. The most useful particle there is.',
      },
      {
        sym: 'μ',
        name: 'muon',
        fam: 'lepton',
        charge: '−1',
        fact: 'A heavy electron that lives 2.2 microseconds. Cosmic rays are sprinkling them on your head right now.',
      },
      {
        sym: 'τ',
        name: 'tau',
        fam: 'lepton',
        charge: '−1',
        fact: 'Heavier again, 3500× the electron. Decays so fast it barely travels a millimeter.',
      },
      {
        sym: 'νe',
        name: 'e-neutrino',
        fam: 'neutrino',
        charge: '0',
        fact: 'Almost massless, almost invisible. The Sun sends 100 trillion through you every second; almost none ever touch you.',
      },
      {
        sym: 'νμ',
        name: 'μ-neutrino',
        fam: 'neutrino',
        charge: '0',
        fact: 'The muon’s ghost partner. Neutrinos shape-shift between their three kinds mid-flight, a 2015 Nobel discovery.',
      },
      {
        sym: 'ντ',
        name: 'τ-neutrino',
        fam: 'neutrino',
        charge: '0',
        fact: 'The hardest particle to catch: it took until the year 2000 to detect one directly.',
      },
    ],
  },
  {
    label: 'force carriers · the glue, not the bricks',
    tiles: [
      {
        sym: 'γ',
        name: 'photon',
        fam: 'force',
        charge: '0',
        fact: 'Carries light, radio, X-rays, and every electric and magnetic push. Massless, so it travels at, well, light speed.',
      },
      {
        sym: 'g',
        name: 'gluon',
        fam: 'force',
        charge: '0',
        fact: 'Glues quarks together, and pulls harder the farther they stretch. Its raw energy is ~99% of your body weight.',
      },
      {
        sym: 'W',
        name: 'weak force',
        fam: 'force',
        charge: '±1',
        fact: 'The alchemist: flips one quark type into another. Every radioactive decay and the Sun’s fusion run through it.',
      },
      {
        sym: 'Z',
        name: 'weak force',
        fam: 'force',
        charge: '0',
        fact: 'The W’s neutral sibling, 97× a proton’s mass. A force carrier heavier than an iron atom.',
      },
      {
        sym: 'H',
        name: 'Higgs',
        fam: 'higgs',
        charge: '0',
        fact: 'Not a force, a field with a particle. Fundamental particles get their mass from wading through it. Found in 2012.',
      },
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

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Why exactly three?',
    a: 'The strong force never lets a quark exist alone: pull one away and the energy you spend snaps a brand-new quark pair into existence before you succeed. Physicists call it confinement. Quarks are only ever found in threes (like your proton) or in quark-antiquark pairs called mesons.',
  },
  {
    q: 'Why only up and down?',
    a: 'You can combine the other four quarks too, and colliders do: strange, charm, and bottom all form real particles. But those quarks are heavy and unstable, so everything built from them decays in a blink (the top quark decays before it can bind at all). Every atom that lasts long enough to matter is made of up, down, and electrons.',
  },
  {
    q: 'Where are the forces while you build?',
    a: 'Working, invisibly. Gluons are the glue holding your three quarks together, and their raw energy makes up ~99% of the proton’s mass. The photon then binds electrons to your proton to make atoms. The W can flip a down into an up, which is what radioactive decay is. And the Higgs field sets the quarks’ own small masses.',
  },
]

export default function ParticleBuilder() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [picked, setPicked] = useState<Quark[]>([])
  const [info, setInfo] = useState<RosterTile | null>(null)

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
    const active = info?.sym === t.sym
    return (
      <button
        key={t.sym}
        type="button"
        onMouseEnter={() => setInfo(t)}
        onFocus={() => setInfo(t)}
        onClick={() => setInfo(t)}
        style={{
          background: c.bg,
          color: c.text,
          border: active ? `2px solid ${c.text}` : '2px solid transparent',
          borderRadius: 8,
          padding: '5px 0 4px',
          textAlign: 'center',
          minWidth: 58,
          flex: '1 1 58px',
          cursor: 'pointer',
          fontFamily: FONT,
          transform: active ? 'translateY(-1px)' : 'none',
          transition: 'transform 100ms, border-color 100ms',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1 }}>{t.sym}</div>
        <div style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.85 }}>{t.name}</div>
      </button>
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
      caption="Quarks carry charges in thirds, which looks bizarre until you combine them: three at a time, the thirds always add up to a whole number. That is not a coincidence, it is why atoms work."
    >
      {/* Part 1: the roster */}
      <div style={{ fontFamily: FONT }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: p.text, marginBottom: 8 }}>
          1 · THE PARTS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROSTER.map((row) => (
            <div key={row.label}>
              <div style={{ fontSize: 10.5, color: p.muted, fontWeight: 600, marginBottom: 4 }}>
                {row.label}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{row.tiles.map(tile)}</div>
            </div>
          ))}
        </div>
        {/* info panel for the hovered/tapped particle */}
        <div
          style={{
            margin: '10px 0 18px',
            padding: '9px 12px',
            border: `1.5px solid ${p.border}`,
            borderRadius: 8,
            minHeight: 58,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: p.text,
            background: p.panel,
          }}
        >
          {info ? (
            <>
              <span style={{ fontWeight: 800 }}>
                {info.name} ({info.sym})
              </span>
              <span style={{ color: p.muted, fontWeight: 600 }}> · charge {info.charge} · </span>
              {info.fact}
            </>
          ) : (
            <span style={{ color: p.muted }}>
              Hover or tap any particle above to see what it does.
            </span>
          )}
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

        {/* Part 3: the questions everyone asks */}
        <div style={{ fontSize: 12, fontWeight: 800, color: p.text, margin: '18px 0 8px' }}>
          3 · THE QUESTIONS EVERYONE ASKS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ.map((item) => (
            <div key={item.q} style={{ fontSize: 12.5, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 800, color: p.text }}>{item.q} </span>
              <span style={{ color: p.muted }}>{item.a}</span>
            </div>
          ))}
        </div>
      </div>
    </DemoFrame>
  )
}
