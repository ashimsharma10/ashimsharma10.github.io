'use client'

import { useState } from 'react'
import { DemoButton, DemoFrame, palette, useIsDark } from './quantum/shared'

// Every number below comes from a published model config, and the arithmetic is the
// formula from the post:
//
//   bytes per token = layers x elements per layer x bytes per element
//
// where "elements per layer" is 2 x kv_heads x head_dim for MHA and GQA (one key vector
// and one value vector for every KV head), and kv_lora_rank + qk_rope_head_dim for MLA,
// which stores a single shared latent vector plus a small positional tail instead.

const GB = 1e9 // decimal, the way both HBM capacity and parameter counts are quoted
const GPU_GB = 80 // one H100 / H200-class card, near enough
const OVERHEAD = 0.1 // activations, fragmentation, the engine itself

interface Model {
  id: string
  name: string
  layers: number
  weightsGB: number
  weightNote: string
  // MHA and GQA
  kvHeads?: number
  headDim?: number
  // MLA
  latent?: number
  rope?: number
  layout: 'MHA' | 'GQA' | 'MLA'
  defaultGpus: number
}

const MODELS: Model[] = [
  {
    id: 'l2-7b',
    name: 'Llama 2 7B',
    layout: 'MHA',
    layers: 32,
    kvHeads: 32,
    headDim: 128,
    weightsGB: 13.5,
    weightNote: '6.7B params at BF16',
    defaultGpus: 1,
  },
  {
    id: 'l3-8b',
    name: 'Llama 3 8B',
    layout: 'GQA',
    layers: 32,
    kvHeads: 8,
    headDim: 128,
    weightsGB: 16.1,
    weightNote: '8B params at BF16',
    defaultGpus: 1,
  },
  {
    id: 'l3-70b',
    name: 'Llama 3 70B',
    layout: 'GQA',
    layers: 80,
    kvHeads: 8,
    headDim: 128,
    weightsGB: 141,
    weightNote: '70B params at BF16',
    defaultGpus: 4,
  },
  {
    id: 'ds-v3',
    name: 'DeepSeek V3',
    layout: 'MLA',
    layers: 61,
    latent: 512,
    rope: 64,
    weightsGB: 671,
    weightNote: '671B params at FP8, how it ships',
    defaultGpus: 16,
  },
]

const CONTEXTS = [4096, 32768, 131072]
const CONTEXT_LABELS = ['4K', '32K', '128K']

function elementsPerLayer(m: Model): number {
  return m.layout === 'MLA' ? m.latent! + m.rope! : 2 * m.kvHeads! * m.headDim!
}

function formula(m: Model, dtypeBytes: number): string {
  const per = elementsPerLayer(m)
  if (m.layout === 'MLA') {
    return `${m.layers} layers x (${m.latent} latent + ${m.rope} rope) x ${dtypeBytes} B = ${(
      m.layers *
      per *
      dtypeBytes
    ).toLocaleString()} B/token`
  }
  return `${m.layers} layers x 2 x ${m.kvHeads} heads x ${m.headDim} dim x ${dtypeBytes} B = ${(
    m.layers *
    per *
    dtypeBytes
  ).toLocaleString()} B/token`
}

export default function KVCacheBudget() {
  const isDark = useIsDark()
  const p = palette(isDark)

  const [modelId, setModelId] = useState(MODELS[2].id)
  const [ctxIdx, setCtxIdx] = useState(1)
  const [fp8, setFp8] = useState(false)
  const [gpus, setGpus] = useState(MODELS[2].defaultGpus)

  const model = MODELS.find((m) => m.id === modelId)!
  const context = CONTEXTS[ctxIdx]
  const dtypeBytes = fp8 ? 1 : 2

  const bytesPerToken = model.layers * elementsPerLayer(model) * dtypeBytes
  const perSeqGB = (bytesPerToken * context) / GB

  const totalGB = gpus * GPU_GB
  const reservedGB = totalGB * OVERHEAD
  const freeGB = totalGB - reservedGB - model.weightsGB
  const seats = freeGB > 0 ? Math.floor(freeGB / perSeqGB) : 0
  const cacheGB = Math.max(0, seats * perSeqGB)
  const leftoverGB = Math.max(0, freeGB - cacheGB)

  const pick = (m: Model) => {
    setModelId(m.id)
    setGpus(m.defaultGpus)
  }

  // The bar is drawn in percentages of total HBM, so the segments always sum to the card.
  const pct = (gb: number) => `${Math.max(0, (gb / totalGB) * 100)}%`
  const segments =
    model.weightsGB > totalGB - reservedGB
      ? [
          { gb: totalGB - reservedGB, color: p.accent, key: 'w' },
          { gb: reservedGB, color: p.muted, key: 'o' },
        ]
      : [
          { gb: model.weightsGB, color: p.accent, key: 'w' },
          { gb: cacheGB, color: p.secondary, key: 'c' },
          { gb: leftoverGB, color: isDark ? '#334155' : '#e2e8f0', key: 'f' },
          { gb: reservedGB, color: p.muted, key: 'o' },
        ]

  const btnRow: React.CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap' }
  const label: React.CSSProperties = {
    color: p.muted,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  }

  return (
    <DemoFrame
      title="What one card actually holds"
      isDark={isDark}
      caption={
        <>
          Weights are fixed the moment you pick a model. The cache is the part that moves, and it is
          what decides how many people you can serve at once. Overhead is a flat 10 percent for
          activations and fragmentation.
        </>
      }
    >
      <div style={{ display: 'grid', gap: '14px' }}>
        <div>
          <div style={label}>Model</div>
          <div style={btnRow}>
            {MODELS.map((m) => (
              <DemoButton
                key={m.id}
                isDark={isDark}
                primary={m.id === modelId}
                onClick={() => pick(m)}
              >
                {m.name} · {m.layout}
              </DemoButton>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={label}>Context per request</div>
            <div style={btnRow}>
              {CONTEXT_LABELS.map((c, i) => (
                <DemoButton
                  key={c}
                  isDark={isDark}
                  primary={i === ctxIdx}
                  onClick={() => setCtxIdx(i)}
                >
                  {c}
                </DemoButton>
              ))}
            </div>
          </div>
          <div>
            <div style={label}>KV precision</div>
            <div style={btnRow}>
              <DemoButton isDark={isDark} primary={!fp8} onClick={() => setFp8(false)}>
                BF16
              </DemoButton>
              <DemoButton isDark={isDark} primary={fp8} onClick={() => setFp8(true)}>
                FP8
              </DemoButton>
            </div>
          </div>
          <div>
            <div style={label}>80 GB cards</div>
            <div style={{ ...btnRow, alignItems: 'center' }}>
              <DemoButton isDark={isDark} onClick={() => setGpus(Math.max(1, gpus - 1))}>
                −
              </DemoButton>
              <span
                style={{
                  color: p.text,
                  fontSize: '13px',
                  fontWeight: 700,
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                {gpus}
              </span>
              <DemoButton isDark={isDark} onClick={() => setGpus(Math.min(32, gpus + 1))}>
                +
              </DemoButton>
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '12px',
            color: p.text,
            background: p.panel,
            border: `1px solid ${p.border}`,
            borderRadius: '8px',
            padding: '10px 12px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {formula(model, dtypeBytes)}
        </div>

        <div>
          <div style={{ display: 'flex', height: '30px', borderRadius: '6px', overflow: 'hidden' }}>
            {segments.map((s) => (
              <div key={s.key} style={{ width: pct(s.gb), background: s.color }} />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              marginTop: '8px',
              fontSize: '12px',
              color: p.muted,
            }}
          >
            <span>
              <b style={{ color: p.accent }}>■</b> weights {model.weightsGB} GB
            </span>
            <span>
              <b style={{ color: p.secondary }}>■</b> KV cache {cacheGB.toFixed(1)} GB
            </span>
            <span>
              <b>■</b> overhead {reservedGB.toFixed(0)} GB
            </span>
            <span>of {totalGB} GB total</span>
          </div>
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
          One request at {CONTEXT_LABELS[ctxIdx]} needs{' '}
          <b>{perSeqGB < 1 ? `${(perSeqGB * 1024).toFixed(0)} MB` : `${perSeqGB.toFixed(1)} GB`}</b>{' '}
          of cache.
          <br />
          {seats > 0 ? (
            <>
              You can hold{' '}
              <b style={{ fontSize: '17px', color: p.good }}>{seats.toLocaleString()}</b> of them at
              once. {model.weightNote}.
            </>
          ) : (
            <>
              <b style={{ color: isDark ? '#fca5a5' : '#b91c1c' }}>
                The weights alone do not leave room for a single request.
              </b>{' '}
              Add cards. {model.weightNote}.
            </>
          )}
        </div>
      </div>
    </DemoFrame>
  )
}
