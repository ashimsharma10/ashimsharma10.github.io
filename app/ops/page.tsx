'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL

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
  used_search: number
  total_ms: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
  model: string
}
interface Stats {
  totals: Totals
  recent: Trace[]
}

export default function OpsPage() {
  const [token, setToken] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'overview' | 'traces'>('overview')

  useEffect(() => {
    const saved = localStorage.getItem('ops_token')
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
      const res = await fetch(`${API_URL}/ops/stats`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.status === 401) throw new Error('Invalid token.')
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const data = (await res.json()) as Stats
      setStats(data)
      localStorage.setItem('ops_token', t)
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
        Usage, cost, and traces for the site assistant.
      </p>

      {/* Token gate */}
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
          {/* Tabs */}
          <div className="mt-8 flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {(['overview', 'traces'] as const).map((name) => (
              <button
                key={name}
                onClick={() => setTab(name)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize ${
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
              <Stat label="Est. cost" value={`$${t.cost_usd.toFixed(4)}`} />
              <Stat label="Avg latency" value={`${Math.round(t.avg_latency_ms)} ms`} />
              <Stat label="Input tokens" value={t.input_tokens.toLocaleString()} />
              <Stat label="Output tokens" value={t.output_tokens.toLocaleString()} />
              <Stat label="Search rate" value={`${Math.round(t.search_rate * 100)}%`} />
            </div>
          )}

          {tab === 'traces' && (
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
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-200">
                  {stats.recent.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
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
                    </tr>
                  ))}
                  {stats.recent.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400">
                        No traces yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
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
