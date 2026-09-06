'use client'

import { useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './quantum/shared'

// Attention masses here are hand-set to match the shape reported in the literature rather
// than measured from a live model: a sink on the first token, a heavy tail on content
// words in prose, and delimiters carrying roughly an order of magnitude more mass than
// the values they surround in schema-dense text. Nothing is random, so the first render
// is stable under Strict Mode.

type Role = 'struct' | 'value' | 'word'

interface Tok {
  text: string
  mass: number
  role: Role
}

const PROSE: Tok[] = [
  { text: 'The', mass: 8.0, role: 'word' },
  { text: 'quarterly', mass: 1.1, role: 'word' },
  { text: 'revenue', mass: 3.4, role: 'value' },
  { text: 'for', mass: 0.3, role: 'word' },
  { text: 'the', mass: 0.3, role: 'word' },
  { text: 'Chicago', mass: 3.1, role: 'value' },
  { text: 'office', mass: 1.0, role: 'word' },
  { text: 'rose', mass: 1.4, role: 'word' },
  { text: 'to', mass: 0.3, role: 'word' },
  { text: '4.2', mass: 2.9, role: 'value' },
  { text: 'million', mass: 2.4, role: 'value' },
  { text: 'in', mass: 0.3, role: 'word' },
  { text: 'the', mass: 0.2, role: 'word' },
  { text: 'third', mass: 1.8, role: 'value' },
  { text: 'quarter', mass: 1.2, role: 'word' },
  { text: '.', mass: 0.9, role: 'struct' },
]

const JSON_DOC: Tok[] = [
  { text: '{', mass: 12.0, role: 'struct' },
  { text: '"city"', mass: 5.4, role: 'struct' },
  { text: ':', mass: 3.6, role: 'struct' },
  { text: '"chicago"', mass: 0.7, role: 'value' },
  { text: ',', mass: 3.1, role: 'struct' },
  { text: '"rev"', mass: 5.1, role: 'struct' },
  { text: ':', mass: 3.4, role: 'struct' },
  { text: '"4.2M"', mass: 0.9, role: 'value' },
  { text: ',', mass: 3.0, role: 'struct' },
  { text: '"qtr"', mass: 4.8, role: 'struct' },
  { text: ':', mass: 3.3, role: 'struct' },
  { text: '"Q3"', mass: 0.6, role: 'value' },
  { text: ',', mass: 2.9, role: 'struct' },
  { text: '"year"', mass: 4.9, role: 'struct' },
  { text: ':', mass: 3.2, role: 'struct' },
  { text: '"2025"', mass: 0.8, role: 'value' },
  { text: '}', mass: 5.2, role: 'struct' },
]

type Policy = 'recent' | 'h2o' | 'role'

const POLICIES: { id: Policy; name: string; blurb: string }[] = [
  {
    id: 'recent',
    name: 'Recent window',
    blurb: 'Keep the last N tokens and forget the rest. Cheap, and blind to what mattered.',
  },
  {
    id: 'h2o',
    name: 'H2O heavy hitters',
    blurb: 'Keep the N tokens with the most accumulated attention mass.',
  },
  {
    id: 'role',
    name: 'Role-aware',
    blurb:
      'Same scores, but structural tokens are discounted before ranking, so they cannot crowd out content.',
  },
]

// Returns the set of indices this policy keeps at the given budget.
function keepSet(toks: Tok[], policy: Policy, budget: number): Set<number> {
  const n = Math.max(1, Math.round(toks.length * budget))
  if (policy === 'recent') {
    return new Set(toks.map((_, i) => i).slice(-n))
  }
  const scored = toks.map((t, i) => ({
    i,
    // The correction is one line: stop letting a delimiter's signal energy read as
    // relevance. Everything else about the policy is unchanged.
    score: policy === 'role' && t.role === 'struct' ? t.mass / 6 : t.mass,
  }))
  scored.sort((a, b) => b.score - a.score || a.i - b.i)
  return new Set(scored.slice(0, n).map((s) => s.i))
}

export default function KVEvictionSim() {
  const isDark = useIsDark()
  const p = palette(isDark)

  const [schema, setSchema] = useState(true)
  const [policy, setPolicy] = useState<Policy>('h2o')
  const [budget, setBudget] = useState(0.4)

  const toks = schema ? JSON_DOC : PROSE
  const kept = keepSet(toks, policy, budget)
  const maxMass = Math.max(...toks.map((t) => t.mass))

  const values = toks.filter((t) => t.role === 'value')
  const valuesKept = toks.filter((t, i) => t.role === 'value' && kept.has(i)).length
  const structKept = toks.filter((t, i) => t.role === 'struct' && kept.has(i)).length
  const structTotal = toks.filter((t) => t.role === 'struct').length

  const label: React.CSSProperties = {
    color: p.muted,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  }
  const row: React.CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap' }

  return (
    <DemoFrame
      title="Which tokens survive the budget"
      isDark={isDark}
      caption={
        <>
          Bar height under each token is its accumulated attention mass. Faded tokens have been
          evicted: their keys and values are gone, and the model can no longer see them.
        </>
      }
    >
      <div style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={label}>Context</div>
            <div style={row}>
              <DemoButton isDark={isDark} primary={!schema} onClick={() => setSchema(false)}>
                Prose
              </DemoButton>
              <DemoButton isDark={isDark} primary={schema} onClick={() => setSchema(true)}>
                JSON
              </DemoButton>
            </div>
          </div>
          <div>
            <div style={label}>Keep</div>
            <div style={row}>
              {[0.25, 0.4, 0.6].map((b) => (
                <DemoButton
                  key={b}
                  isDark={isDark}
                  primary={b === budget}
                  onClick={() => setBudget(b)}
                >
                  {Math.round(b * 100)}%
                </DemoButton>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={label}>Eviction policy</div>
          <div style={row}>
            {POLICIES.map((pol) => (
              <DemoButton
                key={pol.id}
                isDark={isDark}
                primary={pol.id === policy}
                onClick={() => setPolicy(pol.id)}
              >
                {pol.name}
              </DemoButton>
            ))}
          </div>
          <div style={{ color: p.muted, fontSize: '12px', marginTop: '8px', lineHeight: 1.5 }}>
            {POLICIES.find((x) => x.id === policy)!.blurb}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {toks.map((t, i) => {
            const on = kept.has(i)
            const isValue = t.role === 'value'
            return (
              <div key={i} style={{ textAlign: 'center', opacity: on ? 1 : 0.22 }}>
                <div
                  style={{
                    width: '100%',
                    height: `${6 + (t.mass / maxMass) * 34}px`,
                    background: isValue ? p.good : p.accent,
                    borderRadius: '2px 2px 0 0',
                  }}
                />
                <div
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '11.5px',
                    padding: '3px 5px',
                    borderLeft: `1.5px solid ${isValue ? p.good : p.border}`,
                    borderRight: `1.5px solid ${isValue ? p.good : p.border}`,
                    borderBottom: `1.5px solid ${isValue ? p.good : p.border}`,
                    borderRadius: '0 0 5px 5px',
                    color: p.text,
                    background: on ? p.panel : 'transparent',
                    textDecoration: on ? 'none' : 'line-through',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.text}
                </div>
              </div>
            )
          })}
        </div>

        <div
          style={{
            background: p.panel,
            border: `1px solid ${p.border}`,
            borderRadius: '10px',
            padding: '12px 14px',
            color: p.text,
            fontSize: '13px',
            lineHeight: 1.7,
          }}
        >
          Kept {kept.size} of {toks.length} tokens. Of those,{' '}
          <b style={{ color: p.good }}>
            {valuesKept} of {values.length}
          </b>{' '}
          carry actual content, and {structKept} of {structTotal} are punctuation or keys.
          {schema && policy === 'h2o' && valuesKept < values.length && (
            <>
              <br />
              The braces survived. The answers did not.
            </>
          )}
        </div>
      </div>
    </DemoFrame>
  )
}
