'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

type Category =
  | 'config'
  | 'state'
  | 'binaries'
  | 'users'
  | 'boot'
  | 'virtual'
  | 'runtime'
  | 'mounts'

const COLORS: Record<
  Category,
  { light: { bg: string; text: string }; dark: { bg: string; text: string } }
> = {
  config: { light: { bg: '#f1f5f9', text: '#475569' }, dark: { bg: '#1e293b', text: '#94a3b8' } },
  state: { light: { bg: '#fefce8', text: '#92400e' }, dark: { bg: '#1c1917', text: '#d97706' } },
  binaries: { light: { bg: '#f0fdf4', text: '#166534' }, dark: { bg: '#052e16', text: '#4ade80' } },
  users: { light: { bg: '#faf5ff', text: '#6d28d9' }, dark: { bg: '#2e1065', text: '#c084fc' } },
  boot: { light: { bg: '#f8fafc', text: '#475569' }, dark: { bg: '#0f172a', text: '#64748b' } },
  virtual: { light: { bg: '#eff6ff', text: '#1d4ed8' }, dark: { bg: '#0f172a', text: '#93c5fd' } },
  runtime: { light: { bg: '#f0fdfa', text: '#0f766e' }, dark: { bg: '#042f2e', text: '#5eead4' } },
  mounts: { light: { bg: '#f8fafc', text: '#475569' }, dark: { bg: '#0f172a', text: '#64748b' } },
}

interface Node {
  path: string
  category: Category
}

const ROW1: Node[] = [
  { path: '/etc', category: 'config' },
  { path: '/var', category: 'state' },
  { path: '/usr', category: 'binaries' },
  { path: '/opt', category: 'binaries' },
  { path: '/home', category: 'users' },
  { path: '/root', category: 'users' },
  { path: '/boot', category: 'boot' },
]

const ROW2: Node[] = [
  { path: '/dev', category: 'virtual' },
  { path: '/proc', category: 'virtual' },
  { path: '/sys', category: 'virtual' },
  { path: '/run', category: 'runtime' },
  { path: '/tmp', category: 'runtime' },
  { path: '/mnt', category: 'mounts' },
]

function Badge({
  label,
  category,
  isDark,
}: {
  label: string
  category: Category
  isDark: boolean
}) {
  const c = isDark ? COLORS[category].dark : COLORS[category].light
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        fontSize: '10px',
        fontWeight: 500,
        padding: '1px 8px',
        borderRadius: '999px',
        fontFamily: 'system-ui, sans-serif',
        display: 'inline-block',
        marginTop: '4px',
      }}
    >
      {label}
    </span>
  )
}

export default function LinuxFSHierarchy() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  const borderColor = isDark ? '#374151' : '#d1d5db'
  const lineColor = isDark ? '#374151' : '#d1d5db'
  const textColor = isDark ? '#f9fafb' : '#111827'
  const mutedColor = isDark ? '#6b7280' : '#9ca3af'

  const W = 760
  const nodeW = 80
  const nodeH = 52
  const row1Y = 88
  const row2Y = 188
  const spineY1 = 72
  const spineY2 = 160

  const row1Xs = [44, 140, 236, 332, 428, 524, 620]
  const row2Xs = [92, 212, 332, 452, 572, 692]

  function NodeBox({ cx, y, node }: { cx: number; y: number; node: Node }) {
    const x = cx - nodeW / 2
    return (
      <>
        <rect
          x={x}
          y={y}
          width={nodeW}
          height={nodeH}
          rx={6}
          fill="none"
          stroke={borderColor}
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={y + 20}
          textAnchor="middle"
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11.5px',
            fontWeight: 600,
            fill: textColor,
          }}
        >
          {node.path}
        </text>
        {/* badge via foreignObject for proper React rendering */}
        <foreignObject x={x + 4} y={y + 26} width={nodeW - 8} height={20}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Badge label={node.category} category={node.category} isDark={isDark} />
          </div>
        </foreignObject>
      </>
    )
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
      <svg
        viewBox={`0 0 ${W} 270`}
        style={{ width: '100%', minWidth: 600, height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Root node */}
        <rect
          x={320}
          y={10}
          width={120}
          height={36}
          rx={7}
          fill="none"
          stroke={isDark ? '#6b7280' : '#9ca3af'}
          strokeWidth={2}
        />
        <text
          x={380}
          y={33}
          textAnchor="middle"
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '14px',
            fontWeight: 700,
            fill: textColor,
          }}
        >
          / (root)
        </text>

        {/* Trunk → spine 1 */}
        <line x1={380} y1={46} x2={380} y2={spineY1} stroke={lineColor} strokeWidth={1.5} />
        <line x1={44} y1={spineY1} x2={716} y2={spineY1} stroke={lineColor} strokeWidth={1.5} />

        {/* Drop lines row 1 */}
        {row1Xs.map((cx) => (
          <line
            key={cx}
            x1={cx}
            y1={spineY1}
            x2={cx}
            y2={row1Y}
            stroke={lineColor}
            strokeWidth={1.5}
          />
        ))}

        {/* Row 1 nodes */}
        {ROW1.map((node, i) => (
          <NodeBox key={node.path} cx={row1Xs[i]} y={row1Y} node={node} />
        ))}

        {/* Side pillars row1 bottom → spine 2 */}
        <line
          x1={44}
          y1={row1Y + nodeH}
          x2={44}
          y2={spineY2}
          stroke={lineColor}
          strokeWidth={1.5}
        />
        <line
          x1={716}
          y1={row1Y + nodeH}
          x2={716}
          y2={spineY2}
          stroke={lineColor}
          strokeWidth={1.5}
        />

        {/* Spine 2 */}
        <line x1={44} y1={spineY2} x2={716} y2={spineY2} stroke={lineColor} strokeWidth={1.5} />

        {/* Drop lines row 2 */}
        {row2Xs.map((cx) => (
          <line
            key={cx}
            x1={cx}
            y1={spineY2}
            x2={cx}
            y2={row2Y}
            stroke={lineColor}
            strokeWidth={1.5}
          />
        ))}

        {/* Row 2 nodes */}
        {ROW2.map((node, i) => (
          <NodeBox key={node.path} cx={row2Xs[i]} y={row2Y} node={node} />
        ))}

        {/* Legend */}
        <text
          x={4}
          y={258}
          style={{ fontSize: '10px', fill: mutedColor, fontFamily: 'system-ui, sans-serif' }}
        >
          All nodes are direct children of / · row 2 offset for readability
        </text>
      </svg>
    </div>
  )
}
