'use client'

import { useEffect, useRef, useState } from 'react'

// Static user-site (served at root), so the public path resolves directly.
const AVATAR_SRC = '/static/images/avatar.png'

interface Source {
  title: string
  url: string
}
interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL

const SUGGESTIONS = [
  'What does Ashim work on?',
  'Tell me about his projects',
  'What has he written about MLOps?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Widget is disabled if no backend is configured (e.g. missing env at build).
  if (!API_URL) return null

  async function send(text: string) {
    const question = text.trim()
    if (!question || loading) return
    setInput('')
    const nextMessages: Message[] = [...messages, { role: 'user', content: question }]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // Read the SSE stream and append tokens to the last (assistant) message.
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const evt = JSON.parse(payload)
            if (evt.text) {
              setMessages((prev) => {
                const copy = [...prev]
                copy[copy.length - 1] = {
                  ...copy[copy.length - 1],
                  content: copy[copy.length - 1].content + evt.text,
                }
                return copy
              })
            } else if (evt.sources) {
              setMessages((prev) => {
                const copy = [...prev]
                copy[copy.length - 1] = { ...copy[copy.length - 1], sources: evt.sources }
                return copy
              })
            }
          } catch {
            /* ignore non-JSON keep-alives */
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          role: 'assistant',
          content: "Sorry — I couldn't reach the assistant right now. Please try again later.",
        }
        return copy
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Launcher button — avatar when closed, X when open */}
      <button
        aria-label={open ? 'Close chat' : 'Ask about Ashim'}
        onClick={() => setOpen((o) => !o)}
        className="fixed right-5 bottom-5 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
      >
        {open ? (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#047857] text-white dark:bg-[#34D399] dark:text-gray-900">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </span>
        ) : (
          <span className="relative block h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AVATAR_SRC}
              alt="Chat with Ashim"
              width={56}
              height={56}
              className="h-full w-full rounded-full object-cover ring-2 ring-[#047857] dark:ring-[#34D399]"
            />
            {/* online dot */}
            <span className="absolute right-0.5 bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed right-5 bottom-24 z-50 flex h-[70vh] max-h-[600px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Ask about Ashim</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              An AI assistant trained on Ashim's projects and writing.
            </p>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Try asking:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:border-[#047857] hover:text-[#047857] dark:border-gray-700 dark:text-gray-300 dark:hover:border-[#34D399] dark:hover:text-[#34D399]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'inline-block max-w-[85%] rounded-2xl bg-[#047857] px-3 py-2 text-sm text-white dark:bg-[#34D399] dark:text-gray-900'
                      : 'inline-block max-w-[85%] rounded-2xl bg-gray-100 px-3 py-2 text-sm whitespace-pre-wrap text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  }
                >
                  {m.content || (loading && i === messages.length - 1 ? '…' : '')}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-[#047857] hover:underline dark:bg-gray-800 dark:text-[#34D399]"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2 border-t border-gray-200 px-3 py-3 dark:border-gray-700"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-[#047857] focus:outline-none dark:border-gray-600 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-[#047857] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-[#34D399] dark:text-gray-900"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
