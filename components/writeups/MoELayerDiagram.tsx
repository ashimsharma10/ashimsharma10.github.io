'use client'

import { type CSSProperties, type ReactNode } from 'react'
import { DemoFrame, palette, useIsDark } from './quantum/shared'

// Static figure: a dense transformer block next to an MoE one. Drawn in HTML rather
// than mermaid so the two columns line up, the colours follow the site theme, and it
// stacks instead of shrinking on a phone.

function Arrow({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <div style={{ width: '1.5px', height: '10px', background: color }} />
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `5px solid ${color}`,
        }}
      />
    </div>
  )
}

function Box({
  children,
  border,
  fill,
  color,
  sub,
  dashed = false,
}: {
  children: ReactNode
  border: string
  fill: string
  color: string
  sub?: string
  dashed?: boolean
}) {
  return (
    <div
      style={{
        width: '100%',
        border: `1.5px ${dashed ? 'dashed' : 'solid'} ${border}`,
        background: fill,
        color,
        borderRadius: '8px',
        padding: '8px 10px',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1.35,
      }}
    >
      {children}
      {sub && (
        <div style={{ fontSize: '10px', fontWeight: 400, opacity: 0.85, marginTop: '2px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export default function MoELayerDiagram() {
  const isDark = useIsDark()
  const p = palette(isDark)

  const soft = (hex: string) => `${hex}${isDark ? '33' : '1a'}`
  const column: CSSProperties = {
    flex: '1 1 240px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    border: `1px solid ${p.border}`,
    borderRadius: '10px',
    padding: '12px',
    background: p.bg,
  }
  const heading: CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: p.muted,
    marginBottom: '4px',
  }
  const cost = (tone: string): CSSProperties => ({
    marginTop: '10px',
    width: '100%',
    borderRadius: '6px',
    background: soft(tone),
    border: `1px solid ${tone}`,
    color: tone,
    fontSize: '11px',
    fontWeight: 700,
    textAlign: 'center',
    padding: '5px 6px',
  })

  const shared = (
    <>
      <Box border={p.border} fill={p.panel} color={p.text}>
        token
      </Box>
      <Arrow color={p.muted} />
      <Box border={p.border} fill={p.panel} color={p.text} sub="full cost, both sides">
        attention
      </Box>
      <Arrow color={p.muted} />
    </>
  )

  return (
    <DemoFrame
      title="One transformer block, dense and sparse"
      isDark={isDark}
      caption={
        <>
          Only the middle box changed. Attention runs in full on both sides, and the KV cache it
          fills is the same size either way. The experts are drawn 2 of 8 to match the simulator
          below. DeepSeek-V3 picks 8 of 256, plus one shared expert every token uses.
        </>
      }
    >
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={column}>
          <div style={heading}>Dense block</div>
          {shared}
          <Box
            border={p.secondary}
            fill={soft(p.secondary)}
            color={p.secondary}
            sub="every weight runs, every token"
          >
            one feed forward network
          </Box>
          <div style={cost(p.secondary)}>feed forward weights used: 100%</div>
        </div>

        <div style={column}>
          <div style={heading}>MoE block</div>
          {shared}
          <Box border={p.accent} fill={soft(p.accent)} color={p.accent} sub="one linear layer">
            router
          </Box>
          <Arrow color={p.muted} />
          <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
            {Array.from({ length: 8 }, (_, i) => {
              const on = i === 2 || i === 5
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '5px',
                    border: `1.5px ${on ? 'solid' : 'dashed'} ${on ? p.good : p.border}`,
                    background: on ? soft(p.good) : 'transparent',
                    color: on ? p.good : p.muted,
                    fontSize: '9px',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1px',
                  }}
                >
                  <span>E{i}</span>
                  <span style={{ fontWeight: 400, fontSize: '8px' }}>{on ? 'run' : 'skip'}</span>
                </div>
              )
            })}
          </div>
          <Arrow color={p.muted} />
          <Box
            border={p.good}
            fill={soft(p.good)}
            color={p.good}
            sub="weighted by the router score"
          >
            add the two outputs
          </Box>
          <div style={cost(p.good)}>
            feed forward weights used: 25% here, about 5% in DeepSeek-V3
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '8px 10px',
          borderRadius: '8px',
          background: p.panel,
          border: `1px solid ${p.border}`,
          color: p.text,
          fontSize: '11.5px',
          textAlign: 'center',
        }}
      >
        The six skipped experts still sit in GPU memory. You save the arithmetic, never the weights.
      </div>
    </DemoFrame>
  )
}
