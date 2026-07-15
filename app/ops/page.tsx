'use client'

import { Fragment, useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL
// Deep links to the external observability tools the Worker reports into.
// Langfuse: your project's traces dashboard. Cloudflare: the Worker's
// observability/analytics view. Both fall back to the vendor's top-level
// console if the specific project URL isn't configured for this build.
const LANGFUSE_URL = process.env.NEXT_PUBLIC_LANGFUSE_URL || 'https://us.cloud.langfuse.com'
const CLOUDFLARE_URL =
  process.env.NEXT_PUBLIC_CLOUDFLARE_DASH_URL ||
  'https://dash.cloudflare.com/?to=/:account/workers/services/view/ashim-chatbot/production/observability'

interface Totals {
  messages: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
  avg_latency_ms: number
  search_rate: number
}
interface Trace {
  id: string
  ts: number
  question: string
  answer: string | null
  used_search: number
  total_ms: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
  model: string
}
interface Stats {
  totals: Totals
  costs: {
    byComponent: { decision: number; rerank: number; generation: number }
    byModel: { model: string; cost: number; messages: number }[]
    daily: { day: string; cost: number; messages: number; avg_ms: number; searches: number }[]
  }
  rag: {
    averages: {
      vector_hits: number
      keyword_hits: number
      fused: number
      used: number
      overlap: number
      avg_score: number
    }
    topSources: { title: string; url: string; uses: number }[]
    latestEval: {
      ts: number
      total: number
      cand_ok: number
      ctx_ok: number
      ground_ok: number | null
      ground_total: number | null
      threshold: number
      passed: number
    } | null
  }
  recent: Trace[]
}

type Tab = 'overview' | 'costs' | 'rag' | 'traces' | 'observability'
const usd = (n: number) => `$${(n ?? 0).toFixed(4)}`

export default function OpsPage() {
  const [token, setToken] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    const saved = sessionStorage.getItem('ops_token')
    if (saved) {
      setToken(saved)
      void load(saved)
    }
  }, [])

  async function load(t: string) {
    if (!API_URL) {
      setError('NEXT_PUBLIC_CHAT_API_URL is not set for this build.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/ops/stats`, { headers: { Authorization: `Bearer ${t}` } })
      if (res.status === 401) throw new Error('Invalid token.')
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = (await res.json()) as Stats
      setStats(data)
      sessionStorage.setItem('ops_token', t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats.')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const t = stats?.totals

  return (
    <div className="mx-auto max-w-4xl py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Chatbot Ops</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Usage, cost, and retrieval metrics for the site assistant.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void load(token)
        }}
        className="mt-6 flex gap-2"
      >
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Ops token"
          className="flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-[#047857] focus:outline-none dark:border-gray-600 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !token}
          className="rounded-lg bg-[#047857] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-[#34D399] dark:text-gray-900"
        >
          {loading ? 'Loading…' : 'Load'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {stats && t && (
        <>
          <div className="mt-8 flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {(['overview', 'costs', 'rag', 'traces', 'observability'] as const).map((name) => (
              <button
                key={name}
                onClick={() => setTab(name)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium uppercase ${
                  tab === name
                    ? 'border-[#047857] text-[#047857] dark:border-[#34D399] dark:text-[#34D399]'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Messages" value={t.messages.toLocaleString()} />
              <Stat label="Est. cost" value={usd(t.cost_usd)} />
              <Stat label="Avg latency" value={`${Math.round(t.avg_latency_ms)} ms`} />
              <Stat label="Input tokens" value={t.input_tokens.toLocaleString()} />
              <Stat label="Output tokens" value={t.output_tokens.toLocaleString()} />
              <Stat label="Search rate" value={`${Math.round(t.search_rate * 100)}%`} />
            </div>
          )}

          {tab === 'costs' && <CostsTab costs={stats.costs} />}
          {tab === 'rag' && <RagTab rag={stats.rag} />}
          {tab === 'observability' && <ObservabilityTab totals={t} daily={stats.costs.daily} />}
          {tab === 'traces' && <TracesTab recent={stats.recent} />}
        </>
      )}
    </div>
  )
}

function TracesTab({ recent }: { recent: Trace[] }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-gray-500 dark:text-gray-400">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="py-2 pr-3">Time</th>
            <th className="py-2 pr-3">Question</th>
            <th className="py-2 pr-3">Search</th>
            <th className="py-2 pr-3">Latency</th>
            <th className="py-2 pr-3">Tokens</th>
            <th className="py-2 pr-3">Cost</th>
            <th className="py-2 pr-3">Model</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-gray-200">
          {recent.map((r) => {
            const isOpen = open === r.id
            return (
              <Fragment key={r.id}>
                <tr
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                >
                  <td className="py-2 pr-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    <span className="mr-1 inline-block text-gray-400">{isOpen ? '▾' : '▸'}</span>
                    {new Date(r.ts).toLocaleString()}
                  </td>
                  <td className="max-w-xs truncate py-2 pr-3" title={r.question}>
                    {r.question}
                  </td>
                  <td className="py-2 pr-3">{r.used_search ? '✓' : '—'}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{r.total_ms} ms</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {(r.input_tokens + r.output_tokens).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">${r.cost_usd.toFixed(5)}</td>
                  <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">{r.model}</td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                    <td colSpan={7} className="px-3 py-4">
                      <div className="space-y-3">
                        <div>
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                            Question
                          </p>
                          <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                            {r.question}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                            Generated answer
                          </p>
                          <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                            {r.answer || (
                              <span className="text-gray-400 italic dark:text-gray-500">
                                Not recorded for this trace.
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            Model: <span className="font-mono">{r.model}</span>
                          </span>
                          <span>Search: {r.used_search ? 'yes' : 'no'}</span>
                          <span>Latency: {r.total_ms} ms</span>
                          <span>
                            Tokens: {r.input_tokens.toLocaleString()} in /{' '}
                            {r.output_tokens.toLocaleString()} out
                          </span>
                          <span>Cost: ${r.cost_usd.toFixed(5)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {recent.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-gray-500 dark:text-gray-400">
                No traces yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Minimal responsive SVG line chart. The viewBox is stretched to the container
 * width (preserveAspectRatio="none"); strokes stay crisp via non-scaling-stroke,
 * and each series colours itself through `currentColor` so dark mode just works.
 */
function LineChart({
  labels,
  series,
}: {
  labels: string[]
  series: { values: number[]; className: string; dashed?: boolean; fill?: boolean }[]
}) {
  if (labels.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No data yet.</p>
  }
  const W = 600
  const H = 128
  const padTop = 10
  const padBottom = 6
  const n = labels.length
  const max = Math.max(...series.flatMap((s) => s.values), 1)
  const cx = (i: number) => ((i + 0.5) / n) * W
  const cy = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom)
  const linePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${cx(i).toFixed(1)} ${cy(v).toFixed(1)}`).join(' ')
  const areaPath = (vals: number[]) =>
    `${linePath(vals)} L ${cx(n - 1).toFixed(1)} ${H - padBottom} L ${cx(0).toFixed(1)} ${H - padBottom} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-32 w-full">
        {series.map((s, si) => (
          <g key={si} className={s.className}>
            {s.fill && <path d={areaPath(s.values)} fill="currentColor" opacity={0.1} />}
            <path
              d={linePath(s.values)}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-gray-400">
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}

function ObservabilityTab({ totals, daily }: { totals: Totals; daily: Stats['costs']['daily'] }) {
  const labels = daily.map((d) => d.day.slice(5))
  const line = 'text-[#047857] dark:text-[#34D399]'
  const tools = [
    {
      name: 'Langfuse',
      desc: 'Full request traces with per-component generations (decision, rerank, generation), token usage, cost, and retrieval spans.',
      href: LANGFUSE_URL,
      cta: 'Open Langfuse',
    },
    {
      name: 'Cloudflare',
      desc: 'Worker observability: invocations, CPU time, errors, and live logs for the ashim-chatbot Worker.',
      href: CLOUDFLARE_URL,
      cta: 'Open Cloudflare',
    },
  ]
  return (
    <div className="mt-6 space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total invocations" value={totals.messages.toLocaleString()} />
        <Stat label="Avg latency" value={`${Math.round(totals.avg_latency_ms)} ms`} />
        <Stat label="Search rate" value={`${Math.round(totals.search_rate * 100)}%`} />
        <Stat label="Est. total cost" value={usd(totals.cost_usd)} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Invocations (last 14 days)
        </h2>
        <LineChart
          labels={labels}
          series={[
            { values: daily.map((d) => d.messages), className: line, fill: true },
            { values: daily.map((d) => d.searches ?? 0), className: line, dashed: true },
          ]}
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="mr-1 inline-block h-0.5 w-4 bg-[#047857] align-middle dark:bg-[#34D399]" />
          invocations
          <span className="mr-1 ml-4 inline-block w-4 border-t-2 border-dashed border-[#047857] align-middle dark:border-[#34D399]" />
          with search
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Avg latency (last 14 days)
        </h2>
        <LineChart
          labels={labels}
          series={[{ values: daily.map((d) => d.avg_ms ?? 0), className: line, fill: true }]}
        />
      </section>

      <section className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          For deep per-request traces and infrastructure metrics, jump into the tools the Worker
          reports into:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-gray-200 p-5 transition-colors hover:border-[#047857] dark:border-gray-700 dark:hover:border-[#34D399]"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {tool.name}
              </h3>
              <p className="mt-1 flex-1 text-sm text-gray-500 dark:text-gray-400">{tool.desc}</p>
              <span className="mt-4 text-sm font-medium text-[#047857] group-hover:underline dark:text-[#34D399]">
                {tool.cta} →
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

function CostsTab({ costs }: { costs: Stats['costs'] }) {
  const comp = [
    { label: 'Tool decision', value: costs.byComponent.decision },
    { label: 'Reranking', value: costs.byComponent.rerank },
    { label: 'Generation', value: costs.byComponent.generation },
  ]
  const compMax = Math.max(...comp.map((c) => c.value), 1e-9)
  const dayMax = Math.max(...costs.daily.map((d) => d.cost), 1e-9)

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Cost by component
        </h2>
        <div className="space-y-2">
          {comp.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {c.label}
              </span>
              <div className="h-3 flex-1 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-3 rounded-full bg-[#047857] dark:bg-[#34D399]"
                  style={{ width: `${(c.value / compMax) * 100}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs text-gray-700 tabular-nums dark:text-gray-300">
                {usd(c.value)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Cost by model
        </h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500 dark:text-gray-400">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-3">Model</th>
              <th className="py-2 pr-3">Messages</th>
              <th className="py-2 pr-3">Cost</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 dark:text-gray-200">
            {costs.byModel.map((m) => (
              <tr key={m.model} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-3 font-mono text-xs">{m.model}</td>
                <td className="py-2 pr-3">{m.messages}</td>
                <td className="py-2 pr-3">{usd(m.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Daily cost (last 14 days)
        </h2>
        <div className="flex h-32 items-end gap-1">
          {costs.daily.map((d) => (
            <div
              key={d.day}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${d.day}: ${usd(d.cost)}`}
            >
              <div
                className="w-full rounded-t bg-[#047857] dark:bg-[#34D399]"
                style={{ height: `${Math.max((d.cost / dayMax) * 100, 2)}%` }}
              />
              <span className="text-[9px] text-gray-400">{d.day.slice(5)}</span>
            </div>
          ))}
          {costs.daily.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function RagTab({ rag }: { rag: Stats['rag'] }) {
  const a = rag.averages
  const e = rag.latestEval
  const pctOf = (num: number, den: number) => (den ? `${Math.round((num / den) * 100)}%` : '—')
  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Retrieval eval (regression gate)
        </h2>
        {e ? (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <span
                className={
                  e.passed
                    ? 'rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }
              >
                {e.passed ? 'PASS' : 'FAIL'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(e.ts).toLocaleString()} · gate ≥ {Math.round(e.threshold * 100)}%
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="recall@candidate" value={pctOf(e.cand_ok, e.total)} />
              <Stat label="recall@context" value={pctOf(e.ctx_ok, e.total)} />
              {e.ground_total != null && e.ground_ok != null && (
                <Stat label="answer grounding" value={pctOf(e.ground_ok, e.ground_total)} />
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {e.total} golden questions · recall@candidate = made the fused set, recall@context =
              survived rerank. Run <code>npm run eval</code> to refresh.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No eval run recorded yet. Run <code>npm run eval</code> to populate this.
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Avg vector hits" value={a.vector_hits.toFixed(1)} />
        <Stat label="Avg keyword hits" value={a.keyword_hits.toFixed(1)} />
        <Stat label="Avg fused" value={a.fused.toFixed(1)} />
        <Stat label="Avg chunks used" value={a.used.toFixed(1)} />
        <Stat label="Avg overlap" value={a.overlap.toFixed(1)} />
        <Stat label="Avg similarity" value={a.avg_score.toFixed(3)} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Most-cited sources
        </h2>
        <div className="space-y-2">
          {rag.topSources.map((s) => (
            <div key={s.url} className="flex items-center justify-between gap-3 text-sm">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[#047857] hover:underline dark:text-[#34D399]"
              >
                {s.title}
              </a>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {s.uses} uses
              </span>
            </div>
          ))}
          {rag.topSources.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No sources cited yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}
