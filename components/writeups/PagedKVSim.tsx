'use client'

import { useEffect, useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './quantum/shared'

// PagedAttention, animated. Two requests share a system prompt; their KV
// blocks land scattered across one physical pool, and the shared prefix is
// stored once. Fully scripted (no randomness): every frame is a pure function
// of the tick, so the first render is deterministic.
const TOTAL_TICKS = 14
const BLOCK_TOKENS = 16
const POOL_SIZE = 18
const OLD_RESERVE = 128 // tokens the pre-paging way reserved per request, up front

interface BlockDef {
  phys: number
  owner: 'A' | 'B'
  sharedFrom?: number // tick at which B cache-hits this block
  startTick: number
  fullTick: number
  cap: number // final fill fraction of the block
  label: string
}

// Allocation order is deliberately scattered: the pool does not care.
const BLOCKS: BlockDef[] = [
  { phys: 7, owner: 'A', sharedFrom: 6, startTick: 1, fullTick: 1, cap: 1, label: 'sys' },
  { phys: 3, owner: 'A', sharedFrom: 6, startTick: 1, fullTick: 1, cap: 1, label: 'sys' },
  { phys: 12, owner: 'A', startTick: 1, fullTick: 1, cap: 1, label: 'A prompt' },
  { phys: 5, owner: 'A', startTick: 2, fullTick: 5, cap: 1, label: 'A decode' },
  { phys: 14, owner: 'A', startTick: 6, fullTick: 9, cap: 0.75, label: 'A decode' },
  { phys: 1, owner: 'B', startTick: 6, fullTick: 6, cap: 1, label: 'B prompt' },
  { phys: 9, owner: 'B', startTick: 7, fullTick: 10, cap: 1, label: 'B decode' },
  { phys: 16, owner: 'B', startTick: 11, fullTick: 13, cap: 0.5, label: 'B decode' },
]

const MESSAGES: [number, string][] = [
  [0, 'Press play. Request A is about to arrive with a 48-token prompt.'],
  [1, 'Prefill: the prompt fills three 16-token blocks, wherever there was room. No contiguity.'],
  [2, 'Decode: one token per step. A new block is grabbed only when the current one fills.'],
  [
    6,
    'Request B arrives with the same system prompt. Cache hit: its first two logical blocks point at the SAME physical blocks. Refcount 2, nothing recomputed.',
  ],
  [7, 'Both requests decode into their own scattered blocks. The tables keep them apart.'],
  [11, 'A is done. Its only waste is the unfilled tail of its last block.'],
  [
    14,
    'Done. Compare the counters: the old way reserved a contiguous 128-token slab per request and stored the shared prefix twice.',
  ],
]

function fillOf(def: BlockDef, tick: number): number {
  if (tick < def.startTick) return 0
  const span = def.fullTick - def.startTick + 1
  return def.cap * Math.min(1, (tick - def.startTick + 1) / span)
}

function messageFor(tick: number): string {
  let msg = MESSAGES[0][1]
  for (const [t, m] of MESSAGES) if (tick >= t) msg = m
  return msg
}

export default function PagedKVSim() {
  const isDark = useIsDark()
  const p = palette(isDark)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTick((t) => {
        if (t >= TOTAL_TICKS) {
          setPlaying(false)
          return t
        }
        return t + 1
      })
    }, 520)
    return () => clearInterval(id)
  }, [playing])

  // Live token math, derived from the same schedule the pixels use.
  let usedTokens = 0
  let allocatedSlots = 0
  for (const def of BLOCKS) {
    const f = fillOf(def, tick)
    if (f > 0) {
      usedTokens += Math.round(f * BLOCK_TOKENS)
      allocatedSlots += BLOCK_TOKENS
    }
  }
  const shared = BLOCKS.filter((d) => d.sharedFrom !== undefined && tick >= d.sharedFrom)
  const sharedTokens = shared.length * BLOCK_TOKENS
  const pagedWaste = allocatedSlots - usedTokens
  const requestsArrived = tick >= 6 ? 2 : tick >= 1 ? 1 : 0
  // The old way: a contiguous max-length slab per request, prefix stored twice.
  const oldReserved = requestsArrived * OLD_RESERVE
  const oldWaste = Math.max(0, oldReserved - (usedTokens + sharedTokens))

  const ownerColors = (owner: 'A' | 'B', isShared: boolean) => {
    if (isShared) return { border: p.good, text: p.good }
    if (owner === 'A') return { border: p.accent, text: p.accent }
    return { border: p.secondary, text: p.secondary }
  }

  const chip = (def: BlockDef, forB: boolean) => {
    const isShared = def.sharedFrom !== undefined && tick >= def.sharedFrom
    const c = ownerColors(forB ? 'B' : def.owner, isShared)
    return (
      <span
        key={`${forB ? 'b' : 'a'}${def.phys}`}
        style={{
          border: `1px solid ${c.border}`,
          color: c.text,
          borderRadius: '4px',
          padding: '1px 5px',
          fontSize: '10px',
          fontWeight: 600,
          marginRight: '4px',
        }}
      >
        #{def.phys}
      </span>
    )
  }

  const aChips = BLOCKS.filter((d) => d.owner === 'A' && tick >= d.startTick)
  const bChips = BLOCKS.filter(
    (d) => (d.owner === 'B' || d.sharedFrom !== undefined) && tick >= 6 && tick >= d.startTick
  )

  return (
    <DemoFrame
      title="PagedAttention: one physical pool, two block tables"
      isDark={isDark}
      caption={
        <>
          Toy scale: 18 blocks of 16 tokens, and the old way reserves 128 tokens per request. Real
          deployments reserve for thousands of tokens per slot, which is how the waste reached 60 to
          80 percent of the cache before paging, and under 4 percent after.
        </>
      }
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
        <DemoButton isDark={isDark} primary onClick={() => setPlaying((v) => !v)}>
          {playing ? 'Pause' : tick >= TOTAL_TICKS ? 'Replay' : 'Play'}
        </DemoButton>
        <DemoButton
          isDark={isDark}
          onClick={() => {
            setPlaying(false)
            setTick(0)
          }}
        >
          Reset
        </DemoButton>
        <div style={{ fontSize: '11px', color: p.muted, marginLeft: 'auto' }}>
          tick {tick} / {TOTAL_TICKS}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '6px',
          marginBottom: '12px',
        }}
      >
        {Array.from({ length: POOL_SIZE }, (_, i) => {
          const def = BLOCKS.find((d) => d.phys === i)
          const f = def ? fillOf(def, tick) : 0
          const isShared = !!def && def.sharedFrom !== undefined && tick >= def.sharedFrom
          const c = def ? ownerColors(def.owner, isShared) : null
          const active = def && f > 0
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                height: '44px',
                borderRadius: '6px',
                border: active ? `1.5px solid ${c!.border}` : `1.5px dashed ${p.border}`,
                background: p.panel,
                overflow: 'hidden',
              }}
            >
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    top: `${(1 - f) * 100}%`,
                    width: '100%',
                    background: isDark ? `${c!.border}33` : `${c!.border}22`,
                    transition: 'top 0.4s',
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: active ? c!.text : p.muted,
                  lineHeight: 1.3,
                  textAlign: 'center',
                }}
              >
                <span>#{i}</span>
                {active && <span>{isShared ? 'shared x2' : def!.label}</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: '11px', color: p.text, marginBottom: '4px' }}>
        <span style={{ fontWeight: 700, color: p.accent }}>table A</span>{' '}
        {aChips.length ? (
          aChips.map((d) => chip(d, false))
        ) : (
          <span style={{ color: p.muted }}>empty</span>
        )}
      </div>
      <div style={{ fontSize: '11px', color: p.text, marginBottom: '12px' }}>
        <span style={{ fontWeight: 700, color: p.secondary }}>table B</span>{' '}
        {bChips.length ? (
          bChips.map((d) => chip(d, true))
        ) : (
          <span style={{ color: p.muted }}>empty</span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: p.text,
          padding: '8px 10px',
          background: p.panel,
          borderRadius: '8px',
          marginBottom: '10px',
        }}
      >
        <span>
          old contiguous way: <b>{oldWaste}</b> tokens wasted
        </span>
        <span>
          paged: <b>{pagedWaste}</b> wasted
        </span>
        <span>
          stored once instead of twice: <b>{sharedTokens}</b>
        </span>
      </div>

      <div style={{ fontSize: '12px', color: p.muted, minHeight: '32px' }}>{messageFor(tick)}</div>
    </DemoFrame>
  )
}
