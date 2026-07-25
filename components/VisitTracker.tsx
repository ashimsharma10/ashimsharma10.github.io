'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL

/**
 * First-party page-view beacon. Fires a lightweight POST /track on every route
 * change so the Worker can count visits for the /ops "Site visits" chart. Uses a
 * text/plain body to stay a CORS-simple request (no preflight), and keepalive so
 * the ping survives the navigation. Renders nothing; no-ops if the chat API URL
 * isn't configured (e.g. local dev without the Worker).
 */
export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!API_URL || !pathname) return
    try {
      void fetch(`${API_URL}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      /* analytics must never break navigation */
    }
  }, [pathname])

  return null
}
