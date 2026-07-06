'use client'

import { useEffect, useRef, useState } from 'react'

// Static user-site (served at root), so the public path resolves directly.
const AVATAR_SRC = '/static/images/avatar.png'
const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL

// Minimal Web Speech API shape (avoids depending on lib.dom's experimental types).
interface SpeechRecognitionEventLike {
  results: { [i: number]: { [j: number]: { transcript: string } } }
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  onresult: (e: SpeechRecognitionEventLike) => void
  onend: () => void
  start: () => void
  stop: () => void
}

interface Source {
  title: string
  url: string
}
interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

// --- Suggestion chips (icon + label + the question it asks) ---
const IconExperience = (p: { className?: string }) => (
  <svg
    className={p.className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <rect x="3" y="7" width="18" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconRocket = (p: { className?: string }) => (
  <svg
    className={p.className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2m4.5-1.5 6-6a4 4 0 0 0-6-6l-6 6M9 13l2 2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="15" cy="9" r="1.3" />
  </svg>
)
const IconBadge = (p: { className?: string }) => (
  <svg
    className={p.className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconMail = (p: { className?: string }) => (
  <svg
    className={p.className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CHIPS = [
  {
    label: 'AI Experience',
    Icon: IconExperience,
    prompt: "What is Ashim's experience in AI and ML?",
  },
  { label: 'Top Projects', Icon: IconRocket, prompt: "What are Ashim's top projects?" },
  { label: 'Why hire him?', Icon: IconBadge, prompt: 'Why should someone hire Ashim?' },
  { label: 'Contact', Icon: IconMail, prompt: 'How can I get in touch with Ashim?' },
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Optional voice-to-text via the Web Speech API (Chrome/Safari). Degrades away.
  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e: SpeechRecognitionEventLike) => setInput(e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    setMicSupported(true)
  }, [])

  if (!API_URL) return null

  function toggleMic() {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) {
      rec.stop()
      setListening(false)
    } else {
      setListening(true)
      rec.start()
    }
  }

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
    } catch {
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
      {/* Launcher — avatar when closed, X when open */}
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
            <span className="absolute right-0.5 bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed right-5 bottom-24 z-50 flex h-[70vh] max-h-[600px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AVATAR_SRC}
                alt="Ashim"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Ashim Sharma</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ask me about my experience</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <>
                <div className="inline-block max-w-[90%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                  Hi! I'm{' '}
                  <span className="font-semibold text-[#047857] dark:text-[#34D399]">Ashim</span>.
                  Ask me anything: experience, projects, what drives me.
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {CHIPS.map(({ label, Icon, prompt }) => (
                    <button
                      key={label}
                      onClick={() => send(prompt)}
                      className="flex items-center gap-2 rounded-xl border border-[#047857]/40 px-3 py-2 text-left text-xs font-medium text-[#047857] transition-colors hover:bg-[#047857]/10 dark:border-[#34D399]/40 dark:text-[#34D399] dark:hover:bg-[#34D399]/10"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
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

          {/* Composer */}
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
              placeholder="Type your question…"
              className="w-0 min-w-0 flex-1 rounded-full border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-900 focus:border-[#047857] focus:outline-none dark:border-gray-600 dark:text-gray-100"
            />
            {micSupported && (
              <button
                type="button"
                onClick={toggleMic}
                aria-label="Voice input"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  listening
                    ? 'border-[#047857] bg-[#047857] text-white dark:border-[#34D399] dark:bg-[#34D399] dark:text-gray-900'
                    : 'border-gray-300 text-gray-500 hover:text-[#047857] dark:border-gray-600 dark:text-gray-400 dark:hover:text-[#34D399]'
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <rect
                    x="9"
                    y="3"
                    width="6"
                    height="11"
                    rx="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 11a7 7 0 0 0 14 0M12 18v3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#047857] text-white disabled:opacity-40 dark:bg-[#34D399] dark:text-gray-900"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path d="M4 12l16-8-6 16-3-6-7-2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
