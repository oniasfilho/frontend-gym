import { formatShort } from '@/lib/format-value'
import type { Peek } from '@/lib/runner'

export type PeekGroup = { line?: number; label: string; values: unknown[] }

/** One group per line and label, in line order; peeks without a line go last. */
export function groupPeeks(peeks: Peek[]): PeekGroup[] {
  const groups = new Map<string, PeekGroup>()
  for (const peek of peeks) {
    const key = `${peek.line ?? ''}\n${peek.label}`
    const group = groups.get(key)
    if (group) group.values.push(peek.value)
    else groups.set(key, { line: peek.line, label: peek.label, values: [peek.value] })
  }
  return [...groups.values()].sort((a, b) => (a.line ?? Infinity) - (b.line ?? Infinity))
}

/** `label = value  ×N`, or `→ value` for a return. Shows the latest value. */
export function inlineText(group: PeekGroup) {
  const value = formatShort(group.values[group.values.length - 1])
  const count = group.values.length > 1 ? `  ×${group.values.length}` : ''
  return `${group.label === 'return' ? '→ ' : `${group.label} = `}${value}${count}`
}
