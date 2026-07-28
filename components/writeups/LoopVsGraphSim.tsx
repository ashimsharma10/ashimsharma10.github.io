'use client'

import { useId, useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './quantum/shared'

// Same task stepped through two shapes. Everything is scripted (no randomness)
// so the first render is deterministic and both tabs share one step counter.
const TOTAL_STEPS = 7

const GRAPH_STATE: { question: string; docs: string; verdict: string; answer: string }[] = [
  { question: 'why did deploy 142 fail?', docs: '[]', verdict: '', answer: '' },
  { question: 'why did deploy 142 fail?', docs: '2 snippets', verdict: '', answer: '' },
  { question: 'why did deploy 142 fail?', docs: '2 snippets', verdict: 'too_thin', answer: '' },
  { question: 'deploy 142 config diff', docs: '2 snippets', verdict: 'too_thin', answer: '' },
  { question: 'deploy 142 config diff', docs: '5 snippets', verdict: 'too_thin', answer: '' },
  { question: 'deploy 142 config diff', docs: '5 snippets', verdict: 'sufficient', answer: '' },
  {
    question: 'deploy 142 config diff',
    docs: '5 snippets',
    verdict: 'sufficient',
    answer: 'config change broke the health check',
  },
  {
    question: 'deploy 142 config diff',
    docs: '5 snippets',
    verdict: 'sufficient',
    answer: 'config change broke the health check',
  },
]

const GRAPH_ACTIVE = [
  'start',
  'retrieve',
  'grade',
  'rewrite',
  'retrieve',
  'grade',
  'answer',
  'done',
]

// Cumulative lit edges per step, keyed by edge id.
const GRAPH_EDGES_LIT: string[][] = [
  [],
  ['e1'],
  ['e1', 'e2'],
  ['e1', 'e2', 'e4'],
  ['e1', 'e2', 'e4', 'e5'],
  ['e1', 'e2', 'e4', 'e5'],
  ['e1', 'e2', 'e4', 'e5', 'e3'],
  ['e1', 'e2', 'e4', 'e5', 'e3', 'e6'],
]

const LOOP_ACTIVE = ['none', 'reason', 'act', 'observe', 'reason', 'act', 'observe', 'answer']

const LOOP_CONTEXT = [
  "goal: answer 'why did deploy 142 fail?'",
  'reason: I need evidence, search first',
  "act: search('deploy 142 failure')",
  'observe: 2 snippets, not enough',
  "reason: refine the query, add 'config'",
  "act: search('deploy 142 config diff')",
  'observe: 5 snippets, enough',
  'answer: config change broke the health check',
]

const STEP_NOTE = [
  'Not started. Press Step to run the same task in either shape.',
  'Retrieval runs first.',
  'The evidence is graded: too thin.',
  'The query gets rewritten.',
  'Retrieval runs again with the better query.',
  'Graded again: sufficient this time.',
  'The answer is written.',
  'Done. Flip tabs to compare where the history ended up.',
]

export default function LoopVsGraphSim() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const uid = useId()
  const [tab, setTab] = useState<'graph' | 'loop'>('graph')
  const [step, setStep] = useState(0)

  const done = step >= TOTAL_STEPS
  const litId = `${uid}-lit`
  const dimId = `${uid}-dim`

  const nodeFill = (name: string, active: string) => (name === active ? p.accentSoft : p.panel)
  const nodeStroke = (name: string, active: string) => (name === active ? p.accent : p.border)
  const edgeStroke = (id: string, lit: string[]) => (lit.includes(id) ? p.accent : p.border)
  const edgeMarker = (id: string, lit: string[]) =>
    lit.includes(id) ? `url(#${litId})` : `url(#${dimId})`

  const markers = (
    <defs>
      <marker id={litId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill={p.accent} />
      </marker>
      <marker id={dimId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill={p.border} />
      </marker>
    </defs>
  )

  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    name: string,
    active: string
  ) => (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="8"
        fill={nodeFill(name, active)}
        stroke={nodeStroke(name, active)}
        strokeWidth="1.5"
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fill={p.text}
        fontSize="12"
        fontWeight={name === active ? 700 : 500}
      >
        {label}
      </text>
    </g>
  )

  const graphActive = GRAPH_ACTIVE[step]
  const lit = GRAPH_EDGES_LIT[step]
  const graphSvg = (
    <svg viewBox="0 0 560 195" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {markers}
      <circle
        cx="28"
        cy="80"
        r="9"
        fill={graphActive === 'start' ? p.accentSoft : p.panel}
        stroke={graphActive === 'start' ? p.accent : p.border}
        strokeWidth="1.5"
      />
      <text x="28" y="106" textAnchor="middle" fill={p.muted} fontSize="11">
        start
      </text>
      <path
        d="M38,80 L64,80"
        stroke={edgeStroke('e1', lit)}
        strokeWidth="1.5"
        markerEnd={edgeMarker('e1', lit)}
      />
      {box(70, 60, 92, 40, 'retrieve', 'retrieve', graphActive)}
      <path
        d="M162,80 L199,80"
        stroke={edgeStroke('e2', lit)}
        strokeWidth="1.5"
        markerEnd={edgeMarker('e2', lit)}
      />
      {box(205, 60, 80, 40, 'grade', 'grade', graphActive)}
      <path
        d="M285,80 L324,80"
        stroke={edgeStroke('e3', lit)}
        strokeWidth="1.5"
        markerEnd={edgeMarker('e3', lit)}
      />
      <text x="305" y="72" textAnchor="middle" fill={p.muted} fontSize="10">
        sufficient
      </text>
      {box(330, 60, 80, 40, 'answer', 'answer', graphActive)}
      <path
        d="M245,100 L245,129"
        stroke={edgeStroke('e4', lit)}
        strokeWidth="1.5"
        markerEnd={edgeMarker('e4', lit)}
      />
      <text x="252" y="118" fill={p.muted} fontSize="10">
        too thin
      </text>
      {box(205, 135, 80, 36, 'rewrite', 'rewrite', graphActive)}
      <path
        d="M205,153 L116,153 L116,106"
        fill="none"
        stroke={edgeStroke('e5', lit)}
        strokeWidth="1.5"
        markerEnd={edgeMarker('e5', lit)}
      />
      <path
        d="M410,80 L446,80"
        stroke={edgeStroke('e6', lit)}
        strokeWidth="1.5"
        markerEnd={edgeMarker('e6', lit)}
      />
      <circle
        cx="456"
        cy="80"
        r="9"
        fill={graphActive === 'done' ? p.accentSoft : p.panel}
        stroke={graphActive === 'done' ? p.accent : p.border}
        strokeWidth="1.5"
      />
      <text x="456" y="106" textAnchor="middle" fill={p.muted} fontSize="11">
        done
      </text>
    </svg>
  )

  const loopActive = LOOP_ACTIVE[step]
  const loopSvg = (
    <svg viewBox="0 0 560 195" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {markers}
      <rect
        x="60"
        y="38"
        width="320"
        height="122"
        rx="10"
        fill="none"
        stroke={p.border}
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <text x="220" y="58" textAnchor="middle" fill={p.muted} fontSize="11">
        one agent, one context window
      </text>
      {box(80, 70, 80, 36, 'reason', 'reason', loopActive)}
      <path d="M160,88 L174,88" stroke={p.border} strokeWidth="1.5" markerEnd={`url(#${dimId})`} />
      {box(180, 70, 80, 36, 'act', 'act', loopActive)}
      <path d="M260,88 L274,88" stroke={p.border} strokeWidth="1.5" markerEnd={`url(#${dimId})`} />
      {box(280, 70, 80, 36, 'observe', 'observe', loopActive)}
      <path
        d="M320,106 L320,140 L120,140 L120,112"
        fill="none"
        stroke={p.border}
        strokeWidth="1.5"
        markerEnd={`url(#${dimId})`}
      />
      <text x="220" y="154" textAnchor="middle" fill={p.muted} fontSize="10">
        repeat until the goal is met
      </text>
      <path
        d="M360,88 L444,88"
        stroke={loopActive === 'answer' ? p.accent : p.border}
        strokeWidth="1.5"
        markerEnd={loopActive === 'answer' ? `url(#${litId})` : `url(#${dimId})`}
      />
      {box(450, 70, 84, 36, 'answer', 'answer', loopActive)}
    </svg>
  )

  const stateRow = (k: string, v: string) => (
    <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.7 }}>
      <span style={{ color: p.muted, minWidth: 66 }}>{k}</span>
      <span style={{ color: v ? p.text : p.muted, fontFamily: 'ui-monospace, monospace' }}>
        {v || '(empty)'}
      </span>
    </div>
  )

  const gs = GRAPH_STATE[step]
  const context = LOOP_CONTEXT.slice(0, step + 1)

  return (
    <DemoFrame
      title="Same task, two shapes: loop vs graph"
      isDark={isDark}
      caption="Both shapes make the same calls in the same order. The difference is where the history lives: the loop appends everything to one context window, while the graph keeps typed state and lights up the route it took, which is also its audit trail."
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <DemoButton isDark={isDark} primary={tab === 'graph'} onClick={() => setTab('graph')}>
          Graph
        </DemoButton>
        <DemoButton isDark={isDark} primary={tab === 'loop'} onClick={() => setTab('loop')}>
          Loop
        </DemoButton>
        <span style={{ width: 10 }} />
        <DemoButton
          isDark={isDark}
          primary
          disabled={done}
          onClick={() => setStep((s) => Math.min(s + 1, TOTAL_STEPS))}
        >
          Step
        </DemoButton>
        <DemoButton isDark={isDark} onClick={() => setStep(0)}>
          Reset
        </DemoButton>
        <span style={{ fontSize: 12, color: p.muted }}>
          step {step}/{TOTAL_STEPS}
        </span>
      </div>

      {tab === 'graph' ? graphSvg : loopSvg}

      <div
        style={{
          marginTop: 12,
          border: `1px solid ${p.border}`,
          borderRadius: 8,
          background: p.panel,
          padding: '10px 12px',
        }}
      >
        {tab === 'graph' ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: p.muted, marginBottom: 4 }}>
              SHARED STATE (TYPED, FIXED FIELDS)
            </div>
            {stateRow('question', gs.question)}
            {stateRow('docs', gs.docs)}
            {stateRow('verdict', gs.verdict)}
            {stateRow('answer', gs.answer)}
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: p.muted, marginBottom: 4 }}>
              CONTEXT WINDOW (APPEND-ONLY, {context.length}{' '}
              {context.length === 1 ? 'ENTRY' : 'ENTRIES'})
            </div>
            {context.map((line, i) => (
              <div
                key={line}
                style={{
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: i === context.length - 1 && step > 0 ? p.text : p.muted,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {line}
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: p.text }}>{STEP_NOTE[step]}</div>
    </DemoFrame>
  )
}
