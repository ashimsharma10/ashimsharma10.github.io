'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && resolvedTheme === 'dark'
}

export interface DemoPalette {
  border: string
  bg: string
  panel: string
  text: string
  muted: string
  accent: string
  accentSoft: string
  secondary: string
  secondarySoft: string
  good: string
}

export function palette(isDark: boolean): DemoPalette {
  return isDark
    ? {
        border: '#374151',
        bg: '#111827',
        panel: '#1f2937',
        text: '#f9fafb',
        muted: '#9ca3af',
        accent: '#93c5fd',
        accentSoft: '#1e3a8a',
        secondary: '#fcd34d',
        secondarySoft: '#78350f',
        good: '#4ade80',
      }
    : {
        border: '#d1d5db',
        bg: '#ffffff',
        panel: '#f8fafc',
        text: '#111827',
        muted: '#6b7280',
        accent: '#1d4ed8',
        accentSoft: '#dbeafe',
        secondary: '#b45309',
        secondarySoft: '#fef3c7',
        good: '#166534',
      }
}

const FONT = 'system-ui, sans-serif'

export function DemoFrame({
  title,
  caption,
  isDark,
  children,
}: {
  title: string
  caption?: ReactNode
  isDark: boolean
  children: ReactNode
}) {
  const p = palette(isDark)
  return (
    <div
      className="not-prose my-6"
      style={{
        border: `1.5px solid ${p.border}`,
        borderRadius: '12px',
        background: p.bg,
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${p.border}`,
          background: p.panel,
          color: p.text,
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
      {caption && (
        <div style={{ padding: '0 16px 14px', color: p.muted, fontSize: '12px', lineHeight: 1.5 }}>
          {caption}
        </div>
      )}
    </div>
  )
}

export function DemoButton({
  onClick,
  isDark,
  primary = false,
  disabled = false,
  children,
}: {
  onClick: () => void
  isDark: boolean
  primary?: boolean
  disabled?: boolean
  children: ReactNode
}) {
  const p = palette(isDark)
  const kind: CSSProperties = primary
    ? {
        background: p.accent,
        color: isDark ? '#111827' : '#ffffff',
        border: `1.5px solid ${p.accent}`,
      }
    : { background: 'transparent', color: p.text, border: `1.5px solid ${p.border}` }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...kind,
        borderRadius: '8px',
        padding: '5px 12px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: FONT,
      }}
    >
      {children}
    </button>
  )
}
